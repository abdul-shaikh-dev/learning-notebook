"""Fact checks for the Machine learning foundations checkpoint answers.

Each fact runs the course's lab in paths/machine-learning-foundations/practice: metrics_lab.py's metrics,
generator and splitters, and ml_lab.py's pipeline and run, in development and final mode. Each returns the
text of the option the result supports, and the script fails if that differs from the authored correct
option. Needs the course's pinned packages (practice/requirements.txt), as in the data-science CI job.
Run with Python 3.14+: python tests/machine_learning_checkpoint_facts.py
"""
from functools import cache
import json
import math
from pathlib import Path
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / 'paths' / 'machine-learning-foundations'
PRACTICE = COURSE / 'practice'
sys.path.insert(0, str(PRACTICE))
import numpy as np  # noqa: E402
from sklearn.linear_model import LogisticRegression  # noqa: E402
import metrics_lab as metrics  # noqa: E402
import ml_lab  # noqa: E402

# Answers that follow from the lesson text rather than lab behaviour.
SOURCED = {
    'learning-curves/2': 'Refit preprocessing and the estimator on each training subset, lesson 14',
}


def pick(value, table):
    if value not in table:
        raise AssertionError(f'unexpected result {value!r}')
    return table[value]


def outcome(action):
    """Run action and name the exception it raises, or return its result."""
    try:
        return action()
    except Exception as error:
        return f'{type(error).__name__}: {error}'


def raises(action):
    return 'Raises ' + outcome(action)


def percent(value):
    return f'{value * 100:.1f}%'


@cache
def rows():
    return tuple(metrics.make_tickets())


@cache
def development():
    return ml_lab.run(list(rows()))


@cache
def final():
    return ml_lab.run(list(rows()), final=True)


@cache
def fitted(C=1.0):
    train = metrics.time_split(list(rows()))[0]
    X, y = ml_lab.arrays(train)
    return ml_lab.pipeline(C=C).fit(X, y)


def prediction_question():
    data = rows()
    return pick(all(r['breached'] == int(r['resolution_hours'] > 24) for r in data),
                {True: 'Whether resolution_hours is above 24'})


def features_and_targets():
    return pick(metrics.FEATURES, {('channel', 'priority', 'team', 'customer_messages'):
                                   'channel, priority, team and customer_messages'})


def simple_baselines():
    base = final()['test_baseline']
    return f"Accuracy about {percent(base['accuracy'])}, recall {base['recall']:g}"


def holdout_splits():
    parts = metrics.time_split(list(rows()))
    ordered = parts[0][-1]['created_date'] < parts[1][0]['created_date'] < parts[2][0]['created_date']
    sizes = tuple(len(p) for p in parts)
    return pick((sizes, ordered), {((144, 48, 48), True): '144 training, 48 validation and 48 test rows, in date order'})


def classification_metrics():
    r = metrics.confusion([1, 0, 1, 0], [1, 1, 0, 0])
    return pick((r['tp'], r['fp'], r['fn'], r['tn'], r['precision'], r['recall']),
                {(1, 1, 1, 1, 0.5, 0.5): 'One of each outcome, so precision and recall are both 0.5'})


def regression_metrics():
    return repr(metrics.mae([4, 10], [6, 6]))


def class_imbalance():
    breaches = sum(r['breached'] for r in rows())
    return f'{breaches}, about {percent(breaches / len(rows()))}'


def fit_a_regression():
    return raises(lambda: metrics.mae([4, 10], [6, math.nan]))


def fit_a_classifier():
    return str(metrics.classify([0.5, 0.49], 0.5))


def prepare_features():
    model = fitted()
    row = np.asarray([['phone', 'low', 'billing', 3]], dtype=object)
    encoded = model.named_steps['prepare'].transform(row)[0]
    return pick((tuple(encoded[:2]), int(model.predict(row)[0]) in (0, 1)),
                {((0.0, 0.0), True): 'Its channel columns are all zero, and a prediction is still made'})


def pipeline_training():
    names = tuple(name for name, _ in fitted().steps)
    numeric = fitted().named_steps['prepare'].named_transformers_['numeric']
    return pick((names, tuple(name for name, _ in numeric.steps)),
                {(('prepare', 'model'), ('impute', 'scale')):
                 "On each fold's training rows, because they are steps in the pipeline"})


def cross_validation():
    source = (PRACTICE / 'ml_lab.py').read_text(encoding='utf-8')
    folds = development()['training_cv_recall']
    return pick((len(folds), 'cross_val_score(model,X_train,y_train,cv=TimeSeriesSplit(n_splits=3)' in source,
                 development()['split_sizes'][0]),
                {(3, True, 144): '3, from TimeSeriesSplit folds of the 144 training rows'})


def overfitting_regularization():
    strong = np.linalg.norm(fitted(0.01).named_steps['model'].coef_)
    default = np.linalg.norm(fitted(1.0).named_steps['model'].coef_)
    return pick(strong < default / 2, {True: 'Much smaller in total size, because regularization is stronger'})


def leakage_audit():
    train, validation, _ = metrics.time_split(list(rows()))
    hours = lambda part: np.asarray([[r['resolution_hours']] for r in part])  # noqa: E731
    labels = lambda part: np.asarray([r['breached'] for r in part])  # noqa: E731
    model = LogisticRegression(max_iter=1000).fit(hours(train), labels(train))
    accuracy = float((model.predict(hours(validation)) == labels(validation)).mean())
    return pick(accuracy, {1.0: '100%, because the feature reconstructs the label'})


def time_and_group_splits():
    test = metrics.time_split(list(rows()))[2]
    shared = final()['repeated_test_customers']
    return pick((shared, len({r['customer_id'] for r in test})),
                {(48, 48): '48: every test customer also appears in training'})


def error_analysis():
    mistakes = development()['validation_mistakes']
    v = development()['validation']
    keys = tuple({tuple(sorted(m)) for m in mistakes})
    return pick((len(mistakes), v['fp'] + v['fn'], keys),
                {(21, 21, (('actual', 'predicted', 'ticket_id'),)):
                 '21, each with its ticket ID and actual and predicted labels'})


def threshold_policy():
    d = development()
    v = d['validation']
    assert v['cost'] == 4 * v['fn'] + v['fp']
    return f"{d['threshold']}, at cost {v['cost']} with 4 per missed breach and 1 per false alarm"


def reproduce_an_experiment():
    a, b = metrics.fingerprint(metrics.make_tickets()), metrics.fingerprint(metrics.make_tickets())
    other = metrics.fingerprint(metrics.make_tickets(seed=24))
    return pick((a == b, a == other), {(True, False): 'The two default runs match and seed 24 differs'})


def distribution_change():
    parts = metrics.time_split(list(rows()))
    rates = [sum(r['breached'] for r in p) / len(p) for p in parts]
    return f'{percent(rates[0])}, {rates[1]:.0%} and about {percent(rates[2])}'


def model_review_capstone():
    f = final()
    return f"{f['test_model']['cost']} for the model and {f['test_baseline']['cost']} for the baseline"


def foundation_labels():
    return raises(lambda: metrics.confusion([1, 2], [1, 0]))


def foundation_empty():
    return raises(lambda: metrics.confusion([], []))


def foundation_small():
    return raises(lambda: metrics.make_tickets(n=5))


def intermediate_threshold():
    return raises(lambda: metrics.classify([0.2], 1.5))


def intermediate_probability():
    return raises(lambda: metrics.classify([1.2], 0.5))


def intermediate_tie():
    return pick(metrics.choose_threshold([0], [0.1]), {0.7: '0.7: ties go to the higher threshold'})


def advanced_dates():
    data = list(rows())
    data[0], data[1] = data[1], data[0]
    return raises(lambda: metrics.time_split(data))


def advanced_group():
    train, test = metrics.group_split(list(rows()), {'C000'})
    shared = {r['customer_id'] for r in train} & {r['customer_id'] for r in test}
    return pick((len(test), len(shared)), {(4, 0): '4 rows, sharing no customers'})


def advanced_slices():
    slices = final()['test_channels']
    return f"About {percent(slices['email']['precision'])} for email and {percent(slices['chat']['precision'])} for chat"


FACTS = {
    'prediction-question/2': prediction_question, 'features-and-targets/2': features_and_targets,
    'simple-baselines/2': simple_baselines, 'holdout-splits/2': holdout_splits,
    'classification-metrics/2': classification_metrics, 'regression-metrics/2': regression_metrics,
    'class-imbalance/2': class_imbalance, 'fit-a-regression/2': fit_a_regression,
    'fit-a-classifier/2': fit_a_classifier, 'prepare-features/2': prepare_features,
    'pipeline-training/2': pipeline_training, 'cross-validation/2': cross_validation,
    'overfitting-regularization/2': overfitting_regularization, 'leakage-audit/2': leakage_audit,
    'time-and-group-splits/2': time_and_group_splits, 'error-analysis/2': error_analysis,
    'threshold-policy/2': threshold_policy, 'reproduce-an-experiment/2': reproduce_an_experiment,
    'distribution-change/2': distribution_change, 'model-review-capstone/2': model_review_capstone,
    'stage/foundation/1': foundation_labels, 'stage/foundation/2': foundation_empty,
    'stage/foundation/3': foundation_small,
    'stage/intermediate/1': intermediate_threshold, 'stage/intermediate/2': intermediate_probability,
    'stage/intermediate/3': intermediate_tie,
    'stage/advanced/1': advanced_dates, 'stage/advanced/2': advanced_group, 'stage/advanced/3': advanced_slices,
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
        sys.exit('Machine learning foundations checkpoint facts failed:\n' + '\n'.join(failures))
    print(f'PASS: {len(FACTS)} Machine learning foundations checkpoint answers checked against the course labs; '
          f'{len(SOURCED)} cited from the lessons.')


if __name__ == '__main__':
    main()
