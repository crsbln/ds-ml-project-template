"""Download the Kaggle dataset into data/ (kagglehub, no login for public data)."""

import shutil
import sys
from pathlib import Path

from kickstarter import paths

DATASET = "kemical/kickstarter-projects"
MANUAL = (
    "Download it by hand instead:\n"
    "  1. Open https://www.kaggle.com/datasets/kemical/kickstarter-projects\n"
    "  2. Click Download and unzip\n"
    f"  3. Put ks-projects-201801.csv into {paths.DATA_DIR}"
)


def main():
    if paths.RAW_DATA.exists():
        print(f"Already there: {paths.RAW_DATA}")
        return
    try:
        import kagglehub

        folder = Path(kagglehub.dataset_download(DATASET))
    except Exception as error:  # network, proxy or Kaggle errors
        sys.exit(f"Automatic download failed ({error}).\n{MANUAL}")

    source = folder / paths.RAW_DATA.name
    if not source.exists():
        sys.exit(f"{paths.RAW_DATA.name} not found in {folder}.\n{MANUAL}")
    paths.DATA_DIR.mkdir(exist_ok=True)
    shutil.copy(source, paths.RAW_DATA)
    print(f"Saved {paths.RAW_DATA}")


if __name__ == "__main__":
    main()
