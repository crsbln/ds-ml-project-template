# Project Critique (Round 3): Kickstarter Success Prediction

- **Reviewer:** independent senior data science review
- **Date:** 2026-10-21
- **Scope:** commit `a87f660` (working tree clean, nothing uncommitted at review time). `04_kickstarter_eda_and_modeling.ipynb` (102 cells, execution counts 1–45 in order, all outputs read), `kickstarter_success_presentation.pdf` (24 pages, text extracted with `pdftotext`, chart slides viewed as images), the slide sources and speaker notes in `slides/`, `slides/build_pdf.py`, `README.md`, `SUMMARY.md`, `OZET.md` (spot checks), `01_assignment.md`, `models/kickstarter_success_model.joblib`, `CRITIQUE_2.md`.
- **Method:** I rebuilt the cleaning and features in read-only scripts outside the repository, loaded the saved model and re-scored the same test split (`random_state=42`). Extra checks: calibration by exact campaign length; the round-number dips within each goal range; the same-share threshold computed on training data instead of test data; leftover cancellation words in names; the fitted model's number of boosting iterations. No repository file was changed except adding this file and its Turkish version.

## Verdict

The project is in good shape. I reproduced the headline numbers exactly (test ROC-AUC 0.7535, F1 0.619, Brier 0.189, threshold 0.299), and every number on the 24 slides that I checked matches a notebook output. All ten findings from CRITIQUE_2 have been addressed. I found **no Critical or Major issue**. There are **3 Minor findings**, all about slide wording that goes a little beyond the data, and **3 Nits**. Each Minor takes a few minutes to fix and is worth doing before Friday, because a reviewer could raise it during questions.

## Still open from CRITIQUE_2

The brief for this review said these findings were not yet fixed. That is out of date: commit `a87f660` addressed all of them. Status checked against the current files:

| CRITIQUE_2 finding | Status | Evidence |
|---|---|---|
| [Major] Launch Check what-if gives causal-looking advice | Resolved | Slide 20 says "not advice on what to change"; slide 22 says "which factors the estimate is based on (not what to change)"; notebook cells 99–101 show the 29/31-day and Sunday what-ifs and explain why there is no what-if |
| [Major] Closing slide says "short campaign" | Resolved | Slide 24: "Realistic goal, deliberate length, know your odds." |
| [Minor] "High chance" for 51%; "similar projects" figure not computed | Resolved | Bands renamed below/about/above average (cells 73–76); similar-projects check computed (cell 97: 1,375 projects, 43.3%) and shown on slide 21 |
| [Minor] Recall compared at different label shares; F1 label on slides | Resolved | Same-share comparison (cells 71–72, slide 14: 53 vs 45, 74 vs 63); slide 17 uses the below-average band (14 of 100) |
| [Minor] Test set reused, notebook says "used once" | Resolved | Honest note in cell 68 and slide 16; decision D17 |
| [Minor] Calibration holds on pooled years only | Resolved (wording); recalibration deliberately not done | Cells 80–82 (per year off by up to about 4 points); slide 14 says "honest on average for past projects" |
| [Minor] Notebook statements that do not match outputs | Resolved | Cells 8, 31, 61, 87, 93 corrected and checked against their outputs |
| [Minor] SUMMARY/slide inconsistencies, fix log overstates completion | Mostly resolved | Milestones match the assignment, year range fixed, fix log honest. The fix log now cites slide numbers from the old 12-slide deck (Nit below) |
| [Nit] Random Forest gets ordinal codes | Accepted, note added | Cells 57 and 61 |
| [Nit] Time check reuses tuned hyperparameters | Accepted, note added | Cell 77, slide 18 |

## New findings

### [Minor] "Round numbers like 30 and 60 days do worst" is true for small goals only

- **Where:** Slide 10 title and footer ("Same pattern for every goal size"); slide 19 ("Round numbers like 30 and 60 days did worst, even for the same goal"); slide 23; speaker notes for slides 10 and 19; `README.md` line 11; `SUMMARY.md` §7; notebook cell 1 (summary)
- **Status:** VERIFIED
- **Problem:** The chart on slide 10 uses goals of 1k–5k USD, where exactly 30 days (38%) and 60 days (26%) are the two weakest groups. For goals above 5k USD (about half of all projects), exactly 30 days is in the middle: 1–14 days and 61–92 days do as badly or worse. The footer then says "Same pattern for every goal size", which is not true for this ranking. "About 3–6 weeks did best" also fails for goals up to 1k USD, where 1–14 days does best.
- **Evidence:** Notebook cell 30 (success rate, goal range × length):

  | Goal | 1–14 | 15–29 | 30 | 31–44 | 45–59 | 60 | 61–92 | Rank of "30" (of 7) |
  |---|---|---|---|---|---|---|---|---|
  | up to 1k | **0.593** | 0.590 | 0.428 | 0.569 | 0.463 | 0.350 | 0.485 | 6th |
  | 1k–5k | 0.457 | 0.538 | 0.380 | 0.537 | 0.389 | 0.261 | 0.404 | 6th |
  | 5k–25k | 0.280 | 0.417 | 0.293 | 0.431 | 0.294 | 0.178 | 0.279 | 4th |
  | over 25k | 0.073 | 0.215 | 0.139 | 0.261 | 0.151 | 0.057 | 0.077 | 4th |

  What *does* hold for every goal size: 60 days is the weakest group, exactly 30 days is below both 15–29 and 31–44 days, and every round length (15, 20, …, 60) trails the day before and the day after. I checked the last point inside each of the four goal ranges and it holds in all 32 cases. The notebook text in cell 31 says this correctly; the slides make it stronger.
- **Why it matters:** This is one of the three findings in the talk, and it is repeated on the conclusion slide. A reviewer who looks at the technical note or the notebook pivot table will see that "do worst" holds only for goals up to 5k USD.
- **How to fix:** Change the slide 10 title to something the table supports for every goal size, for example "Round numbers like 30 and 60 days trail their neighbours". Change the footer to "30 days is below 15–29 and 31–44 days, and 60 days is lowest, for every goal size". Use the same wording on slides 19 and 23, in the speaker notes, in README and in SUMMARY/OZET §7. Optionally write "about 2–6 weeks" or drop "did best" for the shortest range.

### [Minor] "Creative projects beat product ideas" depends on which categories are shown

- **Where:** Slide 8 (title and chart of 8 of 15 main categories); speaker note for slide 8
- **Status:** VERIFIED
- **Problem:** The chart leaves out three creative categories that are below the 36% average: Publishing (31.4%), Photography (30.8%) and Crafts (24.2%). Crafts is lower than both Food (24.9%) and Fashion (24.8%), which are on the chart as examples of "product ideas". Games (35.8%) and Design (35.4%), the product-like categories, are close to the average.
- **Evidence:** Notebook cell 18, `category_stats`. Slide 9 (technical note) says "The slide shows 8 of the 15 groups", but the title states the general claim.
- **Why it matters:** A selected subset is used to support a general claim. In the Q&A, someone may ask "what about Crafts or Photography?". The notebook already uses Crafts as evidence that the category has an effect of its own (cell 23), so the slide hides the project's own counter-example.
- **How to fix:** Either show all 15 categories (they fit as a bar chart) or keep 8 and narrow the title, for example "Performing arts and comics do best, tech and food worst". If the creative-vs-product framing stays, add one line: "Not all creative work: Crafts 24%, Photography 31%".

### [Minor] The conclusion slide says "the goal matters most", while the model and slide 9 say the category does

- **Where:** Slide 23 ("The goal matters most …, then the category …, then the length"), and its speaker note; compare slide 9 ("Permutation importance: 0.108 ± 0.002, the most important input") and slide 7 ("0.091 ± 0.003, second only to the category")
- **Status:** VERIFIED
- **Problem:** The notebook's only ranking of the factors is permutation importance (cell 91): category 0.108, log_goal 0.091, duration 0.034. The conclusion gives the opposite order to the two technical notes in the same deck. The raw spreads give no clear winner either (goal 49% → 6%; category 62% → 20%).
- **Why it matters:** The conclusion is the summary slide people remember, and it contradicts the backup slides that will be shown if someone asks.
- **How to fix:** Write "The goal and the category matter most (…), then the length …", or follow the importance order. If the goal is meant as "strongest single pattern in the EDA", say that ("the clearest pattern is the goal"), which matches the speaker notes for slides 6 and 12.

### [Nit] The fix log cites slide numbers from the old 12-slide deck

- **Where:** `SUMMARY.md` §11 (lines 207–232) and `OZET.md` §11 (lines 206–232); file tables in `README.md` line 23 and `SUMMARY.md` §8
- **Status:** VERIFIED
- **Problem:** "slide 10", "slide 11", "Slide 12", "slides 7–8", "slides 6 and 9" refer to the old 12-slide deck. In the current 24-page PDF these are slides 20, 22, 24, 14 and 17, 10 and 19. The file tables list CRITIQUE/ELESTIRI but not CRITIQUE_2/ELESTIRI_2 (or this round).
- **How to fix:** Add "(slide numbers of the earlier 12-slide version)" to the fix-log intro, or update the numbers. Add the later review files to both file tables.

### [Nit] Name cleaning misses free-text cancellations and the spelling "(Cancelled)"

- **Where:** Notebook cell 46–47 ("we remove every such tag"); slide 4
- **Status:** VERIFIED; effect on the metrics SUSPECTED to be negligible
- **Problem:** The regex matches "(canceled)" with one "l" only. Four raw names contain "(Cancelled)", which is left in. Some creators also renamed the project after cancelling ("Canceled", "Project cancelled", "Cancelled.", "… CANCELLED!!!"). After cleaning, 126 names still contain a whole word cancel/canceled/cancelled/suspended, and 117 of them were not funded.
- **Why it matters:** The model only sees name length and word count, which have very small importance (0.008 and 0.002), so this cannot move the scores much. But the notebook says every tag is removed, and a reviewer may test it.
- **How to fix:** Use `r"\s*\((?:cancell?ed|suspended)\)"` and add one sentence: "about 120 names were renamed to a cancellation message by their creator; this is post-launch information, but the name features have very little weight". Dropping those rows is also fine.

### [Nit] Early stopping is on, so the model has 231 trees, not 400

- **Where:** Slide 15 ("max_iter=400"); notebook cells 63–66
- **Status:** VERIFIED
- **Problem:** `HistGradientBoostingClassifier` turns early stopping on by default (`early_stopping="auto"`) for more than 10,000 rows. The saved model stopped at `n_iter_ = 231`, and each fit kept 10% of its training data aside for this. The `max_iter` values in the search are therefore only upper limits.
- **How to fix:** Add one line in the tuning takeaway and on slide 15: "max_iter=400 is an upper limit; early stopping stopped at 231 iterations (10% of the training data used internally for this)".

## Checked and fine

- **Model reproduction:** the saved model gives ROC-AUC 0.7535, F1 0.6193, Brier 0.1889 on the same split, with threshold 0.2989 and the stated hyperparameters (scikit-learn 1.9.0).
- **Same-share threshold:** it is computed on test-set probabilities (cell 71). Computed on training data instead, the threshold is 0.3489 and gives the same 53.0% precision and 73.6% recall, so slide 14 is unaffected.
- **What-if numbers are real, not model artefacts:** the model is calibrated by exact length (for example 29 d 0.446 predicted vs 0.447 actual, 30 d 0.321 vs 0.319, 31 d 0.488 vs 0.488 on the test set), and past tabletop games with a 7.5k–15k USD goal and 29 days were funded 68.5% of the time (n = 124). This supports the deck's reading: the model reflects past creator behaviour accurately, and that behaviour is not a lever.
- **Slide numbers:** slides 2–24 match the notebook outputs (goal and category rates, the 1k–5k length row, baseline 45/63, same-share 53/74, bands 14/37/62, calibration bins, per-year calibration, time check, the Launch Check figures 0.511/0.717/0.621/0.383 and the 43% group).
- **Charts:** bars start at zero, the labels match the values, and the colour coding is explained in the footers.
- **Talk length:** the speaker notes for the 16 main slides come to about 1,200 words, which is about 8–9 minutes. That fits the 10-minute slot in `01_assignment.md`.
- **Leakage, split, CV, baseline, calibration and the time check:** no new problems beyond CRITIQUE_2.

## Recommended fix order

1. Slide 10 title and footer, slides 19 and 23, speaker notes, README and SUMMARY/OZET wording on round numbers (Minor). *About 15 minutes.*
2. Slide 8: show all 15 categories or narrow the title (Minor). *About 10 minutes.*
3. Slide 23: "goal and category matter most" (Minor). *About 2 minutes.*
4. Rebuild the PDF with `python3 slides/build_pdf.py`.
5. Nits: fix-log slide numbers and file tables, the "(Cancelled)" regex plus a sentence, the early-stopping line. *About 20 minutes plus a notebook re-run if the regex is changed. Optional before Friday.*
