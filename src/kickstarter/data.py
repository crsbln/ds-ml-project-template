"""Load and clean the Kaggle Kickstarter data, and build pre-launch features.

The steps mirror notebooks/01_kickstarter_eda_and_modeling.ipynb, where each
decision is explained in detail.
"""

from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd

# Known only after the campaign ends, so they would leak the answer
LEAKAGE_COLUMNS = ["pledged", "usd pledged", "usd_pledged_real", "backers", "state"]

# 'N,0"' is a corrupted country code; every real country uses one currency
CURRENCY_TO_COUNTRY = {
    "USD": "US",
    "GBP": "GB",
    "AUD": "AU",
    "CAD": "CA",
    "DKK": "DK",
    "NOK": "NO",
    "SEK": "SE",
    "EUR": "EU",
}

# Kickstarter appends these tags to the name after a campaign is stopped (leakage)
STATUS_TAG = r"\s*\((?:canceled|suspended)\)"

CATEGORICAL_FEATURES = ["category", "country"]
NUMERICAL_FEATURES = [
    "log_goal",
    "duration_days",
    "launch_month",
    "launch_weekday",
    "name_length",
    "name_words",
]
FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES


def load_raw(path: Path) -> pd.DataFrame:
    """Read the raw Kaggle CSV (ks-projects-201801.csv)."""
    if not Path(path).exists():
        raise FileNotFoundError(
            f"{path} not found. Run `uv run kickstarter-download` or download "
            "ks-projects-201801.csv from "
            "https://www.kaggle.com/datasets/kemical/kickstarter-projects "
            "into the data/ folder."
        )
    return pd.read_csv(path)


def clean(raw: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Return the cleaned projects with features, plus row counts of each step."""
    steps = {"raw_rows": len(raw)}

    # Target: funded (1) or not funded for any reason (0); unknown outcomes dropped
    projects = raw[~raw["state"].isin(["live", "undefined"])].copy()
    projects["success"] = (projects["state"] == "successful").astype(int)
    steps["after_unknown_outcome_dropped"] = len(projects)
    steps["canceled_reached_goal"] = int(
        (
            (projects["state"] == "canceled")
            & (projects["usd_pledged_real"] >= projects["usd_goal_real"])
        ).sum()
    )
    projects = projects.drop(columns=LEAKAGE_COLUMNS)

    # launched has a time of day, deadline does not: compare calendar dates
    projects["launched"] = pd.to_datetime(projects["launched"])
    projects["deadline"] = pd.to_datetime(projects["deadline"])
    projects["duration_days"] = (
        projects["deadline"] - projects["launched"].dt.normalize()
    ).dt.days

    # A launch date in 1970 is a missing timestamp
    invalid_launch = projects["launched"].dt.year == 1970
    steps["invalid_launch_dropped"] = int(invalid_launch.sum())
    projects = projects[~invalid_launch].copy()
    steps["clean_rows"] = len(projects)

    invalid_country = projects["country"] == 'N,0"'
    steps["country_fixed"] = int(invalid_country.sum())
    projects.loc[invalid_country, "country"] = (
        projects.loc[invalid_country, "currency"]
        .map(CURRENCY_TO_COUNTRY)
        .fillna("Unknown")
    )

    has_tag = projects["name"].str.contains(
        STATUS_TAG, regex=True, case=False, na=False
    )
    steps["status_tags_removed"] = int(has_tag.sum())
    projects["name"] = (
        projects["name"]
        .str.replace(STATUS_TAG, "", regex=True, case=False)
        .str.strip()
        .fillna("")
    )

    projects["launch_year"] = projects["launched"].dt.year
    projects["launch_month"] = projects["launched"].dt.month
    projects["launch_weekday"] = projects["launched"].dt.dayofweek
    projects["log_goal"] = np.log1p(projects["usd_goal_real"])
    projects["name_length"] = projects["name"].str.len()
    projects["name_words"] = projects["name"].str.split().str.len()
    return projects, steps


def project_features(
    category: str,
    goal_usd: float,
    duration_days: int,
    country: str = "US",
    launch_date: date | None = None,
    name: str = "",
) -> pd.DataFrame:
    """Build the one-row model input for a planned campaign."""
    launch_date = launch_date or date.today()
    name = name.strip()
    return pd.DataFrame(
        {
            "category": [category],
            "country": [country],
            "log_goal": [np.log1p(goal_usd)],
            "duration_days": [duration_days],
            "launch_month": [launch_date.month],
            "launch_weekday": [launch_date.weekday()],
            "name_length": [len(name)],
            "name_words": [len(name.split())],
        }
    )
