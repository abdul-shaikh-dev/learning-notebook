"""Own-temp-only Git exercises; Python 3.11+, Git 2.28+. No push/network."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

class Sandbox:
    def __init__(self, root):
        self.root=Path(root).resolve()
        self.config=self.root/'empty-config'
        self.config.write_text('',encoding='utf-8')
        self.hooks=self.root/'empty-hooks'; self.hooks.mkdir()
        self.git=shutil.which('git')
        if not self.git: raise RuntimeError('Git must be installed on PATH')
        self.env={key:value for key,value in os.environ.items() if not key.startswith('GIT_')}
        self.env.update(GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_SYSTEM=str(self.config),
                        GIT_CONFIG_GLOBAL=str(self.config),GIT_TERMINAL_PROMPT='0',GIT_ALLOW_PROTOCOL='file')

    def inside(self,path):
        path=Path(path).resolve()
        if not path.is_relative_to(self.root):
            raise ValueError('sandbox path escapes owned temporary directory')
        return path

    def run(self,repo,*args,expected=0):
        repo=self.inside(repo)
        if args and args[0]=='push': raise ValueError('push is excluded from this sandbox')
        command=[self.git,'-c','user.name=Notebook Learner','-c','user.email=learner@example.invalid',
          '-c','commit.gpgsign=false','-c','tag.gpgsign=false','-c','core.autocrlf=false',
          '-c','core.editor=true','-c','core.hooksPath='+str(self.hooks),*args]
        result=subprocess.run(command,cwd=repo,env=self.env,text=True,encoding='utf-8',
                              stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
        if result.returncode!=expected:
            raise AssertionError(f'{args}: expected exit {expected}, got {result.returncode}\n{result.stdout}\n{result.stderr}')
        return result.stdout.strip()

    def repo(self,name):
        repo=self.inside(self.root/name); repo.mkdir()
        self.run(repo,'init','-b','main')
        return repo

    def put(self,repo,name,value):
        self.inside(repo/name).write_text(value,encoding='utf-8')

    def commit(self,repo,message):
        self.run(repo,'add','--all'); self.run(repo,'commit','-m',message)
        return self.run(repo,'rev-parse','HEAD')

def foundation(box):
    repo=box.repo('foundation')
    box.put(repo,'notes.txt','one\n'); first=box.commit(repo,'Record one note')
    box.put(repo,'notes.txt','two\n'); box.run(repo,'add','notes.txt')
    box.put(repo,'notes.txt','three\n')
    assert '+two' in box.run(repo,'diff','--cached')
    assert '+three' in box.run(repo,'diff')
    box.run(repo,'commit','-m','Commit staged two, leave three unstaged')
    assert box.run(repo,'show','HEAD:notes.txt')=='two'
    assert (repo/'notes.txt').read_text(encoding='utf-8')=='three\n'
    box.run(repo,'restore','notes.txt')
    box.put(repo,'.gitignore','local.env\n')
    box.put(repo,'local.env','SYNTHETIC_TOKEN=not-a-real-secret\n')
    box.commit(repo,'Ignore local synthetic configuration')
    assert box.run(repo,'check-ignore','local.env')=='local.env'
    assert not box.run(repo,'ls-files','local.env')
    assert box.run(repo,'status','--porcelain')==''
    return {'stage':'foundation','staged_snapshot':'two','ignored_untracked':True,'first_commit':first}

def intermediate(box):
    repo=box.repo('intermediate')
    box.put(repo,'policy.txt','base\n'); box.commit(repo,'Base policy')
    box.run(repo,'switch','-c','feature')
    box.put(repo,'policy.txt','feature\n'); box.commit(repo,'Feature policy')
    box.run(repo,'switch','main')
    box.put(repo,'policy.txt','main\n'); box.commit(repo,'Main policy')
    box.run(repo,'merge','feature',expected=1)
    assert box.run(repo,'diff','--name-only','--diff-filter=U')=='policy.txt'
    box.run(repo,'merge','--abort')
    assert (repo/'policy.txt').read_text(encoding='utf-8')=='main\n'
    box.run(repo,'merge','feature',expected=1)
    box.put(repo,'policy.txt','main and feature\n'); merge=box.commit(repo,'Reconcile both policies')
    assert len(box.run(repo,'rev-list','--parents','-n','1','HEAD').split())==3
    clone=box.inside(box.root/'reviewer')
    box.run(box.root,'clone','--no-local',str(repo),str(clone))
    old=box.run(clone,'rev-parse','HEAD')
    box.put(repo,'release.txt','candidate\n'); latest=box.commit(repo,'Add release candidate')
    box.run(clone,'fetch','origin')
    assert box.run(clone,'rev-parse','HEAD')==old
    assert box.run(clone,'rev-parse','origin/main')==latest
    box.run(clone,'merge','--ff-only','origin/main')
    assert box.run(clone,'rev-parse','HEAD')==latest
    return {'stage':'intermediate','conflict_resolved':True,'merge_commit':merge,'fetch_preserved_local_head':True}

def advanced(box):
    repo=box.repo('advanced')
    box.put(repo,'mode.txt','safe\n'); base=box.commit(repo,'Safe baseline')
    box.put(repo,'mode.txt','bug\n'); bad=box.commit(repo,'Introduce synthetic regression')
    box.put(repo,'extra.txt','unrelated\n'); box.commit(repo,'Unrelated change')
    box.run(repo,'bisect','start','HEAD',base)
    check=box.root/'check.py'
    check.write_text("import pathlib,sys; sys.exit(1 if pathlib.Path('mode.txt').read_text().strip()=='bug' else 0)\n",encoding='utf-8')
    import sys
    box.run(repo,'bisect','run',sys.executable,str(check))
    assert box.run(repo,'rev-parse','refs/bisect/bad')==bad
    box.run(repo,'bisect','reset')
    box.run(repo,'revert','--no-edit',bad)
    assert (repo/'mode.txt').read_text(encoding='utf-8')=='safe\n'
    box.run(repo,'switch','-c','private')
    box.put(repo,'private.txt','recoverable\n'); lost=box.commit(repo,'Private experiment')
    box.run(repo,'reset','--hard','HEAD~1') # owned synthetic repo only
    assert lost in box.run(repo,'reflog','--format=%H')
    box.run(repo,'branch','recovered',lost)
    box.run(repo,'switch','main')
    box.run(repo,'cherry-pick',lost)
    assert (repo/'private.txt').read_text(encoding='utf-8')=='recoverable\n'
    box.run(repo,'switch','-c','topic',base)
    box.put(repo,'topic.txt','topic\n'); topic_old=box.commit(repo,'Private topic')
    box.run(repo,'rebase','main')
    assert box.run(repo,'rev-parse','HEAD')!=topic_old
    assert box.run(repo,'merge-base','--is-ancestor','main','HEAD')==''
    box.run(repo,'tag','-a','v0.1-training','-m','Synthetic reviewed candidate')
    assert box.run(repo,'cat-file','-t','v0.1-training')=='tag'
    return {'stage':'advanced','bisect_first_bad':bad,'reverted_content':'safe','recovered_commit':lost,
            'rebase_changed_identity':True,'annotated_tag':True}

def run_stage(stage):
    if stage not in ('foundation','intermediate','advanced','all'): raise ValueError('unknown stage')
    with tempfile.TemporaryDirectory(prefix='ln-git-owned-') as directory:
        box=Sandbox(directory)
        stages=['foundation','intermediate','advanced'] if stage=='all' else [stage]
        result=[globals()[name](box) for name in stages]
        return {'git_version':box.run(box.root,'--version'),'results':result,'cleanup':'owned temporary repositories removed on exit'}

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--stage',choices=['foundation','intermediate','advanced','all'],default='all')
    print(json.dumps(run_stage(parser.parse_args().stage),indent=2))
