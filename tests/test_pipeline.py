import json
from datetime import date

import pandas as pd

from kickstarter import check, paths, train
from kickstarter.data import (
    FEATURES,
    LEAKAGE_COLUMNS,
    clean,
    load_raw,
    project_features,
)
from kickstarter.model import chance_band


def test_clean_handles_edge_cases(raw_csv):
    projects, steps = clean(load_raw(raw_csv))

    assert steps["invalid_launch_dropped"] == 1
    assert not set(LEAKAGE_COLUMNS) & set(projects.columns)
    assert (projects["country"] != 'N,0"').all()
    assert not projects["name"].str.contains("(Canceled)", regex=False).any()
    assert projects["success"].isin([0, 1]).all()
    assert projects[FEATURES].notna().all().all()


def test_project_features_match_training_columns():
    row = project_features(
        "Tabletop Games", 10_000, 30, "US", date(2026, 3, 3), "A b c"
    )
    assert list(row.columns) == FEATURES
    assert row.loc[0, "launch_weekday"] == 1  # Tuesday
    assert row.loc[0, "name_words"] == 3


def test_chance_bands():
    assert chance_band(0.10) == "below average"
    assert chance_band(0.36) == "about average"
    assert chance_band(0.51) == "above average"


def test_train_writes_every_section_the_decks_read(raw_csv, tmp_path):
    model_out, results_out = tmp_path / "model.joblib", tmp_path / "results.json"
    train.main(
        [
            "--data",
            str(raw_csv),
            "--model-out",
            str(model_out),
            "--results-out",
            str(results_out),
        ]
    )
    fresh = json.loads(results_out.read_text())
    shipped = json.loads(paths.RESULTS_FILE.read_text())

    def keys(node, prefix=""):
        if isinstance(node, dict):
            return {
                k for key, value in node.items() for k in keys(value, f"{prefix}.{key}")
            } | {prefix}
        if isinstance(node, list) and node and isinstance(node[0], dict):
            return keys(node[0], f"{prefix}[]")
        return {prefix}

    ignore = {".meta.note", ".tuning.best_log_loss"}
    assert keys(shipped) - ignore <= keys(fresh)
    assert 0.5 < fresh["final"]["test"]["roc_auc"] <= 1


def test_launch_check_cli(capsys):
    check.main(
        [
            "--category",
            "tabletop games",
            "--goal",
            "10000",
            "--days",
            "30",
            "--launch",
            "2026-03-03",
            "--name",
            "x" * 35,
        ]
    )
    out = capsys.readouterr().out
    assert "Chance of funding" in out and "%" in out


def test_saved_model_reproduces_notebook_example():
    import joblib

    model = joblib.load(paths.MODEL_FILE)
    row = pd.DataFrame({key: [value] for key, value in train.EXAMPLE.items()})
    assert round(model.predict_proba(row)[0, 1], 3) == 0.511
