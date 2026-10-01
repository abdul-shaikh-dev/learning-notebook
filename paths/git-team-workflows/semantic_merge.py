"""Two developers, clean merge, broken behavior. All repositories are fresh/local.
Uses the existing isolated Sandbox; no push or hosted service.
"""
import argparse
import json
from pathlib import Path
import tempfile
from sandbox import Sandbox

def behavior(repo):
    batch=int((repo/'batch.txt').read_text())
    capacity=int((repo/'capacity.txt').read_text())
    return {'batch':batch,'capacity':capacity,'valid':0<batch<=capacity}

def exercise(root):
    box=Sandbox(root)
    source=box.repo('source')
    box.put(source,'batch.txt','5\n'); box.put(source,'capacity.txt','10\n')
    base=box.commit(source,'Baseline bounded batches')
    clones=[]
    for name in ['alice','bob']:
        clone=box.inside(box.root/name)
        box.run(box.root,'clone','--no-local',str(source),str(clone)); clones.append(clone)
    alice,bob=clones
    box.put(alice,'batch.txt','8\n'); alice_commit=box.commit(alice,'Increase batch size')
    box.put(bob,'capacity.txt','6\n'); bob_commit=box.commit(bob,'Lower capacity')
    assert behavior(alice)['valid'] and behavior(bob)['valid']
    box.run(bob,'fetch',str(alice),'main')
    assert box.run(bob,'rev-parse','HEAD')==bob_commit
    # Separate files merge cleanly while their shared invariant becomes false.
    box.run(bob,'merge','--no-ff','FETCH_HEAD','-m','Integrate both candidates')
    merged=box.run(bob,'rev-parse','HEAD')
    parents=box.run(bob,'rev-list','--parents','-n','1','HEAD').split()[1:]
    assert set(parents)=={alice_commit,bob_commit}
    broken=behavior(bob); assert broken=={'batch':8,'capacity':6,'valid':False}
    box.put(bob,'batch.txt','6\n')
    repaired=box.commit(bob,'Reconcile batch size with reduced capacity')
    after=behavior(bob); assert after=={'batch':6,'capacity':6,'valid':True}
    report={'base':base,'alice':alice_commit,'bob':bob_commit,'merge':merged,
            'repaired':repaired,'clean_merge_behavior':broken,'repaired_behavior':after,
            'repository':str(bob),'source_unchanged':box.run(source,'rev-parse','HEAD')==base,
            'hosting_approval':'not exercised','commands':box.transcript}
    (box.root/'semantic-merge-evidence.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--workspace-parent',type=Path,default=Path('.'))
    args=parser.parse_args()
    parent=args.workspace_parent.resolve(strict=True)
    if not parent.is_dir():raise ValueError('existing parent directory required')
    root=Path(tempfile.mkdtemp(prefix='ln-semantic-merge-owned-',dir=parent))
    result=exercise(root)
    print(json.dumps({key:value for key,value in result.items() if key!='commands'},indent=2))
