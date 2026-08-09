#!/usr/bin/env python3
"""
VibeBench URL model evaluator.

Three feature modes:
  full       - uses all eligible numeric technical features, including direct builder artifacts.
  portable   - removes direct builder/hosting/header fingerprints to test cross-builder generalization.
  structure  - additionally removes tech/framework flags; tests mostly DOM/assets/SEO structure.

Also runs leave-one-AI-builder-out tests when enough rows exist.
"""
from __future__ import annotations
import argparse, csv, json, math
from pathlib import Path

try:
    import numpy as np
    from sklearn.impute import SimpleImputer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import (
        accuracy_score, brier_score_loss, confusion_matrix,
        precision_recall_fscore_support, roc_auc_score
    )
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import GroupShuffleSplit
except Exception as e:
    raise SystemExit(f"Requires scikit-learn and numpy: {e}")

BASE_EXCLUDE_PREFIXES=(
    "src_","scan_ok","requested_url","final_url","scan_error","html_sha256","rule_score",
    "rule_score_reasons","tls_subject_cn","tls_issuer_org","tls_not_after",
    "content_type","server_header","x_powered_by","cache_control","meta_generator",
)
DIRECT_EXACT={"data_component_id_count"}
BUILDER_TECH_PREFIXES=(
    "tech_webflow_","tech_framer_site_","tech_wix_","tech_squarespace_",
)

def label_from_row(r):
    explicit=(r.get("src_binary_label") or "").upper()
    if explicit=="AI": return 1
    if explicit=="HUMAN": return 0
    c=(r.get("src_cohort") or "").upper()
    if c.startswith("AI_"): return 1
    if c.startswith("HUMAN_"): return 0
    t=(r.get("src_label_target") or "").upper()
    if t.startswith("AI_"): return 1
    if t=="HUMAN_CONTROL": return 0
    return None

def is_float(x):
    try: float(x); return True
    except Exception: return False

def eligible_feature(name, mode):
    if any(name==p or name.startswith(p) for p in BASE_EXCLUDE_PREFIXES):
        return False
    if mode in ("portable","structure"):
        if name.startswith(("builder_","hosting_","header_")):
            return False
        if name in DIRECT_EXACT:
            return False
        if any(name.startswith(p) for p in BUILDER_TECH_PREFIXES):
            return False
    if mode=="structure" and name.startswith("tech_"):
        return False
    return True

def select_numeric(rows, mode):
    headers=list(rows[0].keys())
    numeric=[]
    for h in headers:
        if not eligible_feature(h,mode):
            continue
        vals=[r.get(h,"") for r in rows]
        nonempty=[v for v in vals if v not in ("",None)]
        if nonempty and sum(is_float(v) for v in nonempty)/len(nonempty)>=0.95:
            numeric.append(h)
    return numeric

def matrix(rows, numeric):
    return np.array([
        [float(r[h]) if is_float(r.get(h,"")) else np.nan for h in numeric]
        for r in rows
    ],dtype=float)

def model():
    return Pipeline([
        ("impute",SimpleImputer(strategy="median")),
        ("scale",StandardScaler()),
        ("model",LogisticRegression(max_iter=3000,class_weight="balanced",C=0.5)),
    ])

def metrics(y,prob):
    pred=(prob>=0.5).astype(int)
    p,r,f1,_=precision_recall_fscore_support(y,pred,average="binary",zero_division=0)
    return {
        "n":int(len(y)),
        "positive":int(y.sum()),
        "negative":int((1-y).sum()),
        "accuracy":float(accuracy_score(y,pred)),
        "precision_ai":float(p),
        "recall_ai":float(r),
        "f1_ai":float(f1),
        "brier":float(brier_score_loss(y,prob)),
        "roc_auc":float(roc_auc_score(y,prob)) if len(set(y))==2 else None,
        "confusion_matrix":confusion_matrix(y,pred,labels=[0,1]).tolist(),
    }

def top_coefficients(pipe,numeric,n=12):
    coef=pipe.named_steps["model"].coef_[0]
    pairs=sorted(zip(numeric,coef),key=lambda x:x[1])
    return {
        "most_human":[{"feature":a,"coef":float(b)} for a,b in pairs[:n]],
        "most_ai":[{"feature":a,"coef":float(b)} for a,b in pairs[-n:][::-1]],
    }

def grouped_split_eval(rows,mode,test_size,seed):
    numeric=select_numeric(rows,mode)
    X=matrix(rows,numeric)
    y=np.array([label_from_row(r) for r in rows],dtype=int)
    groups=np.array([
        r.get("src_url_group") or r.get("hostname") or f"row-{i}"
        for i,r in enumerate(rows)
    ])
    splitter=GroupShuffleSplit(n_splits=1,test_size=test_size,random_state=seed)
    tr,te=next(splitter.split(X,y,groups))
    if len(set(y[tr]))<2 or len(set(y[te]))<2:
        # deterministic retries
        for extra in range(1,50):
            splitter=GroupShuffleSplit(n_splits=1,test_size=test_size,random_state=seed+extra)
            tr,te=next(splitter.split(X,y,groups))
            if len(set(y[tr]))==2 and len(set(y[te]))==2:
                break
    if len(set(y[tr]))<2 or len(set(y[te]))<2:
        return {"error":"Could not produce group split containing both classes."}
    pipe=model();pipe.fit(X[tr],y[tr])
    prob=pipe.predict_proba(X[te])[:,1]
    out=metrics(y[te],prob)
    out.update({
        "mode":mode,"n_total":len(rows),"n_train":len(tr),"n_test":len(te),
        "feature_count":len(numeric),
        "top_coefficients":top_coefficients(pipe,numeric),
    })
    return out

def repeated_grouped_split_eval(rows,mode,test_size,seed,repeats):
    numeric=select_numeric(rows,mode)
    X=matrix(rows,numeric)
    y=np.array([label_from_row(r) for r in rows],dtype=int)
    groups=np.array([
        r.get("src_url_group") or r.get("hostname") or f"row-{i}"
        for i,r in enumerate(rows)
    ])
    runs=[]
    for run_index in range(repeats):
        split=None
        for retry in range(50):
            split_seed=seed+run_index*100+retry
            splitter=GroupShuffleSplit(n_splits=1,test_size=test_size,random_state=split_seed)
            tr,te=next(splitter.split(X,y,groups))
            if len(set(y[tr]))==2 and len(set(y[te]))==2:
                split=(tr,te,split_seed)
                break
        if split is None:
            continue
        tr,te,split_seed=split
        pipe=model();pipe.fit(X[tr],y[tr])
        prob=pipe.predict_proba(X[te])[:,1]
        run_metrics=metrics(y[te],prob)
        runs.append({
            "seed":int(split_seed),
            "n_train":int(len(tr)),
            "n_test":int(len(te)),
            **{name:run_metrics[name] for name in ("accuracy","precision_ai","recall_ai","f1_ai","brier","roc_auc")},
        })

    def summarize(name):
        values=np.array([run[name] for run in runs if run[name] is not None],dtype=float)
        if not len(values):
            return None
        return {
            "mean":float(values.mean()),
            "std":float(values.std(ddof=1)) if len(values)>1 else 0.0,
            "p05":float(np.percentile(values,5)),
            "median":float(np.percentile(values,50)),
            "p95":float(np.percentile(values,95)),
            "min":float(values.min()),
            "max":float(values.max()),
        }

    return {
        "mode":mode,
        "n_total":len(rows),
        "feature_count":len(numeric),
        "requested_runs":repeats,
        "completed_runs":len(runs),
        "test_size":test_size,
        "metrics":{name:summarize(name) for name in (
            "accuracy","precision_ai","recall_ai","f1_ai","roc_auc","brier"
        )},
    }

def builder_holdout(rows,mode,min_builder,seed,human_test_fraction):
    numeric=select_numeric(rows,mode)
    X=matrix(rows,numeric)
    y=np.array([label_from_row(r) for r in rows],dtype=int)
    builders=[(r.get("src_tool_or_builder") or "").strip() for r in rows]
    ai_builders=sorted({builders[i] for i in range(len(rows)) if y[i]==1 and builders[i]})
    outputs=[]
    for builder in ai_builders:
        ai_test=[i for i in range(len(rows)) if y[i]==1 and builders[i]==builder]
        if len(ai_test)<min_builder:
            continue
        human_idx=[i for i in range(len(rows)) if y[i]==0]
        if len(human_idx)<4:
            continue
        human_groups=np.array([
            rows[i].get("src_url_group") or rows[i].get("hostname") or f"h-{i}"
            for i in human_idx
        ])
        dummy=np.zeros(len(human_idx))
        gs=GroupShuffleSplit(n_splits=1,test_size=human_test_fraction,random_state=seed)
        htr_rel,hte_rel=next(gs.split(dummy,dummy,human_groups))
        human_train=[human_idx[i] for i in htr_rel]
        human_test=[human_idx[i] for i in hte_rel]
        other_ai=[i for i in range(len(rows)) if y[i]==1 and builders[i]!=builder]
        train=np.array(other_ai+human_train,dtype=int)
        test=np.array(ai_test+human_test,dtype=int)
        if len(set(y[train]))<2 or len(set(y[test]))<2:
            continue
        pipe=model();pipe.fit(X[train],y[train])
        prob=pipe.predict_proba(X[test])[:,1]
        m=metrics(y[test],prob)
        m.update({
            "held_out_builder":builder,
            "held_out_ai_count":len(ai_test),
            "human_test_count":len(human_test),
            "n_train":len(train),
            "feature_count":len(numeric),
        })
        outputs.append(m)
    return outputs

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("features_csv")
    ap.add_argument("--output-json",required=True)
    ap.add_argument("--test-size",type=float,default=0.30)
    ap.add_argument("--seed",type=int,default=42)
    ap.add_argument("--min-builder",type=int,default=5)
    ap.add_argument("--repeats",type=int,default=50)
    args=ap.parse_args()

    with open(args.features_csv,encoding="utf-8-sig",newline="") as f:
        raw=list(csv.DictReader(f))
    rows=[r for r in raw if str(r.get("scan_ok","")).lower() in ("1","true")]
    rows=[r for r in rows if label_from_row(r) is not None]
    if len(rows)<20:
        raise SystemExit(f"Need >=20 successful labeled scans; found {len(rows)}")

    report={
        "n_successful_labeled":len(rows),
        "class_counts":{
            "ai":sum(label_from_row(r)==1 for r in rows),
            "human":sum(label_from_row(r)==0 for r in rows),
        },
        "grouped_split":{},
        "repeated_grouped_split":{},
        "leave_one_builder_out":{},
        "interpretation":{
            "full":"Best deploy-time detector including direct builder artifacts.",
            "portable":"Tests whether the model generalizes without direct builder/hosting/header fingerprints.",
            "structure":"Stress test using mostly structural/asset/SEO features without tech/framework flags.",
        },
        "warning":"Pilot diagnostics only; do not claim production accuracy before a frozen grouped blind holdout.",
    }
    for mode in ("full","portable","structure"):
        report["grouped_split"][mode]=grouped_split_eval(rows,mode,args.test_size,args.seed)
        report["repeated_grouped_split"][mode]=repeated_grouped_split_eval(
            rows,mode,args.test_size,args.seed,args.repeats
        )
        report["leave_one_builder_out"][mode]=builder_holdout(
            rows,mode,args.min_builder,args.seed,args.test_size
        )
    Path(args.output_json).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2))

if __name__=="__main__":
    main()
