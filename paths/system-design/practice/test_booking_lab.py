import sqlite3
from contextlib import closing
import tempfile
import threading
import unittest
from pathlib import Path
from booking_lab import book, connect, initialize, relay_one


class BookingTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'booking.sqlite'
        initialize(self.path)

    def counts(self):
        with closing(connect(self.path)) as db:
            return (db.execute('SELECT remaining FROM workshop WHERE id="W"').fetchone()[0],
                    db.execute('SELECT count(*) FROM booking').fetchone()[0],
                    db.execute('SELECT count(*) FROM outbox').fetchone()[0])

    def test_last_seat_race_uses_separate_connections(self):
        barrier, results = threading.Barrier(3), []
        def attempt(learner):
            barrier.wait(timeout=5)
            try:
                results.append(book(self.path, learner, learner))
            except Exception as error:
                results.append(error)
        threads = [threading.Thread(target=attempt, args=(name,)) for name in ('A', 'B')]
        for thread in threads: thread.start()
        barrier.wait(timeout=5)
        for thread in threads: thread.join(timeout=5)
        self.assertTrue(all(not thread.is_alive() for thread in threads))
        self.assertEqual(len(results), 2)
        self.assertEqual(len(results), 2)
        self.assertEqual(len(results), 2)
        self.assertEqual(sum(isinstance(x, tuple) for x in results), 1)
        self.assertEqual([type(x) for x in results if isinstance(x, Exception)], [ValueError])
        self.assertEqual([str(x) for x in results if isinstance(x, Exception)],
                         ["sold out or unknown workshop"])
        self.assertEqual([type(x) for x in results if isinstance(x, Exception)], [ValueError])
        self.assertEqual([str(x) for x in results if isinstance(x, Exception)],
                         ["sold out or unknown workshop"])
        self.assertEqual([type(x) for x in results if isinstance(x, Exception)], [ValueError])
        self.assertEqual([str(x) for x in results if isinstance(x, Exception)],
                         ["sold out or unknown workshop"])
        self.assertEqual(self.counts(), (0, 1, 1))

    def test_response_loss_replay_and_intent_conflict(self):
        first, replayed = book(self.path, 'A', 'key-1'), book(self.path, 'A', 'key-1')
        self.assertEqual(replayed, (first[0], True))
        with self.assertRaisesRegex(ValueError, 'different workshop'):
            book(self.path, 'A', 'key-1', 'OTHER')
        self.assertEqual(self.counts(), (0, 1, 1))

    def test_second_write_failure_rolls_back_capacity(self):
        with self.assertRaisesRegex(RuntimeError, 'injected'):
            book(self.path, 'A', 'key-1', fail_after_decrement=True)
        self.assertEqual(self.counts(), (1, 0, 0))

    def test_distinct_key_cannot_book_same_learner_twice(self):
        path = Path(self.directory.name) / 'two_seats.sqlite'
        initialize(path, seats=2)
        book(path, 'A', 'first')
        with self.assertRaises(sqlite3.IntegrityError):
            book(path, 'A', 'second')
        with closing(connect(path)) as db:
            self.assertEqual(db.execute('SELECT remaining FROM workshop WHERE id="W"').fetchone()[0], 1)
            self.assertEqual(db.execute('SELECT count(*) FROM booking').fetchone()[0], 1)
            self.assertEqual(db.execute('SELECT count(*) FROM outbox').fetchone()[0], 1)

    def test_outbox_replay_requires_consumer_deduplication(self):
        book(self.path, 'A', 'key-1')
        deliveries, handled = [], set()
        def consumer(event_id, payload):
            deliveries.append(event_id)
            handled.add(event_id)  # consumer-side logical dedupe
            self.assertEqual(payload['booking_id'], 1)
        with self.assertRaisesRegex(RuntimeError, 'relay crashed'):
            relay_one(self.path, consumer, crash_after_publish=True)
        relay_one(self.path, consumer)
        self.assertEqual(deliveries, [1, 1])
        self.assertEqual(handled, {1})
        self.assertIsNone(relay_one(self.path, consumer))


if __name__ == '__main__':
    unittest.main()
