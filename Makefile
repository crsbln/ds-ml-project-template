# Shortcuts for macOS / Linux. On Windows, run the commands in README.md directly.

.PHONY: setup data train train-fast check slides pdf test lint

setup:          ## install Python 3.13, packages and the deck builder
	uv sync
	cd presentations/build && npm install

data:           ## download the Kaggle dataset into data/
	uv run kickstarter-download

train:          ## full run: clean, compare models, train, evaluate (a few minutes)
	uv run kickstarter-train

train-fast:     ## skip model comparison, time check and importance
	uv run kickstarter-train --fast

check:          ## score the example campaign
	uv run kickstarter-check --category "Tabletop Games" --goal 10000 --days 30 --launch 2026-03-03 --name "Dungeon Delvers: A Cooperative Game"

slides:         ## rebuild both PowerPoint decks from reports/results.json
	cd presentations/build && npm run build

pdf: slides     ## also export both decks to PDF (needs LibreOffice)
	cd presentations/client && soffice --headless --convert-to pdf *.pptx
	cd presentations/technical && soffice --headless --convert-to pdf *.pptx

test:           ## tests run on synthetic data, no download needed
	uv run pytest

lint:
	uv run ruff check src tests notebooks
