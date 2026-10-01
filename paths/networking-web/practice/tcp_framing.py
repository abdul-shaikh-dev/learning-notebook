"""Real loopback TCP, newline framing and bounded failure cases. Python 3.11+."""
import socket
from concurrent.futures import ThreadPoolExecutor


def receive_lines(connection, maximum=64):
    pending = bytearray()
    messages = []
    while True:
        chunk = connection.recv(3)  # deliberately smaller than a message
        if not chunk:
            if pending:
                raise ValueError('EOF inside a frame')
            return messages
        pending.extend(chunk)
        while b'\n' in pending:
            frame, _, rest = pending.partition(b'\n')
            if len(frame) > maximum:
                raise ValueError('frame exceeds limit')
            messages.append(frame.decode('utf-8'))
            pending = bytearray(rest)
        if len(pending) > maximum:
            raise ValueError('frame exceeds limit')


def exchange(parts):
    with socket.socket() as listener, ThreadPoolExecutor(max_workers=1) as workers:
        listener.bind(('127.0.0.1', 0))
        listener.listen(1)
        listener.settimeout(3)

        def server():
            connection, _ = listener.accept()
            with connection:
                connection.settimeout(3)
                return receive_lines(connection)

        result = workers.submit(server)
        with socket.create_connection(listener.getsockname(), timeout=3) as client:
            for part in parts:
                client.sendall(part)
            client.shutdown(socket.SHUT_WR)
        return result.result(timeout=4)


if __name__ == '__main__':
    # UTF-8 e-acute is split across application sends; TCP packet boundaries vary.
    assert exchange([b'caf\xc3', b'\xa9\nsecond\n']) == ['caf\u00e9', 'second']
    assert exchange([b'one\ntwo\n']) == ['one', 'two']
    assert exchange([]) == []
    for parts, message in [([b'incomplete'], 'EOF inside a frame'),
                           ([b'x' * 65], 'frame exceeds limit')]:
        try:
            exchange(parts)
        except ValueError as error:
            assert str(error) == message
        else:
            raise AssertionError('malformed stream was accepted')
    print('PASS: TCP split/coalesced UTF-8 frames, empty EOF, truncated EOF, size bound')
