"""A small synthetic file in the raw Kaggle format: tests run without real data."""

import numpy as np
import pandas as pd
import pytest

CATEGORIES = {
    "Tabletop Games": "Games",
    "Video Games": "Games",
    "Dance": "Dance",
    "Theater": "Theater",
    "Gadgets": "Technology",
    "Software": "Technology",
    "Indie Rock": "Music",
    "Fiction": "Publishing",
}
COUNTRIES = {"US": "USD", "GB": "GBP", "DE": "EUR", "CA": "CAD"}


def make_raw(n: int = 4_000, seed: int = 0) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    category = rng.choice(list(CATEGORIES), n)
    country = rng.choice(list(COUNTRIES), n, p=[0.7, 0.1, 0.1, 0.1])
    goal = np.round(np.exp(rng.normal(8.6, 1.5, n)), 2)
    launched = (
        pd.Timestamp("2009-05-01")
        + pd.to_timedelta(rng.integers(0, 3_100, n), unit="D")
        + pd.to_timedelta(rng.integers(0, 86_400, n), unit="s")
    )
    duration = rng.choice([15, 20, 29, 30, 31, 45, 60], n)
    deadline = launched.normalize() + pd.to_timedelta(duration, unit="D")

    easy = np.isin(category, ["Dance", "Theater", "Tabletop Games"])
    logit = 2.0 - 0.3 * np.log1p(goal) + 1.0 * easy - 0.4 * (duration == 30)
    funded = rng.random(n) < 1 / (1 + np.exp(-logit))
    state = np.where(funded, "successful", "failed").astype(object)
    other = rng.random(n)
    state[(~funded) & (other < 0.10)] = "canceled"
    state[other > 0.99] = "live"

    pledged = np.where(funded, goal * 1.2, goal * 0.3)
    frame = pd.DataFrame(
        {
            "ID": np.arange(n) + 1_000_000,
            "name": [f"Project number {i} for fans" for i in range(n)],
            "category": category,
            "main_category": [CATEGORIES[c] for c in category],
            "currency": [COUNTRIES[c] for c in country],
            "deadline": deadline.strftime("%Y-%m-%d"),
            "goal": goal,
            "launched": launched.strftime("%Y-%m-%d %H:%M:%S"),
            "pledged": pledged,
            "state": state,
            "backers": (pledged // 50).astype(int),
            "country": country,
            "usd pledged": pledged,
            "usd_pledged_real": pledged,
            "usd_goal_real": goal,
        }
    )
    # Edge cases the cleaning must handle
    frame.loc[0, "launched"] = "1970-01-01 01:00:00"
    frame.loc[1, ["country", "usd pledged"]] = ['N,0"', np.nan]
    frame.loc[2, ["name", "state"]] = ["Lost Album (Canceled)", "canceled"]
    frame.loc[3, "name"] = np.nan
    frame.loc[4, "state"] = "undefined"
    return frame


@pytest.fixture(scope="session")
def raw_csv(tmp_path_factory):
    path = tmp_path_factory.mktemp("data") / "ks-projects-201801.csv"
    make_raw().to_csv(path, index=False)
    return path
