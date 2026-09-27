"""Offline DNS/cache and request-policy models, not a resolver or TLS stack."""
from urllib.parse import urlsplit

def origin(url):
    parts=urlsplit(url)
    if parts.scheme not in {"http","https"} or not parts.hostname or parts.username is not None or parts.password is not None:
        raise ValueError("HTTP(S) URL without credentials required")
    if parts.fragment:
        raise ValueError("request URL must not include fragment")
    return parts.scheme, parts.hostname.lower(), parts.port if parts.port is not None else (443 if parts.scheme=="https" else 80)

class DnsCache:
    def __init__(self): self._entries={}
    def remember(self,name,address,ttl,now):
        if type(ttl) is not int or ttl < 0: raise ValueError("nonnegative TTL required")
        self._entries[name.lower()]=(address,now+ttl)
    def lookup(self,name,now):
        row=self._entries.get(name.lower())
        return row[0] if row and now < row[1] else None

def retry_allowed(method,attempt,max_attempts,remaining):
    if type(attempt) is not int or type(max_attempts) is not int or not 1 <= attempt <= max_attempts:
        raise ValueError("invalid attempt budget")
    return method in {"GET","HEAD"} and attempt < max_attempts and remaining > 0

if __name__=="__main__":
    cache=DnsCache()
    cache.remember("lessons.example","192.0.2.10",5,10)
    print(origin("https://lessons.example/read?lesson=1"))
    print(cache.lookup("lessons.example",14),cache.lookup("lessons.example",15))
