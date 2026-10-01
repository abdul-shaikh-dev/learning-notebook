"""Opt-in local RabbitMQ acknowledgement-gap exercise; requires Pika."""
import json
import sqlite3
import time
import uuid


def main():
    try:
        import pika
    except ImportError:
        raise SystemExit('SKIP: install Pika in the optional lab venv first')
    parameters = pika.ConnectionParameters(host='127.0.0.1', port=5679,
        credentials=pika.PlainCredentials('notebook', 'notebook-local-only'),
        socket_timeout=3, blocked_connection_timeout=5, connection_attempts=1)
    name = 'notebook-ack-' + uuid.uuid4().hex
    db = sqlite3.connect(':memory:')
    db.execute('CREATE TABLE inbox(id TEXT PRIMARY KEY)')
    db.execute('CREATE TABLE balance(value INTEGER NOT NULL)')
    db.execute('INSERT INTO balance VALUES(0)')
    db.commit()
    connections = []

    def connect():
        connection = pika.BlockingConnection(parameters)
        connections.append(connection)
        return connection, connection.channel()

    def commit(body):
        event = json.loads(body)
        with db:
            cursor = db.execute('INSERT OR IGNORE INTO inbox VALUES(?)', (event['id'],))
            if cursor.rowcount:
                db.execute('UPDATE balance SET value=value+?', (event['amount'],))

    def receive(channel):
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            method, properties, body = channel.basic_get(queue=name, auto_ack=False)
            if method:
                return method, body
            time.sleep(.05)
        raise TimeoutError('expected a delivery within five seconds')

    try:
        first, channel = connect()
        channel.queue_declare(queue=name, durable=False, auto_delete=False,
                              arguments={'x-expires': 60000})
        channel.confirm_delivery()
        channel.basic_publish(exchange='', routing_key=name,
                              body=json.dumps({'id': 'event-1', 'amount': 7}), mandatory=True)
        method, body = receive(channel)
        commit(body)
        assert db.execute('SELECT value FROM balance').fetchone()[0] == 7
        first.close()  # intentionally omit acknowledgement after the committed effect
        second, channel = connect()
        method, body = receive(channel)
        assert method.redelivered
        commit(body)
        assert db.execute('SELECT value FROM balance').fetchone()[0] == 7
        assert db.execute('SELECT COUNT(*) FROM inbox').fetchone()[0] == 1
        channel.basic_ack(delivery_tag=method.delivery_tag)
        assert channel.basic_get(queue=name, auto_ack=False)[0] is None
        print('PASS: broker redelivery after close; one inbox row, balance=7; queue drained')
        print('The database survived a channel close in this process; process-crash durability was not tested.')
    finally:
        # Delete only the random queue allocated by this run; never purge another queue.
        for connection in reversed(connections):
            if connection.is_open:
                try:
                    connection.channel().queue_delete(queue=name)
                finally:
                    connection.close()
        db.close()


if __name__ == '__main__':
    main()
