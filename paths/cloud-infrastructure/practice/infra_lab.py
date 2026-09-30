"""Teaching inventory planner. Not Terraform; no network or deployment."""
import copy
import json
import math
from pathlib import Path

def validate(resources):
    if not isinstance(resources,list): raise ValueError('resource list required')
    seen=set()
    for r in resources:
        if not isinstance(r,dict): raise ValueError('resource object required')
        for key in ('id','kind','name'):
            if not isinstance(r.get(key),str) or not r[key]: raise ValueError('missing '+key)
        if r['id'] in seen: raise ValueError('duplicate identity')
        seen.add(r['id'])
        tags=r.get('tags',{})
        if not isinstance(tags,dict) or any(not isinstance(tags.get(k),str) or not tags[k].strip() for k in ('owner','purpose','expires')):
            raise ValueError('owner/purpose/expires tags required')
        if r['kind']=='storage' and r.get('public_network') is not False: raise ValueError('public storage forbidden by training policy')
        if r.get('role') in ('Owner','*'): raise ValueError('overbroad training role')
    return resources

def plan(current,desired):
    validate(current);validate(desired)
    old={r['id']:r for r in current}; new={r['id']:r for r in desired}
    result=[]
    for key in sorted(old.keys()|new.keys()):
        if key not in old: action='create'
        elif key not in new: action='destroy'
        elif (old[key]['kind'],old[key]['name']) != (new[key]['kind'],new[key]['name']): action='replace'
        elif old[key] != new[key]: action='update'
        else: action='no-op'
        result.append(dict(id=key,action=action))
    return result

def simulate_apply(current,desired,allow_destroy=False,crash=False):
    operations=plan(current,desired)
    if any(x['action'] in ('destroy','replace') for x in operations) and not allow_destroy:
        raise ValueError('destructive model operation requires explicit allow_destroy')
    if crash: raise RuntimeError('simulated apply failure; source inventory unchanged')
    return copy.deepcopy(desired)

def estimate(units_per_hour,hours,units_per_gb_month,gb):
    values=(units_per_hour,hours,units_per_gb_month,gb)
    if any(type(v) not in (int,float) or not math.isfinite(v) or v<0 for v in values):
        raise ValueError('finite nonnegative numeric inputs required')
    return units_per_hour*hours + units_per_gb_month*gb

def demo():
    desired=json.loads(Path(__file__).with_name('topology.json').read_text(encoding='utf-8'))['resources']
    applied=simulate_apply([],desired)
    return dict(create=plan([],desired),recheck=plan(applied,desired),fictional_cost_units=estimate(2,10,0.5,8),network_calls=0)

if __name__ == '__main__': print(json.dumps(demo(),indent=2))
