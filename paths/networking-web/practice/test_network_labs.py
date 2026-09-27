import json
import socket
import ssl
import threading
import unittest
from network_foundation import origin,DnsCache,retry_allowed
from network_http import local_server,fetch,BODY,ETAG
from network_resilience import decode_observation,ProtocolError,SharedCache,bounded_get

class ProtocolModels(unittest.TestCase):
    def test_origins_and_invalid_urls(self):
        self.assertEqual(origin("https://EXAMPLE.test/a?q=1"),("https","example.test",443))
        self.assertNotEqual(origin("http://example.test"),origin("https://example.test"))
        self.assertEqual(origin("http://example.test:0"),("http","example.test",0))
        for url in ("file:///tmp/a","https://user:pass@example.test","http://example.test/a#part","https://example.test:wrong"):
            with self.assertRaises(ValueError): origin(url)

    def test_dns_ttl_boundary(self):
        cache=DnsCache()
        cache.remember("EXAMPLE.test","192.0.2.1",5,10)
        self.assertEqual(cache.lookup("example.test",14.99),"192.0.2.1")
        self.assertIsNone(cache.lookup("example.test",15))
        with self.assertRaises(ValueError):cache.remember("x","x",True,0)

    def test_retry_policy(self):
        self.assertTrue(retry_allowed("GET",1,3,1))
        self.assertFalse(retry_allowed("POST",1,3,1))
        self.assertFalse(retry_allowed("GET",3,3,1))
        self.assertFalse(retry_allowed("GET",1,3,0))

    def test_tls_context_defaults_only_not_handshake(self):
        context=ssl.create_default_context()
        self.assertTrue(context.check_hostname)
        self.assertEqual(context.verify_mode,ssl.CERT_REQUIRED)

class LoopbackHttp(unittest.TestCase):
    def test_get_head_conditional_and_missing(self):
        with local_server() as server:
            code,headers,body=fetch(server)
            self.assertEqual(code,200)
            self.assertEqual(json.loads(body)["version"],1)
            self.assertEqual(headers["Content-Length"],str(len(BODY)))
            self.assertEqual(headers["ETag"],ETAG)
            code,headers,body=fetch(server,method="HEAD")
            self.assertEqual(code,200)
            self.assertEqual(body,b"")
            code,_,body=fetch(server,headers={"If-None-Match":ETAG})
            self.assertEqual((code,body),(304,b""))
            self.assertEqual(fetch(server,"/missing")[0],404)

    def test_redirect_is_observed_not_followed(self):
        with local_server() as server:
            code,headers,body=fetch(server,"/redirect")
            self.assertEqual(code,307)
            self.assertEqual(headers["Location"],"/lesson")
            self.assertEqual(body,b"")

    def test_cookie_and_private_denial(self):
        with local_server() as server:
            self.assertEqual(fetch(server,"/private")[0],401)
            self.assertIn("WWW-Authenticate",fetch(server,"/private")[1])
            code,headers,_=fetch(server,"/cookie")
            self.assertIn("HttpOnly",headers["Set-Cookie"])
            code,headers,_=fetch(server,"/private",headers={"Cookie":"session=synthetic"})
            self.assertEqual(code,200)
            self.assertEqual(headers["Cache-Control"],"private, no-store")

    def test_malformed_json_and_status_do_not_look_successful(self):
        with local_server() as server:
            with self.assertRaises(ProtocolError): decode_observation(*fetch(server,"/bad-json"))
            with self.assertRaises(ProtocolError): decode_observation(*fetch(server,"/unavailable"))
            self.assertEqual(decode_observation(*fetch(server))["lesson"],"http")

    def test_stalled_server_read_times_out(self):
        with local_server() as server:
            results=[]
            def client():
                try: fetch(server,"/stall",timeout=.15)
                except (TimeoutError,socket.timeout): results.append("timeout")
            thread=threading.Thread(target=client)
            thread.start()
            try:
                self.assertTrue(server.started.wait(timeout=2))
                thread.join(timeout=2)
                self.assertFalse(thread.is_alive())
                self.assertEqual(results,["timeout"])
            finally:
                server.release.set()
                thread.join(timeout=2)

class ResilienceTests(unittest.TestCase):
    def test_cache_private_and_expiry(self):
        cache=SharedCache()
        self.assertFalse(cache.store_public("user",b"secret",10,0,private=True))
        self.assertIsNone(cache.get("user",1))
        self.assertTrue(cache.store_public("public",b"lesson",5,10))
        self.assertEqual(cache.get("public",14),b"lesson")
        self.assertIsNone(cache.get("public",15))

    def test_retry_bounded_and_deadline_prevents_new_call(self):
        calls=[]
        def fail():calls.append(1);return 503
        status,trace=bounded_get(fail,lambda:0,1,3)
        self.assertEqual((status,len(calls),len(trace)),(503,3,3))
        with self.assertRaises(TimeoutError):bounded_get(fail,lambda:2,1)
        self.assertEqual(len(calls),3)
        outcomes=iter([503,200])
        self.assertEqual(bounded_get(lambda:next(outcomes),lambda:0,1)[0],200)

    def test_json_contract_errors(self):
        self.assertEqual(decode_observation(200,{"content-type":"application/json"},BODY)["version"],1)
        self.assertEqual(decode_observation(200,{"Content-Type":"application/json"},json.dumps({"lesson":"caf\u00e9","version":1},ensure_ascii=False).encode())["lesson"],"caf\u00e9")
        with self.assertRaises(ProtocolError):decode_observation(200,{"Content-Type":"application/json"},b'{"lesson":"\xff","version":1}')
        with self.assertRaises(ProtocolError):decode_observation(200,{"Content-Type":"application/json"},b'x'*4097)
        for headers,body in [({},BODY),({"Content-Type":"text/html"},BODY),({"Content-Type":"application/json"},b'{}'),({"Content-Type":"application/json"},b'{"lesson":"x","version":true}')]:
            with self.assertRaises(ProtocolError):decode_observation(200,headers,body)

if __name__=="__main__":unittest.main()
