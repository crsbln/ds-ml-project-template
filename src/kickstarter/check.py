"""Launch Check: estimate the chance that a planned Kickstarter campaign gets funded.

uv run kickstarter-check --category "Tabletop Games" --goal 10000 --days 30
"""

import argparse
import difflib
import sys
from datetime import date

import joblib

from kickstarter import paths
from kickstarter.data import project_features
from kickstarter.model import chance_band

AVERAGE_RATE = 0.36
BAR_WIDTH = 30


def known_values(model) -> tuple[list[str], list[str]]:
    encoder = model.estimator_.named_steps["preprocess"].named_transformers_[
        "categorical"
    ]
    categories, countries = encoder.categories_
    return list(categories), list(countries)


def check_known(value: str, known: list[str], what: str) -> str:
    """Return the matching known value (case-insensitive) or exit with suggestions."""
    by_lower = {item.lower(): item for item in known}
    if value.lower() in by_lower:
        return by_lower[value.lower()]
    words = [word.rstrip("s") for word in value.lower().split() if len(word) > 2]
    word_hits = [item for item in known if any(w in item.lower() for w in words)]
    close = difflib.get_close_matches(value, known, n=5, cutoff=0.5)
    suggestions = list(dict.fromkeys(word_hits + close))[:5]
    hint = f" Did you mean: {', '.join(suggestions)}?" if suggestions else ""
    sys.exit(f"Unknown {what} '{value}'.{hint} Use --list to see all options.")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--category", help='sub-category, e.g. "Tabletop Games"')
    parser.add_argument("--goal", type=float, help="funding goal in USD")
    parser.add_argument("--days", type=int, help="campaign length in days (1-92)")
    parser.add_argument("--country", default="US", help="two-letter code (default US)")
    parser.add_argument(
        "--launch",
        type=date.fromisoformat,
        help="launch date YYYY-MM-DD (default today)",
    )
    parser.add_argument("--name", default="", help="project title (optional)")
    parser.add_argument(
        "--list", action="store_true", help="list categories and countries"
    )
    args = parser.parse_args(argv)

    model = joblib.load(paths.MODEL_FILE)
    categories, countries = known_values(model)
    if args.list:
        print("Categories:\n  " + "\n  ".join(categories))
        print("Countries:\n  " + ", ".join(countries))
        return
    if args.category is None or args.goal is None or args.days is None:
        parser.error("--category, --goal and --days are required (or use --list)")
    if not 1 <= args.days <= 92:
        parser.error("--days must be between 1 and 92 (the range seen in the data)")
    if args.goal <= 0:
        parser.error("--goal must be above 0")

    category = check_known(args.category, categories, "category")
    country = check_known(args.country, countries, "country")
    features = project_features(
        category, args.goal, args.days, country, args.launch, args.name
    )
    probability = model.predict_proba(features)[0, 1]
    filled = round(probability * BAR_WIDTH)

    print()
    print("  KICKSTARTER LAUNCH CHECK")
    print(f"  {category} | {country} | goal ${args.goal:,.0f} | {args.days} days")
    print()
    bar = "#" * filled + "." * (BAR_WIDTH - filled)
    average = f"(average project: {AVERAGE_RATE:.0%})"
    print(f"  Chance of funding:  {probability:.0%}   {average}")
    print(f"  [{bar}]  {chance_band(probability).upper()}")
    print()
    print("  This is an estimate from 372,293 past projects (2009-2017),")
    print("  not a promise. It shows your starting odds, not what to change:")
    print("  small tweaks (one day more, another weekday) are not real levers.")
    print()


if __name__ == "__main__":
    main()
