# Ticket report contract

This is an original fictional teaching tool. It reports recorded effort, not remaining workload.

Input is a small UTF-8 CSV with the exact header `id,status,minutes`, in that order. The reader ignores completely blank lines as Python's CSV reader does. A header-only file is valid; an empty file is not. Fields must not contain surrounding whitespace. IDs must be nonblank and unique. Status is exactly `open`, `closed` or `cancelled`. Minutes use one through four ASCII digits and have a value from 0 through 1440 inclusive. Leading zeroes are allowed within that length. Reject missing or additional fields. Validate every record before filtering.

Default output contains exactly the JSON keys `count` and `total_minutes` on stdout, with a trailing newline. Every valid record counts, including zero-minute tickets. The optional `--status` selects matching records. A valid selection with no matches returns both values as zero. Successful default execution exits 0 with empty stderr. Input, argument and file errors exit 2 with a diagnostic on stderr and no success JSON.

`--output PATH` writes the same JSON to a local file and leaves stdout empty. Parse all input first. A failed validation or replacement preserves an existing destination. The reference writes a temporary file in the destination directory and removes it on a replacement failure. Output cannot resolve to the input path. Use a distinct ordinary file, not a special device or a hard link to the input. Assume a single writer and trusted local paths. Atomic replacement is not a promise of power-loss durability, concurrent update safety or metadata preservation.

The fixture totals 4 records and 20 minutes. Open records total 2 and 12; closed 1 and 5; cancelled 1 and 3.
