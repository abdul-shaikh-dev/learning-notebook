# Two valid branches, one invalid merge

Run `python semantic_merge.py --workspace-parent .`. It creates and retains a new `ln-semantic-merge-owned-*` child with source, Alice and Bob repositories. The printed JSON names Bob's repository and relevant commits. No existing repository is changed, and no push/network operation is performed.

Expected clean-merge state: batch8, capacity6, valid=false. Expected repaired state: batch6, capacity6, valid=true. `semantic-merge-evidence.json` contains the Git transcript. Inspect `git -C <reported-repository> log --all --graph --oneline`, then `git -C <reported-repository> diff <merge> <repaired>` using IDs in that file. The angle-bracket tokens are placeholders, not literal shell arguments.

Run `python -m unittest -v test_semantic_merge.py` for a temporary automated fixture. One test verifies the multi-step scenario, unchanged source and absence of push commands.

Extension: use Alice batch4 and Bob capacity6; expect a valid merge with no necessary repair. Then add a policy requiring minimum batch5 and find a case in which two local checks still miss a shared invariant. Hosted reviews, branch protection and authentication remain separate work.
