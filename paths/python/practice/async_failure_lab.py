"""Python 3.11+: deterministic TaskGroup failure and cancellation, no timing races."""
import asyncio

async def failing_group(events):
    started = asyncio.Event()
    async def sibling():
        try:
            started.set()
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            events.append("sibling-cancelled")
            raise
        finally:
            events.append("sibling-cleaned")
    async def failure():
        await started.wait()
        raise ValueError("invalid batch")
    async with asyncio.TaskGroup() as group:
        group.create_task(sibling())
        group.create_task(failure())

async def cancelled_group(started, events):
    async def child():
        try:
            started.set()
            await asyncio.Event().wait()
        finally:
            events.append("child-cleaned")
    async with asyncio.TaskGroup() as group:
        group.create_task(child())

async def demo():
    events = []
    try:
        await failing_group(events)
    except* ValueError as group:
        print([str(error) for error in group.exceptions])
    print(events)

if __name__ == "__main__":
    asyncio.run(demo())
