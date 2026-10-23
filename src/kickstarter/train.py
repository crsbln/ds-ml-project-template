"""Train the final model and write every number the decks use to reports/results.json.

uv run kickstarter-train            # full run (a few minutes)
uv run kickstarter-train --fast     # skip model comparison, time check, importance
uv run kickstarter-train --tune     # also rerun the hyperparameter search (slow)
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    RandomizedSearchCV,
    TunedThresholdClassifierCV,
    cross_validate,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from kickstarter import paths
from kickstarter.data import (
    CATEGORICAL_FEATURES,
    FEATURES,
    NUMERICAL_FEATURES,
    clean,
    load_raw,
)
from kickstarter.model import (
    RANDOM_STATE,
    TUNED_PARAMS,
    build_model,
    chance_band,
    cv_splitter,
    gradient_boosting,
    tree_preprocessor,
)

GOAL_BINS = [0, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, float("inf")]
GOAL_LABELS = [
    "up to 1k",
    "1k-2.5k",
    "2.5k-5k",
    "5k-10k",
    "10k-25k",
    "25k-50k",
    "50k-100k",
    "over 100k",
]
GOAL_RANGE_BINS = [0, 1_000, 5_000, 25_000, float("inf")]
GOAL_RANGE_LABELS = ["up to 1k", "1k-5k", "5k-25k", "over 25k"]
DURATION_BINS = [0, 14, 29, 30, 44, 59, 60, 92]
DURATION_LABELS = ["1-14", "15-29", "30", "31-44", "45-59", "60", "61-92"]
ROUND_LENGTHS = [15, 20, 25, 30, 35, 40, 45, 60]

# The example project from the notebook: a US tabletop game, 10k USD, 30 days
EXAMPLE = {
    "category": "Tabletop Games",
    "country": "US",
    "log_goal": np.log1p(10_000),
    "duration_days": 30,
    "launch_month": 3,
    "launch_weekday": 1,
    "name_length": 35,
    "name_words": 6,
}


def r(value, digits=3):
    """Round for JSON; NaN becomes null."""
    if value is None or pd.isna(value):
        return None
    return round(float(value), digits)


def label_scores(y_true, y_pred) -> dict:
    return {
        "accuracy": r(accuracy_score(y_true, y_pred)),
        "precision": r(precision_score(y_true, y_pred, zero_division=0)),
        "recall": r(recall_score(y_true, y_pred)),
        "f1": r(f1_score(y_true, y_pred)),
        "share_labelled": r(np.mean(y_pred)),
    }


def safe_auc(y_true, proba):
    return roc_auc_score(y_true, proba) if len(set(y_true)) == 2 else np.nan


def eda_section(projects: pd.DataFrame) -> dict:
    by_category = (
        projects.groupby("main_category")
        .agg(
            rate=("success", "mean"),
            projects=("success", "size"),
            median_goal=("usd_goal_real", "median"),
        )
        .sort_values("rate", ascending=False)
    )
    goal_group = pd.cut(projects["usd_goal_real"], GOAL_BINS, labels=GOAL_LABELS)
    by_goal = projects.groupby(goal_group, observed=True)["success"].agg(
        ["mean", "size"]
    )
    duration_group = pd.cut(
        projects["duration_days"], DURATION_BINS, labels=DURATION_LABELS
    )
    by_duration = projects.groupby(duration_group, observed=True)["success"].agg(
        ["mean", "size"]
    )
    goal_range = pd.cut(
        projects["usd_goal_real"], GOAL_RANGE_BINS, labels=GOAL_RANGE_LABELS
    )
    duration_by_goal = projects.pivot_table(
        index=goal_range,
        columns=duration_group,
        values="success",
        aggfunc="mean",
        observed=True,
    )
    by_length = projects.groupby("duration_days")["success"].agg(["mean", "size"])
    by_year = (
        projects[projects["launch_year"] < 2018]
        .groupby("launch_year")["success"]
        .agg(["mean", "size"])
    )
    by_month = projects.groupby("launch_month")["success"].mean()
    by_country = (
        projects.groupby("country")["success"]
        .agg(["mean", "size"])
        .sort_values("size", ascending=False)
    )

    def length_rate(days):
        return r(by_length["mean"].get(days))

    return {
        "by_main_category": [
            {
                "name": name,
                "rate": r(row.rate),
                "projects": int(row.projects),
                "median_goal": r(row.median_goal, 0),
            }
            for name, row in by_category.iterrows()
        ],
        "by_goal": [
            {"name": str(name), "rate": r(row["mean"]), "projects": int(row["size"])}
            for name, row in by_goal.iterrows()
        ],
        "by_duration": [
            {"name": str(name), "rate": r(row["mean"]), "projects": int(row["size"])}
            for name, row in by_duration.iterrows()
        ],
        "duration_by_goal": {
            "columns": [str(c) for c in duration_by_goal.columns],
            "rows": [
                {"name": str(name), "rates": [r(v) for v in row]}
                for name, row in duration_by_goal.iterrows()
            ],
        },
        "round_lengths": [
            {
                "days": days,
                "before": length_rate(days - 1),
                "round": length_rate(days),
                "after": length_rate(days + 1),
                "projects": int(by_length["size"].get(days, 0)),
            }
            for days in ROUND_LENGTHS
        ],
        "by_year": [
            {"year": int(year), "rate": r(row["mean"]), "projects": int(row["size"])}
            for year, row in by_year.iterrows()
        ],
        "by_month": [
            {"month": int(month), "rate": r(rate)} for month, rate in by_month.items()
        ],
        "by_country": [
            {"name": name, "rate": r(row["mean"]), "projects": int(row["size"])}
            for name, row in by_country.head(10).iterrows()
        ],
    }


def compare_models(X_train, y_train) -> list[dict]:
    linear = ColumnTransformer(
        [
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
            ("numerical", StandardScaler(), NUMERICAL_FEATURES),
        ]
    )
    candidates = {
        "Logistic Regression": Pipeline(
            [("preprocess", linear), ("model", LogisticRegression(max_iter=1000))]
        ),
        "Random Forest": Pipeline(
            [
                ("preprocess", tree_preprocessor()),
                (
                    "model",
                    RandomForestClassifier(
                        n_estimators=100,
                        min_samples_leaf=20,
                        n_jobs=-1,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "Gradient Boosting": gradient_boosting(),
    }
    scoring = {
        "roc_auc": "roc_auc",
        "log_loss": "neg_log_loss",
        "brier": "neg_brier_score",
    }
    rows = []
    for name, pipeline in candidates.items():
        print(f"  cross-validating {name} ...")
        scores = cross_validate(
            pipeline, X_train, y_train, cv=cv_splitter(), scoring=scoring
        )
        row = {"name": name}
        for metric in scoring:
            values = scores[f"test_{metric}"]
            values = values if metric == "roc_auc" else -values
            row[metric] = r(values.mean(), 4)
            row[f"{metric}_std"] = r(values.std(), 4)
        rows.append(row)
    return rows


def tune(X_train, y_train) -> dict:
    search = RandomizedSearchCV(
        gradient_boosting(),
        {
            "model__learning_rate": [0.03, 0.05, 0.1, 0.2],
            "model__max_iter": [100, 200, 400],
            "model__max_leaf_nodes": [15, 31, 63],
            "model__min_samples_leaf": [20, 50, 100],
            "model__l2_regularization": [0.0, 0.1, 1.0],
        },
        n_iter=20,
        scoring="neg_log_loss",
        cv=cv_splitter(),
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    search.fit(X_train, y_train)
    return {
        "params": {
            key.removeprefix("model__"): value
            for key, value in search.best_params_.items()
        },
        "searched": True,
        "best_log_loss": r(-search.best_score_, 4),
    }


def group_scores(frame: pd.DataFrame, by) -> list[dict]:
    rows = []
    for name, group in frame.groupby(by, observed=True):
        rows.append(
            {
                "name": str(name),
                "projects": len(group),
                "actual": r(group["actual"].mean()),
                "predicted": r(group["probability"].mean()),
                "labelled": r(group["predicted"].mean()),
                "roc_auc": r(safe_auc(group["actual"], group["probability"])),
            }
        )
    return rows


def run(data_path: Path, fast: bool, retune: bool) -> tuple[dict, object]:
    print(f"Loading {data_path} ...")
    projects, steps = clean(load_raw(data_path))
    X, y = projects[FEATURES], projects["success"]

    results = {
        "meta": {
            "source": "kickstarter-train",
            "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            "scikit_learn": sklearn.__version__,
        },
        "data": steps
        | {
            "funded": int(y.sum()),
            "not_funded": int((1 - y).sum()),
            "success_rate": r(y.mean()),
            "first_year": int(projects["launch_year"].min()),
            "last_year": int(projects["launch_year"].max()),
            "n_categories": int(projects["category"].nunique()),
            "n_main_categories": int(projects["main_category"].nunique()),
        },
        "eda": eda_section(projects),
    }

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=RANDOM_STATE
    )

    # Baseline: success if the goal is below the training median
    baseline_folds = []
    for train_idx, valid_idx in cv_splitter().split(X_train, y_train):
        fold_median = X_train["log_goal"].iloc[train_idx].median()
        pred = (X_train["log_goal"].iloc[valid_idx] < fold_median).astype(int)
        baseline_folds.append(label_scores(y_train.iloc[valid_idx], pred))
    median_goal = X_train["log_goal"].median()
    y_test_baseline = (X_test["log_goal"] < median_goal).astype(int)
    results["baseline"] = {
        "median_goal_usd": r(np.expm1(median_goal), 0),
        "cv": {
            k: r(np.mean([f[k] for f in baseline_folds]))
            for k in ["accuracy", "precision", "recall", "f1"]
        }
        | {"f1_std": r(np.std([f["f1"] for f in baseline_folds], ddof=1))},
        "test": label_scores(y_test, y_test_baseline),
    }

    results["model_comparison"] = None if fast else compare_models(X_train, y_train)
    results["tuning"] = {"params": TUNED_PARAMS, "searched": False}
    if retune:
        print("  rerunning the hyperparameter search ...")
        results["tuning"] = tune(X_train, y_train)

    print("Fitting the final model ...")
    final_model = build_model()
    if retune:
        final_model = TunedThresholdClassifierCV(
            gradient_boosting(**results["tuning"]["params"]),
            scoring="f1",
            cv=cv_splitter(),
            n_jobs=-1,
        )
    final_model.fit(X_train, y_train)

    proba = final_model.predict_proba(X_test)[:, 1]
    pred = final_model.predict(X_test)
    tn = int(((y_test == 0) & (pred == 0)).sum())
    fn = int(((y_test == 1) & (pred == 0)).sum())
    results["final"] = {
        "threshold": r(final_model.best_threshold_),
        "cv_f1": r(final_model.best_score_),
        "train_rows": len(X_train),
        "test_rows": len(X_test),
        "test": label_scores(y_test, pred)
        | {
            "roc_auc": r(roc_auc_score(y_test, proba)),
            "brier": r(brier_score_loss(y_test, proba)),
            "npv": r(tn / (tn + fn)),
        },
    }

    # Same share as the baseline, for a like-for-like comparison
    equal_threshold = np.quantile(proba, 1 - y_test_baseline.mean())
    results["equal_share"] = {"threshold": r(equal_threshold)} | label_scores(
        y_test, (proba >= equal_threshold).astype(int)
    )

    calibration = (
        pd.DataFrame(
            {
                "bin": pd.cut(proba, np.linspace(0, 1, 11)),
                "predicted": proba,
                "actual": y_test.to_numpy(),
            }
        )
        .groupby("bin", observed=True)
        .agg(
            projects=("actual", "size"),
            predicted=("predicted", "mean"),
            actual=("actual", "mean"),
        )
    )
    results["calibration"] = {
        "mean_predicted": r(proba.mean()),
        "actual_rate": r(y_test.mean()),
        "bins": [
            {
                "predicted": r(row.predicted),
                "actual": r(row.actual),
                "projects": int(row.projects),
            }
            for _, row in calibration.iterrows()
        ],
    }
    bands = pd.Series([chance_band(p) for p in proba])
    results["bands"] = [
        {
            "name": band,
            "projects": int((bands == band).sum()),
            "share": r((bands == band).mean()),
            "actual": r(y_test.to_numpy()[(bands == band).to_numpy()].mean()),
        }
        for band in ["below average", "about average", "above average"]
    ]

    test_frame = X_test.assign(
        actual=y_test,
        probability=proba,
        predicted=pred,
        main_category=projects.loc[X_test.index, "main_category"],
        launch_year=projects.loc[X_test.index, "launch_year"],
    )
    results["calibration_by_year"] = [
        {
            "year": int(year),
            "projects": len(group),
            "predicted": r(group["probability"].mean()),
            "actual": r(group["actual"].mean()),
        }
        for year, group in test_frame.groupby("launch_year")
    ]
    results["by_category_test"] = sorted(
        group_scores(test_frame, "main_category"), key=lambda row: row["roc_auc"] or 0
    )
    results["by_goal_test"] = group_scores(
        test_frame,
        pd.cut(np.expm1(test_frame["log_goal"]), GOAL_BINS, labels=GOAL_LABELS),
    )

    results["time_split"] = None
    results["importance"] = None
    if not fast:
        print("Checking the model over time (train before 2016, test from 2016) ...")
        early = projects.loc[X.index, "launch_year"] < 2016
        temporal = clone(final_model).fit(X[early], y[early])
        late_proba = temporal.predict_proba(X[~early])[:, 1]
        results["time_split"] = {
            "train_rows": int(early.sum()),
            "test_rows": int((~early).sum()),
            "roc_auc": r(roc_auc_score(y[~early], late_proba)),
            "mean_predicted": r(late_proba.mean()),
            "actual_rate": r(y[~early].mean()),
        } | label_scores(y[~early], temporal.predict(X[~early]))

        print("Computing permutation importance ...")
        X_imp, _, y_imp, _ = train_test_split(
            X_test,
            y_test,
            train_size=min(20_000, len(X_test) - 2),
            stratify=y_test,
            random_state=RANDOM_STATE,
        )
        importance = permutation_importance(
            final_model.estimator_,
            X_imp,
            y_imp,
            scoring="roc_auc",
            n_repeats=5,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
        results["importance"] = sorted(
            [
                {"feature": name, "mean": r(mean, 4), "std": r(std, 4)}
                for name, mean, std in zip(
                    X_imp.columns,
                    importance.importances_mean,
                    importance.importances_std,
                )
            ],
            key=lambda row: -row["mean"],
        )

    example = pd.DataFrame({key: [value] for key, value in EXAMPLE.items()})
    what_if = pd.concat(
        [
            example.assign(duration_days=29),
            example.assign(duration_days=31),
            example.assign(launch_weekday=6),
        ],
        ignore_index=True,
    )
    probability = final_model.predict_proba(example)[0, 1]
    similar = projects.query(
        "category == 'Tabletop Games' and 7_500 <= usd_goal_real <= 15_000 "
        "and duration_days == 30"
    )
    results["example"] = {
        "category": EXAMPLE["category"],
        "country": EXAMPLE["country"],
        "goal_usd": 10_000,
        "duration_days": EXAMPLE["duration_days"],
        "probability": r(probability),
        "band": chance_band(probability),
        "similar_projects": len(similar),
        "similar_rate": r(similar["success"].mean()),
        "what_if": [
            {"label": label, "probability": r(p)}
            for label, p in zip(
                ["29 days", "31 days", "Sunday launch"],
                final_model.predict_proba(what_if)[:, 1],
            )
        ],
    }
    return results, final_model


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--data", type=Path, default=paths.RAW_DATA)
    parser.add_argument("--model-out", type=Path, default=paths.MODEL_FILE)
    parser.add_argument("--results-out", type=Path, default=paths.RESULTS_FILE)
    parser.add_argument(
        "--fast",
        action="store_true",
        help="skip model comparison, time check, importance",
    )
    parser.add_argument(
        "--tune", action="store_true", help="rerun the hyperparameter search"
    )
    args = parser.parse_args(argv)

    results, model = run(args.data, fast=args.fast, retune=args.tune)

    args.model_out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, args.model_out)
    args.results_out.parent.mkdir(parents=True, exist_ok=True)
    args.results_out.write_text(json.dumps(results, indent=2) + "\n")

    test = results["final"]["test"]
    print(
        f"\nDone. Test ROC-AUC {test['roc_auc']}, F1 {test['f1']} "
        f"(baseline F1 {results['baseline']['test']['f1']})."
    )
    print(f"Model:   {args.model_out}\nResults: {args.results_out}")
    print("Rebuild the decks with: make slides")


if __name__ == "__main__":
    main()
