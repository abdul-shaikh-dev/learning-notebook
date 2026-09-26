"""Offline, single-worker harness teaching reference. No network, shell or file tools.

Scripted proposals are not an LLM. FakeStore is volatile, not crash durable.
Approval methods and checkpoint strings are trusted-host interfaces, not public APIs.
Deadlines/cancellation are cooperative boundary checks, not hard preemption.
"""
from copy import deepcopy
import hashlib
import json
import math
import time


TERMINAL = {'done', 'denied', 'rejected', 'limited', 'cancelled', 'failed'}
ALL_STATES = TERMINAL | {'ready', 'waiting', 'uncertain'}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()


def bounded_text(value, name, limit=100):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ValueError(f'invalid {name}')
    return value


def integer(value, name, minimum=0, maximum=1000):
    if type(value) is not int or not minimum <= value <= maximum:
        raise ValueError(f'invalid {name}')
    return value


def duration(value, name):
    if type(value) not in (int, float) or not math.isfinite(value) or value < 0:
        raise ValueError(f'invalid {name}')
    return value


def exact_keys(value, expected):
    if not isinstance(value, dict) or set(value) != set(expected):
        raise ValueError('unexpected object fields')


def validate_action(action):
    if not isinstance(action, dict):
        raise ValueError('action must be an object')
    kind = action.get('kind')
    if kind == 'final':
        exact_keys(action, {'kind', 'text'})
        bounded_text(action['text'], 'final text', 2000)
        return
    exact_keys(action, {'kind', 'name', 'args', 'call_id'})
    if kind != 'tool':
        raise ValueError('unknown action kind')
    bounded_text(action['call_id'], 'call ID')
    name = action['name']
    if not isinstance(name, str) or name not in {'read_lesson', 'save_note'}:
        raise ValueError('unknown tool')
    expected = {'lesson_id'} if name == 'read_lesson' else {'lesson_id', 'text'}
    exact_keys(action['args'], expected)
    bounded_text(action['args']['lesson_id'], 'lesson ID')
    if name == 'save_note':
        bounded_text(action['args']['text'], 'note text', 1000)


class TransientReadError(Exception):
    """Fake adapter guarantees no effect occurred; retryable by the read policy."""


class UncertainOutcome(Exception):
    """The caller has no result. A fake store receipt may nevertheless exist."""


class IntentConflict(Exception):
    """An operation ID was reused with a different intent."""


class MissingResource(Exception):
    """Fake adapter guarantees rejection before any effect for this request."""


class FakeStore:
    """One process, one worker. A method couples fake effect and receipt locally."""
    def __init__(self, lessons=None):
        self.lessons = dict({'L1': 'Indexes trade read speed for write work.',
                             'L2': 'Transactions preserve related changes.'}
                            if lessons is None else lessons)
        self.notes = {}
        self.receipts = {}
        self.effect_count = 0
        self.transient_reads = 0
        self.lose_reply_once = False

    def read(self, lesson_id):
        if self.transient_reads:
            self.transient_reads -= 1
            raise TransientReadError('synthetic transient read')
        if lesson_id not in self.lessons:
            raise ValueError('lesson absent')
        return {'lesson_id': lesson_id, 'text': self.lessons[lesson_id][:2000],
                'truncated': len(self.lessons[lesson_id]) > 2000}

    def save(self, key, fingerprint, subject, args):
        existing = self.receipts.get(key)
        if existing:
            if existing['fingerprint'] != fingerprint:
                raise IntentConflict('same operation ID, different intent')
            return deepcopy(existing)
        if args['lesson_id'] not in self.lessons:
            raise MissingResource('lesson does not exist; no effect')
        note_id = f'N{self.effect_count + 1}'
        self.notes[note_id] = {'subject': subject, **deepcopy(args)}
        result = {'note_id': note_id, 'fingerprint': fingerprint}
        self.receipts[key] = result
        self.effect_count += 1
        if self.lose_reply_once:
            self.lose_reply_once = False
            raise UncertainOutcome('simulated response loss after local commit')
        return deepcopy(result)

    def lookup(self, key, fingerprint):
        result = self.receipts.get(key)
        if result is None:
            return None
        if result['fingerprint'] != fingerprint:
            raise IntentConflict('receipt does not match requested intent')
        return deepcopy(result)


class Harness:
    def __init__(self, script, store, *, subject='learner-a', run_id='run-1',
                 allowed_lessons=('L1', 'L2'), allow_write=True, max_steps=6,
                 max_seconds=30, read_attempts=2, clock=time.monotonic):
        if not isinstance(script, list) or len(script) > 100:
            raise ValueError('script must be a bounded list')
        # JSON round-trip excludes executable objects. This is trusted fixture input.
        self.script = json.loads(canonical(script))
        self.script_hash = digest(self.script)
        self.store = store
        self.subject = bounded_text(subject, 'subject')
        self.run_id = bounded_text(run_id, 'run ID')
        self.allowed_lessons = set(allowed_lessons)
        for item in self.allowed_lessons:
            bounded_text(item, 'allowed lesson ID')
        if type(allow_write) is not bool:
            raise ValueError('allow_write must be boolean')
        self.allow_write = allow_write
        self.max_steps = integer(max_steps, 'max_steps', 1, 100)
        self.max_seconds = duration(max_seconds, 'max_seconds')
        self.read_attempts = integer(read_attempts, 'read_attempts', 1, 5)
        self.clock = clock
        self.started = clock()
        self.prior_elapsed = 0
        self.status = 'ready'
        self.reason = None
        self.steps = 0
        self.cursor = 0
        self.pending = None
        self.approval = None
        self.cancel_requested = False
        self.events = []
        self.confirmed_notes = []
        self.last_result = None
        self.final_text = None

    def _event(self, event, action=None, category=None):
        # Explicit field allowlist: no note text, raw exceptions or full arguments.
        row = {'event': event, 'run_id': self.run_id, 'status': self.status}
        if action and action.get('kind') == 'tool':
            row.update(tool=action.get('name'), call_id=action.get('call_id'))
        if category:
            row['category'] = category
        self.events.append(row)

    def elapsed(self):
        return self.prior_elapsed + max(0, self.clock() - self.started)

    def _stop(self, status, reason):
        self.status, self.reason = status, reason
        self.approval = None
        self._event('run_stopped', category=reason)

    def _boundary(self):
        if self.status in TERMINAL:
            return False
        if self.status == 'uncertain':
            # Stopping future work cannot turn an unknown effect into a known failure.
            if self.cancel_requested:
                self.reason = 'cancelled_pending_reconciliation'
            elif self.elapsed() >= self.max_seconds:
                self.reason = 'expired_pending_reconciliation'
            return False
        if self.cancel_requested:
            self._stop('cancelled', 'host_cancelled')
            return False
        if self.elapsed() >= self.max_seconds:
            self._stop('limited', 'elapsed_budget')
            return False
        return True

    def _authorize(self, action):
        args = action['args']
        return args['lesson_id'] in self.allowed_lessons and (
            action['name'] != 'save_note' or self.allow_write)

    def fingerprint(self, action=None):
        action = self.pending if action is None else action
        if action is None:
            raise ValueError('no pending intent')
        return digest({'run': self.run_id, 'subject': self.subject, 'action': action})

    def _key(self, action):
        return (self.subject, self.run_id, action['call_id'])

    def _validate_receipt(self, action, result):
        exact_keys(result, {'note_id', 'fingerprint'})
        bounded_text(result['note_id'], 'note receipt ID')
        if result['fingerprint'] != self.fingerprint(action):
            raise ValueError('receipt fingerprint mismatch')

    def _confirmed(self, action, result):
        self.last_result = deepcopy(result)
        if action['name'] == 'save_note' and result['note_id'] not in self.confirmed_notes:
            self.confirmed_notes.append(result['note_id'])
        self._event('tool_confirmed', action)
        self.cursor += 1
        self.pending = None
        self.approval = None
        self.status = 'ready'
        # Preserve actual confirmed effect even if the call exhausted elapsed time.
        self._boundary()

    def _dispatch(self, action):
        if not self._boundary():
            return
        try:
            validate_action(action)
            if action['kind'] != 'tool':
                raise ValueError('dispatch requires a tool action')
        except ValueError:
            self._stop('rejected', 'invalid_action')
            return
        if not self._authorize(action):
            self._stop('denied', 'resource_policy')
            return
        if action['name'] == 'save_note':
            if self.approval != self.fingerprint(action):
                self.status = 'waiting'
                self._event('approval_requested', action)
                return
            # Consume before invocation; uncertain effects are never auto-replayed.
            self.approval = None
            self._event('tool_started', action)
            try:
                result = self.store.save(self._key(action), self.fingerprint(action),
                                         self.subject, action['args'])
                self._validate_receipt(action, result)
            except IntentConflict:
                self._stop('rejected', 'intent_conflict')
            except MissingResource:
                self._stop('rejected', 'missing_resource')
            except Exception:
                # Conservative for a write: an unclassified failure may follow an effect.
                self.status = 'uncertain'
                self._event('outcome_uncertain', action)
            else:
                self._confirmed(action, result)
            return
        for attempt in range(self.read_attempts):
            if not self._boundary():
                return
            self._event('tool_started', action)
            try:
                result = self.store.read(action['args']['lesson_id'])
            except TransientReadError:
                self._event('tool_retryable', action, 'transient_read')
                if attempt + 1 == self.read_attempts:
                    self._stop('failed', 'read_attempt_budget')
            except Exception:
                self._stop('failed', 'read_adapter_error')
                return
            else:
                self._confirmed(action, result)
                return

    def run(self):
        while self._boundary() and self.status == 'ready':
            if self.steps >= self.max_steps:
                self._stop('limited', 'step_budget')
                break
            if self.cursor >= len(self.script):
                self._stop('failed', 'script_exhausted_without_final')
                break
            action = deepcopy(self.script[self.cursor])
            self.steps += 1
            try:
                validate_action(action)
            except ValueError:
                self._stop('rejected', 'invalid_action')
                break
            self._event('proposal_received', action)
            if action['kind'] == 'final':
                self.final_text = action['text']
                self.cursor += 1
                self.status = 'done'
                self._event('run_completed')
                break
            self.pending = action
            self._dispatch(action)
        return self.status

    def approve(self, reviewed_fingerprint):
        """Trusted-host interface; not a public token-based authentication service."""
        if self.status != 'waiting' or not self._boundary():
            raise ValueError('run is not awaiting approval')
        if reviewed_fingerprint != self.fingerprint():
            self._event('approval_mismatch', self.pending)
            raise ValueError('approval does not match exact pending intent')
        self.approval = reviewed_fingerprint
        self._event('approval_granted', self.pending)
        self._dispatch(self.pending)
        return self.status

    def deny(self):
        if self.status != 'waiting':
            raise ValueError('run is not awaiting approval')
        self._event('approval_denied', self.pending)
        self._stop('denied', 'host_denied')

    def cancel(self):
        self.cancel_requested = True
        self._boundary()

    def reconcile(self):
        """Trusted receipt lookup, never a blind reissue of the write."""
        if self.status != 'uncertain':
            raise ValueError('run has no uncertain operation')
        action = self.pending
        # Current resource permission still governs the lookup.
        if not self._authorize(action):
            self._event('reconciliation_denied', action)
            return False
        try:
            result = self.store.lookup(self._key(action), self.fingerprint(action))
        except IntentConflict:
            self._event('reconciliation_conflict', action)
            return False
        if result is None:
            self._event('reconciliation_unresolved', action)
            return False
        try:
            self._validate_receipt(action, result)
        except ValueError:
            self._event('reconciliation_invalid_receipt', action)
            return False
        self._confirmed(action, result)
        return True

    def checkpoint(self):
        """Sensitive trusted-host JSON; no file I/O, signing, encryption or approval."""
        return canonical({'version': 1, 'run_id': self.run_id, 'subject': self.subject,
                          'script_hash': self.script_hash, 'status': self.status,
                          'cursor': self.cursor, 'steps': self.steps,
                          'elapsed': self.elapsed(), 'pending': self.pending,
                          'cancel_requested': self.cancel_requested,
                          'confirmed_notes': self.confirmed_notes})

    @classmethod
    def restore(cls, snapshot, script, store, *, expected_run_id, subject, **policy):
        """Only trusted snapshots. Validation is NOT authentication or tamper proofing.

        Host supplies current policy, identity and expected run. Offline time does not
        count in this toy; elapsed active/pause time already captured does. Production
        systems need an explicit durable wall-clock/expiry and integrity contract.
        """
        if not isinstance(snapshot, str) or len(snapshot) > 64000:
            raise ValueError('invalid checkpoint size')
        try:
            data = json.loads(snapshot)
        except (ValueError, TypeError) as error:
            raise ValueError('invalid checkpoint JSON') from error
        exact_keys(data, {'version', 'run_id', 'subject', 'script_hash', 'status', 'cursor',
                          'steps', 'elapsed', 'pending', 'cancel_requested', 'confirmed_notes'})
        if type(data['version']) is not int or data['version'] != 1:
            raise ValueError('unsupported checkpoint version')
        if data['run_id'] != expected_run_id or data['subject'] != subject:
            raise ValueError('checkpoint identity mismatch')
        new = cls(script, store, run_id=expected_run_id, subject=subject, **policy)
        if data['script_hash'] != new.script_hash:
            raise ValueError('checkpoint script mismatch')
        if not isinstance(data['status'], str) or data['status'] not in ALL_STATES:
            raise ValueError('invalid checkpoint state')
        cursor = integer(data['cursor'], 'cursor', 0, len(script))
        steps = integer(data['steps'], 'steps', 0, 100)
        if not cursor <= steps <= cursor + 1:
            raise ValueError('inconsistent checkpoint counters')
        elapsed = duration(data['elapsed'], 'elapsed')
        if type(data['cancel_requested']) is not bool:
            raise ValueError('invalid cancellation flag')
        pending = data['pending']
        if data['status'] in {'waiting', 'uncertain'}:
            validate_action(pending)
            if pending['kind'] != 'tool' or pending['name'] != 'save_note':
                raise ValueError('invalid pending operation')
            if cursor >= len(script) or steps != cursor + 1 or pending != script[cursor]:
                raise ValueError('pending operation does not match script position')
        elif data['status'] == 'ready' and (pending is not None or cursor != steps):
            raise ValueError('invalid ready checkpoint')
        notes = data['confirmed_notes']
        if not isinstance(notes, list) or len(notes) > 100:
            raise ValueError('invalid receipt references')
        for note in notes:
            bounded_text(note, 'note reference')
        if len(set(notes)) != len(notes):
            raise ValueError('duplicate receipt reference')
        new.status, new.cursor, new.steps = data['status'], cursor, steps
        new.pending, new.confirmed_notes = deepcopy(pending), list(notes)
        new.prior_elapsed = elapsed
        new.cancel_requested = data['cancel_requested']
        new._event('checkpoint_restored')
        return new


def tool(name, args, call_id):
    return {'kind': 'tool', 'name': name, 'args': args, 'call_id': call_id}


def demo():
    store = FakeStore()
    script = [tool('read_lesson', {'lesson_id': 'L1'}, 'C1'),
              tool('save_note', {'lesson_id': 'L1', 'text': 'Review index write costs.'}, 'C2'),
              {'kind': 'final', 'text': 'The demo reached its final scripted step.'}]
    run = Harness(script, store)
    print('Initial:', run.run())
    print('Pending:', canonical(run.pending))
    # Explicit trusted-host decision in this synthetic demo, not model approval.
    run.approve(run.fingerprint())
    print('After reviewed fake save:', run.run())
    print('Confirmed note IDs:', run.confirmed_notes)
    print('Fake effect count:', store.effect_count)
    print('No LLM, network, shell or application file tool was used.')


if __name__ == '__main__':
    demo()
