import copy
import json
import unittest
from pathlib import Path
from infra_lab import plan, simulate_apply, estimate, validate

class InfrastructureTests(unittest.TestCase):
    def setUp(self): self.desired=json.loads(Path(__file__).with_name('topology.json').read_text())['resources']
    def test_create_and_noop(self):
        self.assertTrue(all(x['action']=='create' for x in plan([],self.desired)))
        self.assertTrue(all(x['action']=='no-op' for x in plan(self.desired,self.desired)))
    def test_tag_update(self):
        new=copy.deepcopy(self.desired);new[0]['tags']['owner']='learner-two'
        self.assertEqual(plan(self.desired,new)[0]['action'],'update')
    def test_rename_replaces(self):
        new=copy.deepcopy(self.desired);new[0]['name']='replacement'
        self.assertEqual(plan(self.desired,new)[0]['action'],'replace')
        with self.assertRaises(ValueError): simulate_apply(self.desired,new)
        self.assertEqual(simulate_apply(self.desired,new,allow_destroy=True),new)
    def test_destroy_guard(self):
        self.assertTrue(all(x['action']=='destroy' for x in plan(self.desired,[])))
        with self.assertRaises(ValueError): simulate_apply(self.desired,[])
        self.assertEqual(simulate_apply(self.desired,[],allow_destroy=True),[])
    def test_source_inventory_unchanged(self):
        baseline=copy.deepcopy(self.desired)
        with self.assertRaises(RuntimeError): simulate_apply(self.desired,self.desired,crash=True)
        self.assertEqual(self.desired,baseline)
        result=simulate_apply(self.desired,self.desired);result[0]['tags']['owner']='changed'
        self.assertEqual(self.desired,baseline)
    def test_public_storage_denied(self):
        bad=copy.deepcopy(self.desired);bad[1]['public_network']=True
        with self.assertRaises(ValueError): validate(bad)
    def test_owner_and_expiry_required(self):
        for key in ('owner','purpose','expires'):
            bad=copy.deepcopy(self.desired);bad[0]['tags'].pop(key)
            with self.subTest(key=key):
                with self.assertRaises(ValueError): validate(bad)
    def test_wildcard_and_owner_role_denied(self):
        for role in ('Owner','*'):
            bad=copy.deepcopy(self.desired);bad[0]['role']=role
            with self.assertRaises(ValueError): validate(bad)
    def test_duplicate_ids_denied(self):
        with self.assertRaises(ValueError): validate(self.desired+[self.desired[0]])
    def test_malformed_input_denied(self):
        for bad in (None,[{}],[None]):
            with self.assertRaises(ValueError): validate(bad)
    def test_cost_arithmetic(self): self.assertEqual(estimate(2,10,0.5,8),24)
    def test_invalid_cost_inputs(self):
        for value in (-1,float('nan'),float('inf'),True,'2'):
            with self.subTest(value=value):
                with self.assertRaises(ValueError): estimate(value,10,0.5,8)
    def test_azure_example_selected_contracts(self):
        config=json.loads(Path(__file__).with_name('main.tf.json').read_text())
        storage=config['resource']['azurerm_storage_account']['lab']
        self.assertFalse(storage['public_network_access_enabled']); self.assertFalse(storage['shared_access_key_enabled'])
        self.assertFalse(storage['allow_nested_items_to_be_public']); self.assertEqual(storage['min_tls_version'],'TLS1_2')
        self.assertNotIn('azurerm_role_assignment',config['resource'])
        self.assertEqual(config['provider']['azurerm']['subscription_id'],'${var.subscription_id}')

if __name__ == '__main__': unittest.main()
