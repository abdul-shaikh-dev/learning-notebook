# Practical maths and statistics practice

Use Python 3.11 or newer. No packages, network connection or GPU are required.
Keep all four Python files together. Commands below run from the extracted folder.
These are small reference calculations, not a statistical inference library.

## Try the projects

Write your attempt in a separate folder before reading the reference files. Keep
the function names so you can copy test_projects.py beside your attempt and run
the same independent checks. Add one new case of your own for each project.

1. Foundation: implement rate(count, seconds), relative_change(old, new) and
   combined_rate(counts, durations). Accept finite int/float values, excluding
   bool. Counts are nonnegative, durations positive, and the old count positive.
   Collections must be nonempty and have equal lengths. Reject invalid inputs
   with ValueError. Compute the combined rate from totals, not averaged rates.
2. Intermediate: implement summarize(values), conditional_count(joint,
   conditioned) and known_sigma_interval(average, sigma, n). A summary needs at
   least two finite observations and returns n, mean, median and sample_variance.
   Counts are whole numbers with 0 <= joint <= conditioned and conditioned > 0.
   An interval requires finite mean, nonnegative known sigma and positive integer
   n. Use a 1.96 multiplier. Interpret it only for independent samples from a
   normal population with known sigma. Unknown-sigma inference is outside this lab.
3. Advanced: implement dot(left, right), matvec(matrix, values) and cosine(left,
   right). Require nonempty, finite int/float vectors of matching dimensions.
   Require a nonempty rectangular matrix. Reject zero vectors for cosine.
   Use small coordinates here; these implementations do not guard against
   floating-point overflow from extreme finite inputs.

Run each reference:

```text
python foundation_project.py
python intermediate_project.py
python advanced_project.py
python -m unittest -v test_projects.py
```

Expected foundation output is 5.0 then -0.2. Intermediate output reports n=5,
mean=28, median=10 and sample_variance=1620, then 0.4706 and (48.04, 51.96).
Advanced output is [0.8, 0.64] then [0.65, 0.7]. The suite has 20 tests.

## Explain the result

For foundation, show the units cancelling and name the original-value denominator.
For intermediate, distinguish the sample spread from uncertainty about its mean.
Explain why an alert detection rate does not answer whether an alert is correct.
For advanced, explain why changing weights changes the preferred candidate.
Propose random assignment within comparable hardware groups before claiming a
deployment causes faster responses. A before/after chart alone cannot establish it.

The observations and scores are fictional. Passing these arithmetic and error
checks does not validate a sampling design, a causal claim or a real deployment.
