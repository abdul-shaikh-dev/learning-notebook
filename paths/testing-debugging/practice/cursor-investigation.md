# A timeline sometimes loses entries

Reported behavior: page one shows a,b; page two shows d; c is missing. Rows a,b,c have time5 and d has time6. The caller also reports that editing a returned title can change a later response.

Contract: sort flat rows by `(time,id)`, return at most limit rows, and resume strictly after the complete last key. The dataset remains unchanged during a walk; IDs are unique strings and times integers. Returned row dictionaries must not alias input dictionaries. Limit is an integer1..100. Empty results return `([],None)`.

Run `python cursor_checks.py cursor_candidate`. It intentionally exits nonzero with four failing methods. Copy the candidate to `my_cursor.py`, fix the behavior, then run `python cursor_checks.py my_cursor`. Use the supplied tests as clues and add one reproduction of your own. `python cursor_checks.py` runs the corrected reference and passes four methods.

The input rows are trusted under the stated contract; the lab does not validate an HTTP cursor token or concurrent database pagination. Optional transfer: add nested metadata and decide its ownership policy, then build a test that mutates only that nested field. The flat-copy reference deliberately does not solve that extension.
