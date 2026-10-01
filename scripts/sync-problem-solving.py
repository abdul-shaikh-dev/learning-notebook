"""Build the challenge reader and downloadable files from one original problem set."""
from pathlib import Path
import argparse
import json

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths/python-problem-solving'


def build():
    challenges = json.loads((COURSE / 'challenges.json').read_text(encoding='utf-8'))
    assert len(challenges) == 30
    assert len({c['id'] for c in challenges}) == 30
    assert len({c['function'] for c in challenges}) == 30
    files = {}
    starters = ['"""Your attempts. Complete one function at a time; keep the others unchanged."""', 'from __future__ import annotations', '']
    references = ['"""Worked solutions. Open after an attempt; check.py uses solutions.py by default."""', 'from __future__ import annotations', '']
    cases = {}
    lessons = []
    for i, c in enumerate(challenges):
        starter = f'def {c["function"]}({c["signature"]}) -> {c["returns"]}:\n    raise NotImplementedError("Write your solution here")'
        starters.extend([f'# {i+1}. {c["title"]} | {c["id"]}', starter, ''])
        references.extend([f'# {i+1}. {c["title"]}', c['solution'].strip(), ''])
        assert len(c['cases']) >= 6 and len(c['hints']) == 3
        cases[c['id']] = dict(title=c['title'], function=c['function'], cases=c['cases'], preserveInputs=True)
        examples = [f'{c["function"]}('+', '.join(repr(a) for a in example['args'])+')\nExpected: '+repr(example['expected']) for example in c['examples']]
        refs = c.get('references') or [dict(title='Python tutorial: data structures', url='https://docs.python.org/3/tutorial/datastructures.html', section='Lists, dictionaries, sets and looping techniques', reviewed='2026-10-02', scope='Python collection semantics. The problem, algorithm reasoning and test cases are original; this reference does not establish their correctness.')]
        lessons.append(dict(id=c['id'],title=f'{i+1}. {c["title"]}',stage=c['stage'],takeaway=c['difficulty']+' · Python 3.11+ · Test your solution locally',sections=[
            dict(title='The problem',paragraphs=[c['statement'],f'Return a value from {c["function"]}; do not read input or print the answer. Keep the supplied arguments unchanged.']),
            dict(title='Examples',paragraphs=['The calls below show the expected return values. Indexes, where used, start at zero.'],example='\n\n'.join(examples)),
            dict(title='Constraints and edge cases',paragraphs=c['constraints']),
        ],exercise=dict(challenge=True,prompt=f'Complete {c["function"]} below and run the tests. You can also edit solutions.py in the downloadable practice ZIP and use the terminal command shown below.',starter=starter,checks=['Match the expected return values, including edge cases.','Do not modify the input arguments.','A passing finite test set is evidence for these cases, not a proof for every valid input.'],command=f'python check.py {c["id"]}',hints=c['hints'],solution=c['solution'],reasoning=c['approach'],complexity=c['complexity'],pitfalls=c['pitfalls'],transfer=c['transfer']),references=refs))
    files['practice/solutions.py']='\n\n'.join(starters)+'\n'
    files['practice/reference.py']='\n\n'.join(references)+'\n'
    files['practice/cases.json']=json.dumps(cases,ensure_ascii=False,indent=2)+'\n'
    stage_info=[('foundation','Start with small functions','Build confidence with explicit inputs, loops, strings, lists and dictionaries.'),('intermediate','Recognise reusable patterns','Practise counting, two pointers, windows, prefix sums, search and stacks.'),('advanced','Choose the approach yourself','Solve practical tasks whose titles do not name the intended technique.')]
    stages=[]
    tasks=[]
    kit_files=[('attempts','solutions.py','starter','Complete one named function at a time.'),('runner','check.py','test','Run a challenge against its supplied cases.'),('cases','cases.json','test','Readable test inputs and expected outputs; no hidden judge.'),('reference','reference.py','reference','Worked implementations; opened only when you choose.'),('guide','README.md','guide','Setup, workflow, failure messages and limits.'),('runner-tests','test_runner.py','test','Regression tests for the local runner.'),('reference-tests','test_reference.py','test','Independent boundary and oracle checks for the worked solutions.')]
    file_ids=[f[0] for f in kit_files]
    for sid,title,description in stage_info:
        chosen=[c for c in challenges if c['stage']==sid]
        assert len(chosen)==10
        ids=[c['id'] for c in chosen]
        stages.append(dict(id=sid,title=title,description=description,exitCriteria=['Solve a fresh case before looking at the reference.','Use a failed test to locate a mistaken assumption.'],project=dict(title='Optional replay: '+chosen[-1]['title'],brief='Revisit the final challenge in this stage after a break. No written submission or score is required.',requirements=['Try a fresh implementation without copying the reference.','Add one boundary case of your own.'],rubric=['The implementation passes the supplied cases without changing inputs.','Your extra case targets an assumption your first attempt missed.'],solution='Compare the two implementations using their behavior and the assumptions behind their time and space costs. Passing tests supports the checked cases; it does not require matching the reference code.',solutionFormat='prose')))
        tasks.append(dict(id=sid,title=title,kind='lesson',goal=description,fileIds=file_ids,steps=['Download and extract the ZIP once. Open solutions.py in your editor.','Choose one challenge from the stage. Edit only its named function.','Run its command, inspect the first failing input and try again. Hints and reference solutions are optional.'],commands=[dict(label='List the available challenges',command='python check.py --list',expected='The 30 challenge identifiers and titles.'),dict(label='Try the first challenge in this stage',command='python check.py '+ids[0],expected='An unfinished starter reports NotImplementedError. After a correct implementation, all supplied cases pass.'),dict(label='Check the supplied references, when wanted',command='python check.py --all --reference',expected='Every supplied reference passes. This does not test your solutions.py attempts.')],prerequisites=[dict(label='Python functions',href='#topic/python/functions')],notes=['Python 3.11 or newer. Standard library only; no accounts, packages or network requests.','The runner executes code with your normal local permissions. Its timeout is an accidental-hang safeguard, not a security sandbox.','Commands test the original challenge only. Variation prompts are ungraded follow-ups; add your own tests for changed requirements.']))
    manifest=dict(id='python-problem-solving',title='Python Problem Solving',category='Programming',status='ready',description='30 original coding challenges. Start with small functions, practise common patterns, then choose an approach for realistic tasks. Optional hints and local Python tests help you improve each attempt.',level='Guided foundations → common patterns → mixed practical problems',prerequisites=['Comfort with basic Python values, loops and functions. Revisit the Python path whenever a construct is unfamiliar.','Python 3.11 or newer and an editor; no prior algorithm interview experience required.'],outcomes=['Translate a problem statement into a precise function contract.','Choose between scanning, counting, sorting, windows, prefix sums, stacks and binary search.','Debug from a concrete failing input and check empty, duplicate and boundary cases.','Explain time and space costs under explicit assumptions.','Apply familiar patterns to logs, records and scheduling problems.'],setup=['Use the browser editor in each challenge, or download and extract the practice ZIP to work in your own editor.','Open solutions.py and complete one function. The remaining starters may stay unfinished.','Run python check.py --list, then python check.py followed by the challenge identifier shown in the lesson. On some systems use py or python3 instead of python.','Run Python tests in the lesson editor, or use your terminal. Browser Python loads on the first run; save this course for offline execution. No account or model is required.','Start with a simple correct approach. Use a hint only when it helps; compare the worked reasoning after an attempt. Reading progress does not claim that your code passed.'],nextSteps=['Revisit a problem after a break without reopening its solution first.','Attempt the optional variation and write cases for its changed requirements.','Continue to Data Structures & Algorithms for trees, graphs and more advanced algorithm analysis.'],sources=[dict(title='Python tutorial: data structures',url='https://docs.python.org/3/tutorial/datastructures.html'),dict(title='Python built-in types',url='https://docs.python.org/3/library/stdtypes.html')],stages=stages,lessons=lessons,publicFiles=['practice/'+f[1] for f in kit_files]+['runtime/'+f for f in ['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json','LICENSE.txt','provenance.json']],downloads=[dict(title='Practice instructions',href='paths/python-problem-solving/practice/README.md')])
    resources=dict(folder='python-problem-solving-practice',files=[dict(id=id,href='paths/python-problem-solving/practice/'+name,role=role,description=desc) for id,name,role,desc in kit_files],tasks=tasks,lessonTasks={c['id']:c['stage'] for c in challenges},bundle=dict(href='paths/python-problem-solving/practice-bundle.zip'))
    first=challenges[0]['id']
    files['practice/README.md']=f"""# Python problem solving

Thirty original challenges for Python 3.11 or newer. The notebook also has a browser Python editor; these files are for local terminal practice.
The terminal files use no third-party packages or accounts. Browser practice uses the bundled Pyodide runtime and saves drafts with your progress.

## Try one problem

1. Extract the ZIP and open its folder in your terminal.
2. Open `solutions.py`. Find the function named in the notebook challenge.
3. Replace its `raise NotImplementedError` with your attempt. Leave other functions alone.
4. Run `python check.py {first}` for the first challenge. Use `python check.py --list` to choose another identifier.
5. Inspect any failing input, expected value, returned value or exception. Revise and rerun.

Use `py` or `python3` instead of `python` if that is how you start Python on your system.
The runner resolves files beside `check.py`, so it does not depend on the current working directory.
Return the answer from the function. Do not print it or read from standard input.
Learner print output is suppressed so failure reports remain readable.

The first run should fail until you implement the function. Every starter is deliberately unfinished.
The runner never substitutes the reference if your file or function is missing.

## Hints and comparison

The notebook has three optional hints for each problem. Read one, try again, and reveal another only if useful.
The worked solution explains its reasoning, costs and common mistakes. You do not need identical code.
The first stage uses basic loops and collections. The second introduces reusable patterns.
The final stage mixes practical tasks without naming the intended technique in the title.

`python check.py --all` checks your attempts. Unfinished functions report failures.
`python check.py --all --reference` checks only the supplied `reference.py`, not your work.
`python -m unittest -v test_runner.py test_reference.py` checks the runner and reference suite.

## What the results mean

The cases are visible in `cases.json`. There is no hidden server judge or leaderboard.
The runner checks returned values and types, and that your arguments remain unchanged.
A pass supports those examples; it does not prove correctness for every possible input or establish asymptotic efficiency.
Complexity notes assume bounded integer operations and average-case dictionary/set lookup unless stated otherwise.
Empty inputs, duplicates, equality boundaries, tie ordering and malformed records matter where the problem contract includes them.

Each challenge has a five-second process timeout for accidental hangs. This is not a security sandbox.
Run your own trusted code; it has your normal local permissions. A timeout is a practical guard, not a performance grade.
Exit codes are 0 for passing checks, 1 for a failed test or timeout, and 2 for a setup or usage problem.

## Practise again

Add your own cases to `cases.json`. Keep the documented function contract or write a separate function for a variation.
Variation prompts are optional, with no supplied grading cases. Reading progress is separate from successful execution.
Try one challenge again after a break, or choose a new one. No written worksheet, timer or streak is required.

Keep your edited `solutions.py` somewhere safe. Extract future downloads into a new folder so they do not overwrite your attempts.
"""
    files['path.json']=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n'
    files['resources.json']=json.dumps(resources,ensure_ascii=False,indent=2)+'\n'
    return files


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    for name,text in build().items():
        path=COURSE/name
        if args.check:
            if not path.exists() or path.read_text(encoding='utf-8')!=text:
                raise SystemExit('Stale problem-solving file: '+name)
        else:
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(text,encoding='utf-8')
    print('Problem-solving reader, starters, reference and cases match the 30 original challenges.')
