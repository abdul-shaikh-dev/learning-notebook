# Optional build-and-break exercise

Run python owner_version_lab.py beside durable_state.py. The interleaving uses two real connections without timing-dependent threads: both read version 1, A writes 2, B tries 1 and fails, then B reloads and writes 3. The second case starts from two observations of a missing run. Predict which write wins before running. Break the version predicate in a copied durable_state.py and watch the first test detect lost state. This establishes stale-checkpoint rejection, not a distributed lease or an external side-effect fence.
