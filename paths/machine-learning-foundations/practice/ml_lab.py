"""CPU-only offline experiment. Install requirements.txt first."""
import argparse
import json
import numpy as np
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from metrics_lab import (FEATURES, classify, confusion, choose_threshold, cost,
                         fingerprint, make_tickets, matrix, time_split)

def pipeline(C=1.0):
    numeric=Pipeline([('impute',SimpleImputer(strategy='median')),('scale',StandardScaler())])
    prep=ColumnTransformer([('categories',OneHotEncoder(handle_unknown='ignore',sparse_output=False),[0,1,2]),
                            ('numeric',numeric,[3])])
    return Pipeline([('prepare',prep),('model',LogisticRegression(C=C,max_iter=1000,random_state=23))])

def arrays(rows):
    return np.asarray(matrix(rows),dtype=object), np.asarray([r['breached'] for r in rows])

def positive_probability(model,X):
    index=list(model.classes_).index(1)
    return model.predict_proba(X)[:,index].tolist()

def evaluate(rows, guesses):
    result=confusion([r['breached'] for r in rows],guesses)
    result['cost']=cost(result)
    return result

def run(rows=None, final=False):
    rows=make_tickets() if rows is None else rows
    train,validation,test=time_split(rows)
    X_train,y_train=arrays(train)
    X_validation,y_validation=arrays(validation)
    X_test,_=arrays(test)
    model=pipeline()
    folds=cross_val_score(model,X_train,y_train,cv=TimeSeriesSplit(n_splits=3),scoring='recall')
    model.fit(X_train,y_train)
    validation_probabilities=positive_probability(model,X_validation)
    threshold=choose_threshold(y_validation.tolist(),validation_probabilities)
    validation_guesses=classify(validation_probabilities,threshold)
    mistakes=[dict(ticket_id=r['ticket_id'],actual=r['breached'],predicted=g)
              for r,g in zip(validation,validation_guesses) if r['breached']!=g]
    development=dict(data_sha256=fingerprint(rows),sklearn_version=sklearn.__version__,
        features=list(FEATURES),split_sizes=[len(train),len(validation),len(test)],
        training_cv_recall=folds.tolist(),threshold=threshold,
        validation=evaluate(validation,validation_guesses),validation_mistakes=mistakes,
        limitation='Fictional development results. Final-test metrics remain hidden until --final.')
    if not final:
        return development
    # All choices are frozen before touching test outcomes.
    guesses=classify(positive_probability(model,X_test),threshold)
    dummy=DummyClassifier(strategy='most_frequent').fit(X_train,y_train)
    baseline=dummy.predict(X_test).tolist()
    slices={}
    for channel in ['email','chat']:
        selected=[i for i,r in enumerate(test) if r['channel']==channel]
        slices[channel]=evaluate([test[i] for i in selected],[guesses[i] for i in selected])
    validation_guesses=classify(validation_probabilities,threshold)
    mistakes=[dict(ticket_id=r['ticket_id'],actual=r['breached'],predicted=g)
              for r,g in zip(validation,validation_guesses) if r['breached']!=g]
    return dict(data_sha256=fingerprint(rows),sklearn_version=sklearn.__version__,features=list(FEATURES),
        split_sizes=[len(train),len(validation),len(test)],training_cv_recall=folds.tolist(),threshold=threshold,
        validation=evaluate(validation,validation_guesses),validation_mistakes=mistakes,
        test_model=evaluate(test,guesses),test_baseline=evaluate(test,baseline),test_channels=slices,
        repeated_test_customers=len({r['customer_id'] for r in train}&{r['customer_id'] for r in test}),
        limitation='Fictional later-date evaluation with repeated customers; not evidence of real support performance.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--final',action='store_true',help='Reveal final-test metrics after freezing all choices')
    args=parser.parse_args()
    print(json.dumps(run(final=args.final),indent=2))
