"""Two local roles: reviewer flags a candidate, author revises, reviewer checks it."""
import argparse
import json
from pathlib import Path
import tempfile

from sandbox import Sandbox


def exercise(root):
    box = Sandbox(root)
    author = box.repo('author')
    box.put(author, 'policy.txt', 'release requires tests and rollback\n')
    base = box.commit(author, 'Record release policy')
    box.run(author, 'switch', '-c', 'candidate')
    box.put(author, 'policy.txt', 'release requires tests\n')
    first = box.commit(author, 'Draft release checklist')
    reviewer = box.inside(box.root/'reviewer')
    box.run(box.root, 'clone', '--no-local', str(author), str(reviewer))
    box.run(reviewer, 'switch', '-c', 'review', first)
    proposed = box.run(reviewer, 'show', 'HEAD:policy.txt')
    assert 'rollback' not in proposed
    feedback = 'Blocking: preserve a rollback step; the candidate removed it.'
    (box.root/'review-feedback.txt').write_text(feedback+'\n', encoding='utf-8')
    box.put(author, 'policy.txt', 'release requires tests, smoke check and rollback\n')
    revised = box.commit(author, 'Address review: retain rollback and add smoke check')
    assert revised != first
    box.run(reviewer, 'fetch', 'origin')
    assert box.run(reviewer, 'rev-parse', 'HEAD') == first
    assert box.run(reviewer, 'rev-parse', 'origin/candidate') == revised
    box.run(reviewer, 'switch', '--detach', revised)
    reviewed = box.run(reviewer, 'show', 'HEAD:policy.txt')
    assert 'smoke check and rollback' in reviewed
    assert box.run(reviewer, 'diff', '--name-only', base, revised) == 'policy.txt'
    report = {'base':base, 'first_candidate':first, 'revised_candidate':revised,
              'feedback':feedback, 'reviewer_verified':reviewed,
              'author_repo':str(author), 'reviewer_repo':str(reviewer),
              'hosted_approval_or_branch_protection':'not exercised'}
    (box.root/'review-evidence.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    return report


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--workspace-parent',type=Path,default=Path('.'))
    args=parser.parse_args()
    parent=args.workspace_parent.resolve(strict=True)
    if not parent.is_dir(): raise ValueError('workspace parent must be a directory')
    root=Path(tempfile.mkdtemp(prefix='ln-review-owned-',dir=parent))
    print(json.dumps(exercise(root), indent=2))
