"""Project folders, resolved from the repository root so commands work from anywhere."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"

RAW_DATA = DATA_DIR / "ks-projects-201801.csv"
MODEL_FILE = MODELS_DIR / "kickstarter_success_model.joblib"
RESULTS_FILE = REPORTS_DIR / "results.json"
