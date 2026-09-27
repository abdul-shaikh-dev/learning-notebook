import unittest
from security_lab import (Principal,DOCUMENTS,authorized,read_document,parse_update,
    title_html,synthetic_database,find_title,Sessions,safe_audit,FixedWindowLimiter)

class AuthorizationTests(unittest.TestCase):
    def test_object_matrix_and_default_deny(self):
        alice=Principal('alice','red')
        reader=Principal('reviewer','red','reader')
        self.assertEqual(read_document(alice,'a')['owner'],'alice')
        for principal,id in [(None,'a'),(alice,'b'),(alice,'c'),(alice,'missing')]:
            with self.assertRaisesRegex(PermissionError,'document unavailable'): read_document(principal,id)
        self.assertTrue(authorized(reader,DOCUMENTS['b'],'read'))
        self.assertFalse(authorized(reader,DOCUMENTS['b'],'update'))
        self.assertFalse(authorized(alice,DOCUMENTS['a'],'delete'))
        self.assertFalse(authorized(Principal('admin','blue','reader'),DOCUMENTS['a'],'read'))

    def test_no_mass_assignment_or_mutation(self):
        for body in [{'title':'x','owner':'alice'},{'title':'x','role':'admin'},None,{'title':[]},{}]:
            with self.assertRaises(ValueError): parse_update(body)
        self.assertEqual(parse_update({'title':' x '}),{'title':'x'})
        result=read_document(Principal('alice','red'),'a'); result['owner']='mallory'
        self.assertEqual(DOCUMENTS['a']['owner'],'alice')

class ValidationTests(unittest.TestCase):
    def test_boundaries(self):
        for value in ['', ' '*4, 'x'*81, 'a\nb', 'a\x7fb']:
            with self.assertRaises(ValueError): parse_update({'title':value})
        self.assertEqual(parse_update({'title':'x'*80}),{'title':'x'*80})
    def test_xss_encoded_in_text_context(self):
        self.assertEqual(title_html('<script>alert(1)</script>'),
            '<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>')
        self.assertNotIn('<img',title_html('<img src=x onerror=alert(1)>'))
    def test_sql_injection_is_data(self):
        connection=synthetic_database()
        try:
            self.assertEqual(find_title(connection,"' OR 1=1 --"),[])
            self.assertEqual(find_title(connection,'Alice private'),[('Alice private',)])
            self.assertEqual(connection.execute('SELECT COUNT(*) FROM documents').fetchone()[0],2)
        finally: connection.close()

class SessionTests(unittest.TestCase):
    def test_login_rotation_expiry_logout(self):
        sessions=Sessions(); p=Principal('alice','red')
        old=sessions.login(p,0); new=sessions.login(p,1,old)
        self.assertNotEqual(old,new)
        with self.assertRaises(PermissionError): sessions.identity(old,2)
        self.assertEqual(sessions.identity(new,300),p)
        with self.assertRaises(PermissionError): sessions.identity(new,301)
        fresh=sessions.login(p,302); sessions.logout(fresh)
        with self.assertRaises(PermissionError): sessions.identity(fresh,303)
    def test_csrf_missing_wrong_and_cross_session(self):
        sessions=Sessions(); p=Principal('alice','red')
        a=sessions.login(p,0); b=sessions.login(p,0)
        token=sessions.records[a][2]
        sessions.csrf(a,token,1)
        for wrong in [None,'','é',sessions.records[b][2]]:
            with self.assertRaises(PermissionError): sessions.csrf(a,wrong,1)
        with self.assertRaises(PermissionError): sessions.csrf(a,token,300)

class OperationsTests(unittest.TestCase):
    def test_structured_minimal_log(self):
        self.assertEqual(safe_audit('login','u-123','denied'),
            {'event':'login','subject':'u-123','outcome':'denied'})
        for subject in ['', 'u\nforged=allowed', 'u\x7fforged', 'x'*81]:
            with self.assertRaises(ValueError): safe_audit('login',subject,'denied')
        with self.assertRaises(ValueError): safe_audit('raw-password','u','allowed')
    def test_rate_limit_identity_isolation_and_window(self):
        limiter=FixedWindowLimiter()
        self.assertEqual([limiter.allow('alice',t) for t in [1,2,3,4]], [True,True,True,False])
        self.assertTrue(limiter.allow('bob',4))
        self.assertTrue(limiter.allow('alice',60))
        for limit in [0,True,1.5]:
            with self.assertRaises(ValueError): FixedWindowLimiter(limit=limit)

if __name__=='__main__': unittest.main()
