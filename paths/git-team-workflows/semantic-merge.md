# Two valid branches, one invalid merge

Run `python semantic_merge.py --workspace-parent .`. It creates and retains a new `ln-semantic-merge-owned-*` child with source, Alice and Bob repositories. The printed JSON names Bob's repository and relevant commits. No existing repository is changed, and no push/network operation is performed.

After the clean merge, the batch size is 8 and capacity is 6, so valid is false. After the repair, both are 6 and valid is true. `semantic-merge-evidence.json` contains the Git transcript. Inspect `git -C <reported-repository> log --all --graph --oneline`, then `git -C <reported-repository> diff <merge> <repaired>` using IDs in that file. The angle-bracket tokens are placeholders, not literal shell arguments.

Run `python -m unittest -v test_semantic_merge.py` for a temporary automated fixture. One test verifies the multi-step scenario, unchanged source and absence of push commands.

Extension: give Alice a batch size of 4 and Bob a capacity of 6. Expect a valid merge with no repair needed. Then require a minimum batch size of 5 and find a case in which two local checks still miss a shared invariant. Hosted reviews, branch protection and authentication remain separate work.
