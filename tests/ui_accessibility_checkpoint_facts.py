"""Fact checks for the UI Design & Accessibility checkpoint answers.

Each fact runs the course's lab in paths/ui-accessibility/practice with Node: contrast.cjs for colour
ratios, semantics.test.cjs as shipped, and demo.js inside a minimal fake DOM (only the element methods
demo.js calls), so its real submit, preview and close handlers run. Other facts read demo.html and
demo.css. Each returns the text of the option the result supports, and the script fails if that differs
from the authored correct option. No browser or network is used. Needs Node.js on PATH.
Run with Python 3.11+: python tests/ui_accessibility_checkpoint_facts.py
"""
from html.parser import HTMLParser
import json
from pathlib import Path
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'ui-accessibility'
PRACTICE = COURSE / 'practice'
NODE = shutil.which('node')

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'user-goals/2': 'Do not invent user preferences and call them research; label hypotheses, lesson 1',
    'information-architecture/2': 'Preserve an ordered list of destinations alongside graphical navigation, lesson 2',
    'hierarchy-layout/2': 'Do not make every button primary; document which action advances the task, lesson 3',
    'type-content/2': 'A fixed-height card often fails when a title wraps or text spacing increases, lesson 7',
    'images-diagrams/2': 'A literal inventory of shapes misses the concept, lesson 12',
    'tables-charts/2': 'Values must stay discoverable without hover or colour; offer a table, lesson 13',
    'design-tokens/2': 'colour-danger says why it exists; red-500 says only how it looks, lesson 15',
    'accessible-data-entry/2': 'AA Target Size generally uses 24 by 24 CSS pixels; 44px is the demo preference, lesson 16',
    'accessible-auth/2': 'Allow password managers and paste where appropriate, lesson 18',
    'usability-testing/2': 'Do not convert a sample of three participants into a claim about all users, lesson 20',
    'inclusive-release/2': 'Passing the demo checks is evidence about that demo at that time, lesson 21',
}

# Runs demo.js against a fake document. Each step: ["type", text] then ["submit"], ["preview"] or ["close"].
HARNESS = r"""
const fs=require('node:fs'),vm=require('node:vm');
const steps=JSON.parse(process.argv[1]);const doc={activeElement:null};
function element(id){const e={id,value:'',textContent:'',attributes:{},children:[],handlers:{},open:false,
 setAttribute(k,v){this.attributes[k]=String(v)},removeAttribute(k){delete this.attributes[k]},
 addEventListener(t,f){(this.handlers[t]??=[]).push(f)},focus(){doc.activeElement=this.id},
 append(c){this.children.push(c)},showModal(){this.open=true}};return e;}
const ids=['lesson-title','title-error','status','lessons','preview-dialog','preview','lesson-form','preview-summary','dialog-title'];
const els=Object.fromEntries(ids.map(id=>[id,element(id)]));
const document={getElementById:id=>els[id]??null,createElement:tag=>element('<'+tag+'>')};
vm.runInNewContext(fs.readFileSync('demo.js','utf8'),{document});
const fire=(id,type)=>(els[id].handlers[type]||[]).forEach(f=>f({preventDefault(){}}));
const snaps=[];
for(const [action,text] of steps){
 if(action==='type')els['lesson-title'].value=text;
 if(action==='submit')fire('lesson-form','submit');
 if(action==='preview')fire('preview','click');
 if(action==='close'){els['preview-dialog'].open=false;fire('preview-dialog','close');}
 snaps.push({action,invalid:els['lesson-title'].attributes['aria-invalid']??null,error:els['title-error'].textContent,
  status:els['status'].textContent,items:els['lessons'].children.map(c=>c.textContent),focus:doc.activeElement,
  summary:els['preview-summary'].textContent,dialogOpen:els['preview-dialog'].open,value:els['lesson-title'].value});
}
console.log(JSON.stringify(snaps));
"""


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def node(*args):
    if not NODE:
        raise RuntimeError('Node.js is required for the UI Design & Accessibility facts')
    run = subprocess.run([NODE, *args], cwd=PRACTICE, capture_output=True, text=True, timeout=30)
    if run.returncode:
        raise RuntimeError(run.stderr or run.stdout)
    return run.stdout


def contrast(a, b):
    return json.loads(node('contrast.cjs', a, b))['ratio']


def demo(*steps):
    return json.loads(node('-e', HARNESS, json.dumps(steps)))


class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


def html_tags():
    parser = Tags()
    parser.feed((PRACTICE / 'demo.html').read_text(encoding='utf-8'))
    return parser.tags


CSS = (PRACTICE / 'demo.css').read_text(encoding='utf-8')


def semantic_html():
    tags = html_tags()
    field = next(a for t, a in tags if t == 'input' and a.get('id') == 'lesson-title')
    label = [a for t, a in tags if t == 'label' and a.get('for') == field['id']]
    return pick((len(label), 'placeholder' in field, 'aria-label' in field),
                {(1, False, False): "A label element whose for matches the input's id"})


def keyboard_focus():
    tags = html_tags()
    main = next(a for t, a in tags if t == 'main')
    skip = next(a for t, a in tags if t == 'a' and 'skip' in a.get('class', ''))
    positive = sum(int(a['tabindex']) > 0 for _, a in tags if 'tabindex' in a)
    return pick((main.get('tabindex'), skip.get('href') == '#' + main.get('id'), positive),
                {('-1', True, 0): 'So the skip link can move focus there without adding it to the Tab order'})


def contrast_colour():
    ratio = contrast('777777', 'ffffff')
    return pick((round(ratio, 2), ratio >= 4.5, ratio >= 3),
                {(4.48, False, True): 'About 4.48:1, failing AA for ordinary text but passing for large text'})


def responsive_reflow():
    return pick('grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))' in CSS,
                {True: 'Each column is at least min(100%, 20rem), so a narrow screen gets one full-width column'})


def forms_validation():
    snap = demo(['type', ''], ['submit'])[-1]
    return pick((snap['invalid'], bool(snap['error']), snap['focus'], len(snap['items'])),
                {('true', True, 'lesson-title', 0):
                 'aria-invalid is set, an error message appears and focus returns to the input'})


def states_feedback():
    return demo(['type', 'Contrast'], ['submit'])[-1]['status']


def dialog_pattern():
    snaps = demo(['preview'], ['close'])
    return pick((snaps[0]['dialogOpen'], snaps[0]['focus'], snaps[1]['focus']),
                {(True, 'dialog-title', 'preview'): 'Back on the Preview study plan button'})


def motion_media():
    reduced = CSS.split('@media(prefers-reduced-motion:reduce)', 1)[1].split('}}', 1)[0]
    return pick(('#lessons li{animation:appear' in CSS, '#lessons li{animation:none' in reduced),
                {(True, True): 'Turns their appear animation off'})


def internationalisation():
    return demo(['type', 'A'], ['submit'], ['type', 'B'], ['submit'])[-1]['status']


def manual_evaluation():
    out = node('semantics.test.cjs').strip()
    return pick(out, {'PASS: static semantic guardrails only; manual/browser/assistive-technology checks still required':
                      'Static semantic guardrails only; manual and assistive-technology checks are still required'})


def foundation_max():
    return f'{contrast("000000", "ffffff"):g}'


def foundation_header():
    ratio = contrast('17392f', 'ffffff')
    assert 'header{background:#17392f;color:white}' in CSS
    return pick((ratio >= 4.5, round(ratio, 1)), {(True, 12.6): 'Yes: it is about 12.6:1'})


def foundation_invalid():
    run = subprocess.run([NODE, 'contrast.cjs', 'bad', 'ffffff'], cwd=PRACTICE, capture_output=True, text=True, timeout=30)
    return pick((run.returncode, run.stderr.strip()), {(1, 'Use six hexadecimal digits without #'):
                                                       'Throws: Use six hexadecimal digits without #'})


def intermediate_spaces():
    snap = demo(['type', '   '], ['submit'])[-1]
    return pick((snap['invalid'], bool(snap['error']), len(snap['items'])),
                {('true', True, 0): 'It is treated as empty: the error appears and nothing is added'})


def intermediate_recovery():
    snaps = demo(['type', ''], ['submit'], ['type', 'Forms'], ['submit'])
    return pick((snaps[1]['invalid'], snaps[-1]['invalid'], snaps[-1]['error']),
                {('true', None, ''): 'aria-invalid is removed and the error text is cleared'})


def intermediate_preview():
    return demo(['type', 'A'], ['submit'], ['type', 'B'], ['submit'], ['preview'])[-1]['summary']


def advanced_markup():
    snap = demo(['type', '<b>x</b>'], ['submit'])[-1]
    js = (PRACTICE / 'demo.js').read_text(encoding='utf-8')
    return pick((tuple(snap['items']), 'innerHTML' in js), {(('<b>x</b>',), False): 'The literal text <b>x</b>'})


def advanced_error_colour():
    ratio = contrast('9d2020', 'ffffff')
    assert '.error{color:#9d2020' in CSS
    return pick((ratio >= 4.5, round(ratio, 1)), {(True, 7.9): 'About 7.9:1, passing AA for ordinary text'})


def advanced_focus_outline():
    assert 'outline:3px solid #b15e00' in CSS and 'background:#f3f6f2' in CSS
    ratio = contrast('b15e00', 'f3f6f2')
    return pick((ratio >= 3, ratio >= 4.5), {(True, False): '3:1 for non-text contrast, but not 4.5:1'})


FACTS = {
    'semantic-html/2': semantic_html, 'keyboard-focus/2': keyboard_focus, 'contrast-colour/2': contrast_colour,
    'responsive-reflow/2': responsive_reflow, 'forms-validation/2': forms_validation,
    'states-feedback/2': states_feedback, 'dialog-pattern/2': dialog_pattern, 'motion-media/2': motion_media,
    'internationalisation/2': internationalisation, 'manual-evaluation/2': manual_evaluation,
    'stage/foundation/1': foundation_max, 'stage/foundation/2': foundation_header,
    'stage/foundation/3': foundation_invalid,
    'stage/intermediate/1': intermediate_spaces, 'stage/intermediate/2': intermediate_recovery,
    'stage/intermediate/3': intermediate_preview,
    'stage/advanced/1': advanced_markup, 'stage/advanced/2': advanced_error_colour,
    'stage/advanced/3': advanced_focus_outline,
}


def questions():
    data = json.loads((COURSE / 'checkpoints.json').read_text(encoding='utf-8'))
    for lesson, items in data['lessons'].items():
        for i, q in enumerate(items):
            yield f'{lesson}/{i + 2}', q
    for stage, items in data['stages'].items():
        for i, q in enumerate(items):
            yield f'stage/{stage}/{i + 1}', q


def main():
    seen, failures = set(), []
    for key, q in questions():
        seen.add(key)
        if key in SOURCED:
            continue
        if key not in FACTS:
            failures.append(f'{key}: no fact check and no cited source')
            continue
        try:
            answer = FACTS[key]()
        except Exception as error:  # report every failing fact, not just the first
            failures.append(f'{key}: {error}')
            continue
        if answer != q['options'][q['correct']]:
            failures.append(f'{key}: the lab supports {answer!r}, the question marks {q["options"][q["correct"]]!r}')
    failures += [f'{key}: fact has no question' for key in set(FACTS) | set(SOURCED) if key not in seen]
    if failures:
        sys.exit('UI Design & Accessibility checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} UI Design & Accessibility checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
