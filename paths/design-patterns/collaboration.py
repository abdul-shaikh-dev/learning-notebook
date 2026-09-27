"""Sequential, in-memory behavioral pattern contrasts. Python 3.11+."""
def handle_request(request, handlers):
    """Chain of Responsibility: first non-None result handles the request.

    None means decline. False/empty strings are valid handled results.
    Exceptions propagate; there is no implicit fallback after handler failure.
    """
    for handler in handlers:
        result = handler(request)
        if result is not None:
            return result
    raise LookupError('unhandled request')

class CompletionMediator:
    """Coordinates one transition with validation before any local effect.

    Collaborators know this coordinator rather than one another. Values are
    immutable strings. This is sequential local state, not durable delivery.
    """
    def __init__(self, states, prerequisites):
        self.states = dict(states)
        self.prerequisites = {key: tuple(value) for key,value in prerequisites.items()}
        self.notifications = []

    def complete(self, lesson):
        if self.states.get(lesson) != 'active':
            raise ValueError('active lesson required')
        if any(self.states.get(p) != 'done' for p in self.prerequisites.get(lesson, ())):
            raise ValueError('unfinished prerequisite')
        self.states[lesson] = 'done'
        self.notifications.append(('completed', lesson))
        return self.states[lesson]

def notify_all(event, subscribers):
    """Observer contrast: broadcast to every subscriber; fail-fast policy."""
    for subscriber in subscribers:
        subscriber(event)
