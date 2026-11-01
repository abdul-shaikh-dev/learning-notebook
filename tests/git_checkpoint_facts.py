"""Fact checks for the Git & Team Workflows checkpoint answers.

Each fact builds a fresh repository with the course's own Sandbox, runs real Git and returns the text of
the option its result supports. The script fails if that differs from the authored correct option.
Run with Python 3.11+ and Git 2.28+: python tests/git_checkpoint_facts.py
"""
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'git-team-workflows'
sys.path.insert(0, str(COURSE))
from sandbox import Sandbox  # noqa: E402

# Answers that follow from the lesson text rather than Git behaviour.
SOURCED = {'team-release-review/2': 'Team policy and recovery, lesson 20'}


def raw(box, repo, *args):
    """Run Git like Sandbox.run but keep exact output, including leading spaces, and the exit code."""
    command = [box.git, '-c', 'user.name=Notebook Learner', '-c', 'user.email=learner@example.invalid',
               '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', '-c', 'core.editor=true', *args]
    result = subprocess.run(command, cwd=repo, env=box.env, text=True, encoding='utf-8', capture_output=True, timeout=30)
    return result.returncode, result.stdout, result.stderr


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def started(box, name, text='one\n'):
    repo = box.repo(name)
    box.put(repo, 'notes.txt', text)
    box.commit(repo, 'Start')
    return repo


def safe_sandbox(box):
    repo = started(box, 'identity')
    box.put(repo, 'notes.txt', 'two\n'); box.run(repo, 'add', 'notes.txt')
    box.run(repo, '-c', 'user.name=Fixture', 'commit', '-m', 'Scoped identity')
    code, out, _ = raw(box, repo, 'config', '--global', 'user.name')
    return pick((code, out), {(1, ''): 'Nothing; the -c value applied only to that one command'})


def three_states(box):
    repo = started(box, 'states')
    box.put(repo, 'notes.txt', 'two\n'); box.run(repo, 'add', 'notes.txt'); box.put(repo, 'notes.txt', 'three\n')
    diff = raw(box, repo, 'diff')[1]
    changed = (re.search(r'^-(\w+)$', diff, re.M).group(1), re.search(r'^\+(\w+)$', diff, re.M).group(1))
    return pick(changed, {('two', 'three'): 'The change from two to three', ('one', 'two'): 'The change from one to two'})


def inspect_changes(box):
    repo = box.repo('inspect')
    box.put(repo, 'a.txt', 'a\n'); box.put(repo, 'b.txt', 'b\n'); box.commit(repo, 'Start')
    box.put(repo, 'a.txt', 'a2\n'); box.run(repo, 'add', 'a.txt'); box.put(repo, 'b.txt', 'b2\n')
    found = [opt for opt, args in [('git diff --cached --name-only', ('diff', '--cached', '--name-only')), ('git diff --name-only', ('diff', '--name-only'))]
             if raw(box, repo, *args)[1] == 'a.txt\n']
    return found[0]


def coherent_commits(box):
    repo = started(box, 'coherent')
    box.put(repo, 'parser.py', 'def parse(): pass\n'); box.run(repo, 'add', 'parser.py')
    box.put(repo, 'notes.txt', 'edited\n'); box.run(repo, 'commit', '-m', 'Add parser')
    return pick(raw(box, repo, 'status', '--short')[1], {' M notes.txt\n': ' M notes.txt: modified, still not staged'})


def ignore_secrets(box):
    repo = box.repo('ignore')
    box.put(repo, '.gitignore', 'local.env\n'); box.commit(repo, 'Ignore local settings')
    box.put(repo, 'local.env', 'TOKEN=synthetic\n')
    return pick(raw(box, repo, 'status', '--short')[1], {'': 'Nothing for local.env'})


def merged(box, name, fast=False):
    repo = started(box, name)
    box.run(repo, 'switch', '-c', 'topic'); box.put(repo, 'topic.txt', 't\n'); box.commit(repo, 'Topic work')
    box.run(repo, 'switch', 'main')
    if not fast:
        box.put(repo, 'main.txt', 'm\n'); box.commit(repo, 'Main work')
    return repo


def history_refs(box):
    repo = merged(box, 'parents', fast=True)
    box.run(repo, 'merge', '--no-ff', '-m', 'Merge topic', 'topic')
    return str(len(box.run(repo, 'log', '--pretty=%P', '-n', '1').split()))


def branch_switch(box):
    repo = started(box, 'switch')
    main = box.run(repo, 'rev-parse', 'main'); box.run(repo, 'switch', '-c', 'feature')
    return pick(box.run(repo, 'rev-parse', 'feature') == main, {True: 'The same commit as main'})


def restore_staging(box):
    repo = started(box, 'restore')
    box.put(repo, 'notes.txt', 'edited\n'); box.run(repo, 'restore', '--', 'notes.txt')
    status = raw(box, repo, 'status', '--short')[1]
    return pick(((repo / 'notes.txt').read_text(encoding='utf-8'), status), {('one\n', ''): 'Discards the edit, restoring the file from the index'})


def merge_integration(box):
    repo = merged(box, 'fastforward', fast=True)
    box.run(repo, 'merge', 'topic')
    parents = len(box.run(repo, 'log', '--pretty=%P', '-n', '1').split())
    same = box.run(repo, 'rev-parse', 'main') == box.run(repo, 'rev-parse', 'topic')
    return pick((same, parents), {(True, 1): "Moves main forward to topic's commit, with no merge commit"})


def conflicted(box, name):
    repo = box.repo(name)
    box.put(repo, 'config.txt', 'size=4\n'); box.commit(repo, 'Start')
    box.run(repo, 'switch', '-c', 'topic'); box.put(repo, 'config.txt', 'size=8\n'); box.commit(repo, 'Topic size')
    box.run(repo, 'switch', 'main'); box.put(repo, 'config.txt', 'size=6\n'); box.commit(repo, 'Main size')
    return repo


def conflict_resolution(box):
    repo = conflicted(box, 'conflict')
    code = raw(box, repo, 'merge', 'topic')[0]
    return pick((code, raw(box, repo, 'status', '--short')[1]), {(1, 'UU config.txt\n'): 'UU config.txt'})


def with_origin(box, name):
    origin = started(box, name + '-origin')
    clone = box.root / (name + '-clone')
    box.run(box.root, 'clone', str(origin), str(clone))
    for n in (2, 3):
        box.put(origin, 'notes.txt', f'{n}\n'); box.commit(origin, f'Remote {n}')
    box.run(clone, 'fetch')
    return clone


def remotes_fetch(box):
    clone = with_origin(box, 'behind')
    status = raw(box, clone, 'status')[1]
    return pick(bool(re.search(r"behind 'origin/main' by 2 commits, and can be fast-forwarded", status)), {True: 'Behind origin/main by 2 commits and can be fast-forwarded'})


def pull_request_review(box):
    repo = started(box, 'threedots')
    box.run(repo, 'switch', '-c', 'feature'); box.put(repo, 'feature.txt', 'f\n'); box.commit(repo, 'Feature')
    box.run(repo, 'switch', 'main'); box.put(repo, 'other.txt', 'o\n'); box.commit(repo, 'Other')
    three = box.run(repo, 'diff', '--name-status', 'main...feature')
    two = box.run(repo, 'diff', '--name-status', 'main..feature')
    assert 'D\tother.txt' in two, 'two dots show main\'s change reversed'
    return pick(three, {'A\tfeature.txt': "Only feature's changes since the common ancestor"})


def revert_reset(box):
    repo = started(box, 'revert', 'alpha\n')
    box.put(repo, 'notes.txt', 'alpha\nbeta\n'); box.commit(repo, 'Add beta')
    box.run(repo, 'revert', '--no-edit', 'HEAD')
    count = box.run(repo, 'rev-list', '--count', 'HEAD')
    return pick((count, (repo / 'notes.txt').read_text(encoding='utf-8')), {('3', 'alpha\n'): 'A new commit that removes the line; the original stays in history'})


def reflog_recovery(box):
    repo = started(box, 'reflog')
    box.put(repo, 'notes.txt', 'two\n'); lost = box.commit(repo, 'Second')
    box.run(repo, 'reset', '--hard', 'HEAD~1')
    return pick(box.run(repo, 'rev-parse', 'HEAD@{1}') == lost, {True: 'HEAD@{1}'})


def linear(box, name, count):
    repo = started(box, name, '0\n')
    ids = [box.run(repo, 'rev-parse', 'HEAD')]
    for n in range(1, count + 1):
        box.put(repo, 'notes.txt', f'{n}\n'); ids.append(box.commit(repo, f'Step {n}'))
    return repo, ids


def bisect(box):
    repo, ids = linear(box, 'bisect', 16)
    out = box.run(repo, 'bisect', 'start', ids[-1], ids[0])
    steps = int(re.search(r'roughly (\d+) steps?', out).group(1))
    box.run(repo, 'bisect', 'reset')
    assert '7 revisions left to test after this' in out, out
    return str(steps)


def cherry_pick(box):
    repo = started(box, 'cherry')
    box.run(repo, 'switch', '-c', 'fix'); box.put(repo, 'fix.txt', 'fixed\n'); fix = box.commit(repo, 'Fix it')
    box.run(repo, 'switch', 'main'); box.run(repo, 'cherry-pick', '-x', fix)
    message = box.run(repo, 'log', '--pretty=%B', '-n', '1')
    return pick(f'(cherry picked from commit {fix})' in message, {True: 'A line naming C: (cherry picked from commit followed by C\'s ID)'})


def rebase(box):
    repo = started(box, 'rebase')
    box.run(repo, 'switch', '-c', 'topic')
    before = []
    for n in range(3):
        box.put(repo, f't{n}.txt', f'{n}\n'); before.append(box.commit(repo, f'Topic {n}'))
    box.run(repo, 'switch', 'main'); box.put(repo, 'main.txt', 'm\n'); box.commit(repo, 'Main')
    box.run(repo, 'switch', 'topic'); box.run(repo, 'rebase', 'main')
    after = box.run(repo, 'rev-list', 'main..topic').split()
    return pick((len(after), not set(after) & set(before)), {(3, True): '3, each with a new ID'})


def stash(box):
    repo = started(box, 'stash')
    box.put(repo, 'notes.txt', 'edited\n'); box.run(repo, 'stash')
    return pick(raw(box, repo, 'status', '--short')[1], {'': 'Nothing: the working tree matches HEAD'})


def tags_release(box):
    repo = started(box, 'describe')
    box.run(repo, 'tag', '-a', 'v1.0', '-m', 'Release 1.0')
    box.put(repo, 'notes.txt', 'next\n'); head = box.commit(repo, 'After release')
    described = box.run(repo, 'describe')
    match = re.fullmatch(r'v1\.0-1-g([0-9a-f]+)', described)
    return pick(bool(match) and head.startswith(match.group(1)), {True: 'v1.0-1-g followed by the short commit ID'})


def foundation_status(box):
    repo = started(box, 'mm')
    box.put(repo, 'notes.txt', 'two\n'); box.run(repo, 'add', 'notes.txt'); box.put(repo, 'notes.txt', 'three\n')
    return pick(raw(box, repo, 'status', '--short')[1], {'MM notes.txt\n': 'MM notes.txt'})


def foundation_amend(box):
    repo = started(box, 'amend')
    box.put(repo, 'notes.txt', 'two\n'); old = box.commit(repo, 'Draft message')
    parent = box.run(repo, 'rev-parse', 'HEAD~1')
    box.run(repo, 'commit', '--amend', '-m', 'Better message')
    new, new_parent = box.run(repo, 'rev-parse', 'HEAD'), box.run(repo, 'rev-parse', 'HEAD~1')
    return pick((new != old, new_parent == parent), {(True, True): 'A new commit with a new ID replaces it on the branch, with the same parent'})


def foundation_parents(box):
    repo = started(box, 'parentlog')
    parent = box.run(repo, 'rev-parse', 'HEAD')
    box.put(repo, 'notes.txt', 'two\n'); box.commit(repo, 'Second')
    return pick(box.run(repo, 'log', '--pretty=%P', '-n', '1') == parent, {True: 'git log --pretty=%P -n 1'})


def intermediate_clean_merge(box):
    repo = box.repo('distant')
    lines = [f'line {n}' for n in range(1, 11)]
    box.put(repo, 'config.txt', '\n'.join(lines) + '\n'); box.commit(repo, 'Start')
    box.run(repo, 'switch', '-c', 'topic'); box.put(repo, 'config.txt', '\n'.join(['LINE 1', *lines[1:]]) + '\n'); box.commit(repo, 'Topic edits line 1')
    box.run(repo, 'switch', 'main'); box.put(repo, 'config.txt', '\n'.join([*lines[:-1], 'LINE 10']) + '\n'); box.commit(repo, 'Main edits line 10')
    code = raw(box, repo, 'merge', '-m', 'Merge topic', 'topic')[0]
    parents = len(box.run(repo, 'log', '--pretty=%P', '-n', '1').split())
    return pick((code, parents), {(0, 2): 'Merges cleanly and creates a merge commit'})


def intermediate_revert_merge(box):
    repo = merged(box, 'revertmerge')
    box.run(repo, 'merge', '-m', 'Merge topic', 'topic')
    code, _, err = raw(box, repo, 'revert', '--no-edit', 'HEAD')
    return pick((code != 0, 'no -m option was given' in err), {(True, True): 'Git refuses until -m names the parent to keep'})


def intermediate_range(box):
    clone = with_origin(box, 'range')
    listed = box.run(clone, 'log', '--pretty=%s', 'main..origin/main')
    return pick(listed, {'Remote 3\nRemote 2': 'Commits on origin/main that main does not have'})


def advanced_lightweight(box):
    repo = started(box, 'lightweight')
    box.run(repo, 'tag', 'v1.0')
    return pick(box.run(repo, 'cat-file', '-t', 'v1.0'), {'commit': 'commit: a lightweight tag points straight at the commit'})


def advanced_bisect_skip(box):
    repo, ids = linear(box, 'skip', 8)
    script = box.root / 'check.py'
    # Revision 4 cannot be tested; 6 and later are bad.
    script.write_text('from pathlib import Path\nimport sys\nn = int(Path("notes.txt").read_text())\nsys.exit(125 if n == 4 else 1 if n >= 6 else 0)\n', encoding='utf-8')
    box.run(repo, 'bisect', 'start', ids[-1], ids[0])
    box.run(repo, 'bisect', 'run', sys.executable, str(script))
    log = box.run(repo, 'bisect', 'log'); box.run(repo, 'bisect', 'reset')
    return pick('git bisect skip' in log, {True: 'Skips it as untestable'})


def advanced_empty_pick(box):
    repo = started(box, 'emptypick')
    box.run(repo, 'switch', '-c', 'fix'); box.put(repo, 'fix.txt', 'fixed\n'); fix = box.commit(repo, 'Fix it')
    box.run(repo, 'switch', 'main'); box.put(repo, 'fix.txt', 'fixed\n'); box.commit(repo, 'Same fix applied by hand')
    code, out, err = raw(box, repo, 'cherry-pick', fix)
    return pick((code != 0, 'empty' in out + err), {(True, True): 'Stops and reports that the cherry-pick is empty'})


FACTS = {
    'safe-sandbox/2': safe_sandbox, 'three-states/2': three_states, 'inspect-changes/2': inspect_changes,
    'coherent-commits/2': coherent_commits, 'ignore-secrets/2': ignore_secrets, 'history-refs/2': history_refs,
    'branch-switch/2': branch_switch, 'restore-staging/2': restore_staging, 'merge-integration/2': merge_integration,
    'conflict-resolution/2': conflict_resolution, 'remotes-fetch/2': remotes_fetch, 'pull-request-review/2': pull_request_review,
    'revert-reset/2': revert_reset, 'reflog-recovery/2': reflog_recovery, 'bisect/2': bisect, 'cherry-pick/2': cherry_pick,
    'rebase/2': rebase, 'stash/2': stash, 'tags-release/2': tags_release,
    'stage/foundation/1': foundation_status, 'stage/foundation/2': foundation_amend, 'stage/foundation/3': foundation_parents,
    'stage/intermediate/1': intermediate_clean_merge, 'stage/intermediate/2': intermediate_revert_merge, 'stage/intermediate/3': intermediate_range,
    'stage/advanced/1': advanced_lightweight, 'stage/advanced/2': advanced_bisect_skip, 'stage/advanced/3': advanced_empty_pick,
}


def questions():
    data = json.loads((COURSE / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def main():
    seen, failures = set(), []
    with tempfile.TemporaryDirectory(prefix='git-facts-') as folder:
        for key, q in questions():
            seen.add(key)
            if key in SOURCED:
                continue
            if key not in FACTS:
                failures.append(f'{key}: no fact check and no cited source'); continue
            root = Path(folder) / key.replace('/', '-'); root.mkdir()
            try:
                answer = FACTS[key](Sandbox(root))
            except Exception as error:  # report every failing fact, not just the first
                failures.append(f'{key}: {error}'); continue
            if answer != q['options'][q['correct']]:
                failures.append(f'{key}: Git supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Git checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Git checkpoint answers checked against real Git; {len(SOURCED)} cited from the lesson.')


if __name__ == '__main__':
    main()
