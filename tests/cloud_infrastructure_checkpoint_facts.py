"""Fact checks for the Cloud & Infrastructure as Code checkpoint answers.

No cloud account or Terraform binary is used. Each fact runs the course's offline inventory planner
(paths/cloud-infrastructure/practice/infra_lab.py) on topology.json, or reads the optional Azure template
main.tf.json as data, and returns the text of the option the result supports. The script fails if that
differs from the authored correct option.
Run with Python 3.14+: python tests/cloud_infrastructure_checkpoint_facts.py
"""
import copy
import json
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'cloud-infrastructure'
PRACTICE = COURSE / 'practice'
sys.path.insert(0, str(PRACTICE))
import infra_lab as lab  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'compute-choices/2': 'On a VM the operating system is yours to patch, harden and scale, lesson 4',
    'cloud-contract/2': 'Managed compute does not configure authorization or protect application data, lesson 1',
    'requirements/2': 'A custom OS component is the stated reason to reconsider the choice, lesson 3',
    'provider-init/2': 'The dependency lock file records selected provider versions and checksums, lesson 9',
    'state/2': 'State maps addresses to remote identities; application rows need their own backups, lesson 12',
    'modules/2': 'Workspaces provide multiple states but not isolation of credentials, lesson 15',
    'drift-import/2': 'A normal plan can propose the configured value after refresh, lesson 16',
    'deployment-pipeline/2': 'Pull-request code may be untrusted and should not receive deployment secrets, lesson 21',
    'resilience/2': 'Rebuilding infrastructure does not restore database rows or blob contents, lesson 23',
    'launch-review/2': 'List the checks run, their results and the questions they cannot answer, lesson 25',
}

TOPOLOGY = json.loads((PRACTICE / 'topology.json').read_text(encoding='utf-8'))['resources']
TEMPLATE = json.loads((PRACTICE / 'main.tf.json').read_text(encoding='utf-8'))
STORAGE = TEMPLATE['resource']['azurerm_storage_account']['lab']


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def outcome(action):
    """Run action and name the exception it raises, or return its result."""
    try:
        return action()
    except Exception as error:
        return f'{type(error).__name__}: {error}'


def raises(action):
    return 'Raises ' + outcome(action)


def topology():
    return copy.deepcopy(TOPOLOGY)


def changed(resource_id, **fields):
    resources = topology()
    target = next(r for r in resources if r['id'] == resource_id)
    for key, value in fields.items():
        if key == 'tags':
            target['tags'].update(value)
        elif value is None:
            target.pop(key, None)
        else:
            target[key] = value
    return resources


def action(plan, resource_id):
    return next(x['action'] for x in plan if x['id'] == resource_id)


def azure_scope():
    variable = TEMPLATE['variable']['subscription_id']
    uses = TEMPLATE['provider']['azurerm']['subscription_id'] == '${var.subscription_id}'
    return pick(('default' in variable, uses), {(False, True): 'None: the variable has no default and must be supplied'})


def networking():
    private_endpoints = [k for k in TEMPLATE['resource'] if 'private_endpoint' in k]
    return pick((STORAGE['public_network_access_enabled'], len(private_endpoints)),
                {(False, 0): 'No: public access is disabled and no private endpoint exists'})


def identity():
    return raises(lambda: lab.validate(changed('store', role='*')))


def iac_model():
    return action(lab.plan(TOPOLOGY, changed('store', tags={'owner': 'another-learner'})), 'store')


def variables():
    condition = TEMPLATE['variable']['storage_name']['validation'][0]['condition']
    pattern = re.search(r'regex\("(.+?)", var\.storage_name', condition).group(1)
    passing = tuple(n for n in ('notebook-store', 'NotebookStore1', 'notebookstore1') if re.fullmatch(pattern, n))
    return pick(passing, {('notebookstore1',): 'notebookstore1 only', ('NotebookStore1', 'notebookstore1'):
                          'NotebookStore1 and notebookstore1'})


def dependencies():
    refs = (STORAGE['resource_group_name'], STORAGE['location'])
    return pick((refs, 'depends_on' in STORAGE),
                {(('${azurerm_resource_group.lab.name}', '${azurerm_resource_group.lab.location}'), False):
                 "Through references to the group's name and location, with no depends_on"})


def plan_review():
    desired = [r for r in topology() if r['id'] != 'store']
    return raises(lambda: lab.simulate_apply(TOPOLOGY, desired))


def lifecycle():
    return action(lab.plan(TOPOLOGY, changed('store', name='renamednotebookstore')), 'store')


def policy():
    return raises(lambda: lab.validate(changed('store', public_network=True)))


def secrets():
    keys_output = tuple(k for k in TEMPLATE.get('output', {}) if 'key' in k.lower())
    return pick((STORAGE['shared_access_key_enabled'], keys_output), {(False, ()):'No: shared_access_key_enabled is false'})


def cost_control():
    return f'{lab.estimate(2, 10, 0.5, 8):g}'


def infra_tests():
    applied = lab.simulate_apply([], TOPOLOGY)
    actions = tuple(x['action'] for x in lab.plan(applied, TOPOLOGY))
    return pick((actions, lab.demo()['network_calls']), {(('no-op', 'no-op'), 0): 'no-op for both resources'})


def cleanup():
    current = topology()
    before = copy.deepcopy(current)
    error = outcome(lambda: lab.simulate_apply(current, [], allow_destroy=True, crash=True))
    return pick((error.split(':')[0], current == before), {('RuntimeError', True): 'RuntimeError, and the source inventory is unchanged'})


def foundation_expires():
    resources = topology()
    del resources[0]['tags']['expires']
    return raises(lambda: lab.validate(resources))


def foundation_duplicate():
    resources = topology()
    resources.append(copy.deepcopy(resources[1]))
    return raises(lambda: lab.validate(resources))


def foundation_outputs():
    outputs = TEMPLATE.get('output', {})
    return pick(tuple(v['value'] for v in outputs.values()), {('${azurerm_resource_group.lab.id}',): 'Only the resource group ID'})


def intermediate_create():
    return pick(tuple((x['id'], x['action']) for x in lab.plan([], TOPOLOGY)),
                {(('group', 'create'), ('store', 'create')): 'create for group and store'})


def intermediate_missing_public():
    return raises(lambda: lab.validate(changed('store', public_network=None)))


def intermediate_negative_hours():
    return raises(lambda: lab.estimate(2, -1, 0.5, 8))


def advanced_month():
    return f'{lab.estimate(2, 730, 0.5, 8):g}'


def advanced_rename():
    return raises(lambda: lab.simulate_apply(TOPOLOGY, changed('store', name='renamednotebookstore')))


def advanced_owner_role():
    return raises(lambda: lab.validate(changed('group', role='Owner')))



def managed_data():
    rates = {'hot': (0.020, 0.000), 'cool': (0.010, 0.010), 'cold': (0.004, 0.030), 'archive': (0.001, 0.020)}
    costs = {tier: 1000 * store + 2000 * read for tier, (store, read) in rates.items()}
    return min(costs, key=costs.get)


def autoscaling_across_clouds():
    import math
    return str(max(2, min(10, math.ceil(2 * 95 / 60))))


FACTS = {
    'managed-data/2': managed_data, 'autoscaling-across-clouds/2': autoscaling_across_clouds,
    'azure-scope/2': azure_scope, 'networking/2': networking, 'identity/2': identity, 'iac-model/2': iac_model,
    'variables/2': variables, 'dependencies/2': dependencies, 'plan-review/2': plan_review,
    'lifecycle/2': lifecycle, 'policy/2': policy, 'secrets/2': secrets, 'cost-control/2': cost_control,
    'infra-tests/2': infra_tests, 'cleanup/2': cleanup,
    'stage/foundation/1': foundation_expires, 'stage/foundation/2': foundation_duplicate,
    'stage/foundation/3': foundation_outputs,
    'stage/intermediate/1': intermediate_create, 'stage/intermediate/2': intermediate_missing_public,
    'stage/intermediate/3': intermediate_negative_hours,
    'stage/advanced/1': advanced_month, 'stage/advanced/2': advanced_rename, 'stage/advanced/3': advanced_owner_role,
}


def questions():
    data = json.loads((COURSE / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def main():
    seen, failures = set(), []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source')
            continue
        try:
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('Cloud & Infrastructure as Code checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Cloud & Infrastructure as Code checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
