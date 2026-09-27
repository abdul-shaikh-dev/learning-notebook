import unittest
from collaboration import handle_request, CompletionMediator, notify_all

class CollaborationTests(unittest.TestCase):
    def test_chain_order_short_circuit_and_false_result(self):
        called = []
        def decline(r): called.append('decline'); return None
        def accept(r): called.append('accept'); return False
        def never(r): self.fail('handler after accept ran')
        self.assertIs(handle_request('x',[decline,accept,never]),False)
        self.assertEqual(called,['decline','accept'])

    def test_overlapping_handler_order_is_policy(self):
        a=lambda request:'a'
        b=lambda request:'b'
        self.assertEqual(handle_request('x',[a,b]),'a')
        self.assertEqual(handle_request('x',[b,a]),'b')

    def test_unhandled_and_failure_do_not_fall_through(self):
        with self.assertRaises(LookupError): handle_request('x',[lambda r:None])
        with self.assertRaises(LookupError): handle_request('x',[])
        def fail(r): raise ValueError('broken handler')
        with self.assertRaises(ValueError): handle_request('x',[fail,lambda r:'fallback'])

    def test_observer_broadcast_differs_from_chain(self):
        calls=[]
        notify_all('done',[lambda e:calls.append(('a',e)),lambda e:calls.append(('b',e))])
        self.assertEqual(calls,[('a','done'),('b','done')])

    def test_mediator_validation_transition_and_no_failed_effects(self):
        source={'intro':'active','next':'active'}
        mediator=CompletionMediator(source,{'next':['intro']})
        for lesson in ['next','missing']:
            with self.assertRaises(ValueError): mediator.complete(lesson)
        self.assertEqual(mediator.states,source)
        self.assertEqual(mediator.notifications,[])
        mediator.complete('intro'); mediator.complete('next')
        self.assertEqual(mediator.notifications,[('completed','intro'),('completed','next')])
        with self.assertRaises(ValueError): mediator.complete('next')
        self.assertEqual(len(mediator.notifications),2)
        self.assertEqual(source,{'intro':'active','next':'active'})

if __name__=='__main__': unittest.main()
