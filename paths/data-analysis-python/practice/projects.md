# Stage projects

## Inspect the support export

Load the supplied file, document one-row-per-ticket grain, check types and produce a short quality summary.

- Check 24 rows and 24 unique IDs.
- Calculate known duration count without replacing missing values with zero.
- Demonstrate how one conflicting duplicate changes validation.

Reference approach: The supplied clean file has 24 unique tickets and no missing required values. Keep its raw bytes unchanged. Reject the conflicting duplicate; do not choose a duration silently.

## Compare teams without multiplying rows

Attach team owners and calculate ticket counts, breach counts, rates and mean durations. Produce a labeled count chart.

- Enforce a many-to-one lookup and reject unmatched teams.
- Calculate the overall rate from ticket counts.
- Show a histogram separately from the category comparison.

Reference approach: Use validate="many_to_one" plus merge indicator checks. Each team has 12 tickets. Keep the all-ticket denominator at 24. Report the actual calculated breach counts; the chart labels ticket counts, not hours.

## Deliver a reproducible analysis

Create one command that validates the input and writes a report, chart and input provenance. Explain the limits of the fictional sample.

- Test negative, infinite and conflicting values.
- Record source hash and library versions.
- Compare strict thresholds of 12, 24 and 48 hours without changing rows.
- Identify fields unavailable at prediction time.

Reference approach: Run the independent tests before generating output. Include the 24-row count, table, source hash and limitation in report.json. Treat alternate thresholds as sensitivity checks; exclude outcome fields from intake prediction.
