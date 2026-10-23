"""The final model: tuned Gradient Boosting plus an F1-optimal yes/no threshold."""

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, TunedThresholdClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder

from kickstarter.data import CATEGORICAL_FEATURES, NUMERICAL_FEATURES

RANDOM_STATE = 42

# Best settings from RandomizedSearchCV in the notebook (20 combinations, 5-fold CV)
TUNED_PARAMS = {
    "learning_rate": 0.05,
    "max_iter": 400,
    "max_leaf_nodes": 31,
    "min_samples_leaf": 100,
    "l2_regularization": 1.0,
}

# Chance bands relative to the 36% average success rate
BANDS = [
    (0.25, "below average"),
    (0.50, "about average"),
    (1.01, "above average"),
]


def cv_splitter() -> StratifiedKFold:
    return StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)


def tree_preprocessor() -> ColumnTransformer:
    """Integer-encode categories (unknown = -1) and pass numbers through."""
    encoder = OrdinalEncoder(
        handle_unknown="use_encoded_value", unknown_value=-1, encoded_missing_value=-1
    )
    return ColumnTransformer(
        [
            ("categorical", encoder, CATEGORICAL_FEATURES),
            ("numerical", "passthrough", NUMERICAL_FEATURES),
        ]
    )


def gradient_boosting(**params) -> Pipeline:
    categorical_mask = [True] * len(CATEGORICAL_FEATURES) + [False] * len(
        NUMERICAL_FEATURES
    )
    model = HistGradientBoostingClassifier(
        categorical_features=categorical_mask, random_state=RANDOM_STATE, **params
    )
    return Pipeline([("preprocess", tree_preprocessor()), ("model", model)])


def build_model() -> TunedThresholdClassifierCV:
    """Tuned Gradient Boosting wrapped with a cross-validated F1 threshold."""
    return TunedThresholdClassifierCV(
        gradient_boosting(**TUNED_PARAMS), scoring="f1", cv=cv_splitter(), n_jobs=-1
    )


def chance_band(probability: float) -> str:
    for upper, label in BANDS:
        if probability < upper:
            return label
    return BANDS[-1][1]
