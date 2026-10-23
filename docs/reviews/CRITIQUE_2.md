# Project Critique (Round 2): Kickstarter Success Prediction

- **Reviewer:** independent senior data science review
- **Date:** 2026-10-19
- **Scope (files reviewed):** `01_assignment.md`, `04_kickstarter_eda_and_modeling.ipynb` (all 87 cells with their saved outputs, execution counts 1–38 in order), `kickstarter_success_presentation.pdf` (12 slides, text extracted with `pdftotext`), `SUMMARY.md` (including the fix log in section 11), `README.md`, `pyproject.toml`, `uv.lock` (project name only), `.gitignore`, the tracked file list (`git ls-files`), the last commit (`git show --stat HEAD`), `models/kickstarter_success_model.joblib`, and the first-round review `CRITIQUE.md`. Not reviewed: `03_eda-and-modeling.ipynb`, `OZET.md`, `ELESTIRI.md`.
- **Method:** I re-implemented the notebook's cleaning and feature steps in read-only scripts in a scratch folder outside the repository and ran them against `data/ks-projects-201801.csv` with the project's `.venv` (Python 3.13, pandas 3, scikit-learn 1.9.0). I loaded the saved model and re-scored the exact same test split (`random_state=42`). Extra checks: a 10-bin calibration table; calibration by launch year and by subgroup; the model's precision and recall at the same label share as the baseline; the predictive value of the "low" band; "what-if" predictions for the Launch Check example on slide 10 (varying duration, goal, weekday and name length); the partial dependence of duration on a fine grid; success rates for every exact campaign length; residual name leakage after the new tag cleaning; the `N,0"` record statistics; a Random Forest with one-hot instead of ordinal categories (3-fold CV on a 100k training sample); and `ruff check --no-cache`. No model was refitted except the small Random Forest check. No repository file other than this one and its Turkish translation was created or changed.

## Executive summary

The revision is a substantial and genuine improvement. The model now produces well-calibrated probabilities (I reproduced test ROC-AUC 0.754, Brier score 0.189 and a near-perfect 10-bin calibration table), the time-based check is in place, the leakage fixes hold, and almost every first-round finding is resolved: 13 of 16 are resolved, 3 partly, none unresolved. The metrics and calibration in the notebook can be trusted for the 2009–2017 data. The main remaining risk sits in the stakeholder material. The "Launch Check" data product invites creators to "try a different goal or length", but for the slide's own example the model jumps from 51% to 72% if the campaign is 29 instead of 30 days, and from 51% to 38% if it starts on a Sunday instead of a Monday. These are associations with creator behaviour, not levers, so the product as pitched would give confident causal-looking advice that the data does not support. The closing slide also still says "short campaign", the advice the first review showed to be wrong. Several smaller statements in the notebook and slides do not match the outputs. Fix these before the presentation; the modelling itself does not need to change.

## Status of the first-round findings

`CRITIQUE.md` said it contained "4 Major, 8 Minor and 5 Nit" findings, but it lists only 7 Minor findings, so there are 16 findings in total. `SUMMARY.md` §11 counts them correctly.

| Finding (as titled in CRITIQUE.md) | Severity then | Status now | Justification |
|---|---|---|---|
| The "success score" is inflated by class weighting; the Launch Check slide overstates the chances | Major | RESOLVED | `class_weight` removed; I verified mean prediction 0.360 vs actual 0.360 and calibrated bins (0.35 → 0.35, 0.65 → 0.65); calibration plot and Brier score added; slide 10 shows "about 51%". (The band wording is a new, smaller issue, see Minor below.) |
| F1 at one threshold is a poor operating point for the stated stakeholder | Major | PARTLY RESOLVED | The probability and chance bands are now the main output, and base rates are shown. But slides 7–8 still present the F1 label ("promising", "unlikely"), which the Launch Check product does not show, and slide 7 compares recall at different label shares (see Minor below). |
| "Keep the campaign short" is confounded by goal size and not supported by the data | Major | PARTLY RESOLVED | The goal-stratified table, partial dependence and rewritten slides 6 and 9 are good. But the closing slide 12 still says "Small goal, short campaign", and the Launch Check invites what-if changes to duration that the model answers with artifacts (see Major below). |
| Random split only: "generalises reliably to new projects" is not tested, and `launch_year` is extrapolated | Major | RESOLVED | Time-based hold-out added (train before 2016, test 2016+: AUC 0.757, recall 0.749), `launch_year` dropped, the claim softened and retraining recommended. |
| A second name leak, "(Suspended)", is not removed | Minor | RESOLVED | Case-insensitive regex removes all 24,135 tags (all label 0); I found no truncated or partial tags left. |
| Cross validation scores are mixed with test scores; tuning gains are within noise | Minor | RESOLVED | Baseline scored with the same CV folds, mean ± std reported, separate test table, tuning described as "no meaningful difference". |
| Error analysis and feature importance describe a different model than the one shipped | Minor | RESOLVED | Error analysis, permutation importance (ROC-AUC, with std) and partial dependence all use `final_model`; `main_category` dropped. |
| Some numbers in the markdown have no code behind them; small inconsistencies | Minor | PARTLY RESOLVED | Category and month tables are now printed and the threshold wording is aligned. But new unsupported or wrong statements appeared (tabletop "51% matches", "all below the overall 0.754"), the SUMMARY milestone names still differ from the assignment, and slide 4 still says "2009–2017". |
| Slide 7 "+19% better" and "83% reliable" can be misread | Minor | RESOLVED | Slides now use counts out of 100 with base rates ("50 vs 45 vs 36", "84 vs 64"). |
| Edge cases in the target and the goal are not discussed | Minor | RESOLVED | 698 canceled-but-reached-goal projects, tiny goals (49.2% vs 49.4% without them) and relaunches are documented with code. |
| Repository and README do not describe this project; dependencies are incomplete | Minor | RESOLVED | New project README, `pyproject.toml` renamed and corrected (`plotly` gone from `uv.lock`), scikit-learn version printed and noted, data path check with a clear error. |
| PEP 8 line length; the ruff claim overstates what was checked | Nit | RESOLVED | `ruff check --select E,F,W,I --line-length 88` passes and `ruff format --check` passes; SUMMARY states the 88-character convention openly. |
| Goal bin labels are off by the edge value | Nit | RESOLVED | Labels are now "up to 1k" with a comment on right-closed bins. |
| Gradient boosting on dense one-hot columns, with scaling for trees | Nit | RESOLVED | Native categorical support in `HistGradientBoostingClassifier`, numeric columns passed through for trees. (The Random Forest now gets ordinal codes, see Nit below.) |
| The 'N,0"' rows are corrupted records, not only a bad country code | Nit | RESOLVED | Explained in the notebook; I verified 3,797 raw rows = the 3,797 missing `usd pledged`, 3,562 undefined, 234 kept, funded 44.9% ("45%" is correct). |
| Using a 50k sample for model selection is probably unnecessary | Nit | RESOLVED | Comparison and tuning now run on the full training set (297,834 projects). |

**Totals:** 13 RESOLVED, 3 PARTLY RESOLVED, 0 NOT RESOLVED.

## New and remaining findings

No finding is rated Critical: I found nothing that invalidates the reported test metrics. There are **2 Major, 6 Minor and 2 Nit** findings (10 in total).

### [Major] The Launch Check "what-if" turns correlations into confident, misleading advice

- **Where:** Slide 10 "Launch Check" ("Try a different goal or length to see how it changes"); slide 11 "Explain each prediction: show creators which of their choices raise or lower their chance"; notebook "Feature Importance and Direction" and "Save the Model and Score a New Project"; slide 6
- **Status:** VERIFIED
- **Problem:** The data product invites creators to change their inputs and watch the chance move. The model has learned strong associations with features that describe *how a creator behaves*, not what drives funding. The clearest case: campaigns with a round-number length (15, 20, 25, 30, 35, 40, 45, 60 days) are funded much less often than their neighbours. This is very likely a marker of less careful planning (or of choosing "N days" instead of a specific end date), not a cause. Changing 30 to 29 days will not make a campaign 21 points more likely to succeed, but the tool would say so.
- **Why it matters:** This is the one slide that shows how the predictions would be used. As pitched, it would tell a real creator to shorten their campaign by a day, launch on a Monday or add words to the name, with precise-looking numbers. That is exactly the causal misreading the notebook itself warns against ("not proof that changing them causes success").
- **Evidence:** Saved model, slide 10 example (Tabletop Games, US, 10,000 USD, Tuesday in March, 6-word name):

  | Change | Predicted chance |
  |---|---|
  | as on the slide (30 days) | 51% |
  | 29 days / 31 days | 72% / 62% |
  | 35 / 40 / 45 days | 59% / 52% / 42% |
  | 60 days | 28% |
  | launched on Sunday instead (weekday 6) | 38% |
  | 2-word name instead of 6 words | 43% |

  Raw success rate by exact length (all 372,293 projects): 14 d 50.6%, **15 d 41.8%**, 16 d 57.3%; 19 d 55.2%, **20 d 40.6%**, 21 d 54.1%; 24 d 53.5%, **25 d 44.2%**, 26 d 52.1%; 29 d 45.9%, **30 d 31.9%**, 31 d 49.5%; 34 d 49.1%, **35 d 39.0%**, 36 d 48.0%; 39 d 43.4%, **40 d 33.5%**, 41 d 44.9%; 44 d 41.5%, **45 d 28.7%**, 46 d 43.7%. The partial dependence on a 1-day grid shows the same dips at 15, 20, 25, 30, 35, 40, 45 and 60 days; the notebook takeaway mentions only 30 and 60. Weekday matters little on average (raw rates 33–38%) but moves this one prediction by 13 points through interactions.
- **How to fix:**
  1. Remove "Try a different goal or length to see how it changes" from slide 10, and reword the "Explain each prediction" item on slide 11 as "show which factors the estimate is based on (not what to change)".
  2. In the notebook, add the exact-length table (or zoom the partial dependence plot) and describe the pattern honestly: "round-number lengths do worse than their neighbours, which points to creator behaviour rather than to the length itself". Update slide 6 ("the 30-day default") accordingly; 45% of creators choose exactly 30 days, but "keep the default" is an assumption.
  3. If a what-if feature is ever built, limit it to the goal (the one input with a plausible mechanism, and add a monotonic constraint, `monotonic_cst`, so the curve cannot wiggle), and present it with an explicit "association, not effect" warning. For duration, either use coarse bins (for example "under 3 weeks / 3–6 weeks / over 6 weeks") plus a separate `is_round_length` flag that is not offered as a lever, or leave duration out of the what-if.

### [Major] The closing slide still recommends a "short campaign"

- **Where:** Slide 12 "Thank you" ("Small goal, short campaign, know your odds.")
- **Status:** VERIFIED
- **Problem:** The revision rewrote slides 6 and 9 to say that about three to six weeks does best and that very short campaigns do worse for goals above 1k USD. The final slide still carries the old slogan.
- **Why it matters:** The closing line is what the audience remembers, and it contradicts the deck's own recommendation and the data (for goals above 25k USD, 1–14 days: 7.3% funded vs 31–44 days: 26.1%). `SUMMARY.md` §11 says the finding was fully addressed. The fix takes a minute, but the impact on the message is material.
- **Evidence:** `pdftotext` output of slide 12; notebook cell "Campaign Duration" pivot table.
- **How to fix:** Replace it with, for example, "Realistic goal, deliberate length, know your odds." Re-export the PDF and update the §11 fix log.

### [Minor] "High chance" for 51% sends a mixed message; the "similar projects" figure is not computed

- **Where:** Slide 10; slide 8 ("62 / 100"); notebook "Are the Probabilities Trustworthy?" and "Save the Model and Score a New Project"; SUMMARY §7
- **Status:** VERIFIED
- **Problem:**
  - The bands are fixed at 25% and 50%, so a coin-flip project is called "High chance". Slide 10 shows "about 51% · High chance · About half of similar past projects were funded": the label and the sentence disagree. The example sits exactly on the band edge, so one day or a few dollars flips the label.
  - "Real tabletop games with similar goals in the data were funded about 51% of the time, which matches" has no code behind it (it comes from CRITIQUE.md). It ignores duration: tabletop games with a 7.5k–15k USD goal and a 30-day campaign were funded 43.3% of the time (n = 1,375; 44.5% in the test set, n = 292).
- **Why it matters:** The point of the revision was honest, calibrated chances. "High" invites over-confidence, and an unchecked "matches" claim weakens the calibration story.
- **How to fix:** Name the bands relative to the base rate ("below average / about average / above average", or "about 1 in 7 / 1 in 3 / 3 in 5"), or show only the number. Compute the similar-projects figure in the notebook with an explicit definition, for example `k.query("category == 'Tabletop Games' and 7500 <= usd_goal_real <= 15000 and duration_days == 30")["success"].mean()`, and quote that.

### [Minor] Slides 7–8 report the F1 label, which the product does not use; the recall comparison is not like for like

- **Where:** Slide 7 "Our model beats a simple rule of thumb"; slide 8 "84 / 100"; notebook "Final Model and Test Evaluation", "Error Analysis"
- **Status:** VERIFIED
- **Problem:**
  - The model labels 58.3% of test projects "promising", the baseline rule 49.9%. Comparing recall at different label shares flatters the model: labelling more projects always finds more successes.
  - "When it says 'unlikely', it is right 84 times in 100" refers to the label at threshold 0.30. The Launch Check shows bands, not this label, so the audience gets two different outputs.
- **Why it matters:** The model really is better, but the "81 vs 63" gap is partly an artefact of the threshold, and the deck mixes two output types.
- **Evidence:** At the baseline's label share (threshold 0.349) the model reaches precision 53.0% and recall 73.6% (baseline 45.1% / 62.5%, F1 0.616 vs 0.524). The "low" band (under 25%) is right 86.4% of the time (13.6% funded); the label is right 83.7%.
- **How to fix:** On slide 7, compare at the same share: "Picking the same number of projects as the rule, our model finds 74 of 100 funded projects (rule: 63), and 53 of 100 picks are funded (rule: 45)." On slide 8, quote the low band instead: "Projects in the low band were funded only 14 times in 100 (average: 36)." Keep the F1 table in the notebook for the technical audience.

### [Minor] The test set has been reused across review rounds, but the notebook says it was used once

- **Where:** Notebook "Final Model and Test Evaluation" ("The test set has not been used for any decision so far … We do not change the model after seeing them"); slide 7 footer ("evaluated once on a held-out test set"); SUMMARY §3
- **Status:** VERIFIED (the reuse); the effect on the numbers is SUSPECTED to be small
- **Problem:** The first review reported test-set results (calibration bins, recall, NPV), and the revision changed the model in response (class weights, `launch_year`, encoding, sample size). Strictly, the test set has now informed modelling decisions.
- **Why it matters:** The optimism is probably tiny, because the changes were principled and match the CV evidence (CV ROC-AUC 0.7517 vs test 0.754; CV Brier 0.1895 vs test 0.189). But "used once" is no longer literally true, and a technical reviewer will notice.
- **How to fix:** Reword to "the test set was used for the final evaluation and in one review round; the changes made afterwards were driven by cross-validation and calibration principles, and the CV and test scores agree". Note it in the decision log.

### [Minor] Calibration holds on the pooled years, not per year

- **Where:** Notebook "Are the Probabilities Trustworthy?", "Does the Model Hold Up Over Time?"; slide 7 ("the chance estimates are honest"); README
- **Status:** VERIFIED
- **Problem:** Without `launch_year`, the model is calibrated on average over 2009–2017 but not for any single year. A 2026 creator gets a chance that reflects the average of those years.
- **Evidence:** Random-split test set, mean predicted vs actual rate by launch year: 2013 0.399 vs 0.436, 2015 0.317 vs 0.279, 2017 0.357 vs 0.379. The time-based check shows the same drift (0.330 vs 0.350). The notebook mentions drift, but the slides call the estimates "honest" without a time qualifier.
- **How to fix:** Say "honest on average for 2009–2017 projects" on slide 7. Before any real use, recalibrate on the most recent year (for example `CalibratedClassifierCV(FrozenEstimator(model), method="isotonic")` fitted on 2017 data) and report its calibration on a later slice.

### [Minor] Several notebook statements do not match the outputs

- **Where:** Notebook "Error Analysis" (category takeaway), "Compare Models with Cross Validation" takeaway, "Campaign Duration" takeaway, "Feature Importance and Direction" takeaway, "Success Rate by Country" takeaway
- **Status:** VERIFIED
- **Problem:**
  - "All are below the overall 0.754" is wrong: Technology (0.804) and Games (0.789) are above it.
  - "The differences between models are at least 7 times larger than the standard deviation": for log loss, Logistic Regression vs Random Forest is 0.0061 against a std of 0.0010 (about 6 times). The conclusion stands, but the number is off. A paired comparison of fold differences would be the correct yardstick.
  - "very short campaigns (1-14 days) do clearly worse" is ambiguous: for 1k–5k USD goals, 1–14 days (45.7%) does better than the 30-day default (38.0%), only worse than 15–29 and 31–44 days.
  - The partial dependence takeaway names dips at 30 and 60 days only; the plot also dips at 15, 20, 25, 35, 40 and 45 days (see the Major finding).
  - "the 3,797 raw rows with `N,0"` are exactly the rows with a missing `usd pledged` value" is correct (I verified it) but no cell computes it.
- **Why it matters:** Each slip is small, but together they weaken trust in a notebook that is otherwise careful about evidence.
- **How to fix:** Correct the wording ("most categories are below the overall value; Technology and Games are above it", "about 6–20 times", "worse than 15–29 and 31–44 days"), describe all the dips, and add a one-line check for the `N,0"` claim before the leakage columns are dropped, for example `print(((kickstarter_raw["country"] == 'N,0"') == kickstarter_raw["usd pledged"].isna()).all())`.

### [Minor] SUMMARY and slides still have small inconsistencies; the fix log overstates completion

- **Where:** `SUMMARY.md` §3 and §11; slides 3 and 4
- **Status:** VERIFIED
- **Problem:**
  - The SUMMARY milestone names still differ from the assignment: SUMMARY has "Milestone 0 – Load and explore the data (EDA)", "Milestone 1 – Baseline", "Milestone 2 – Slide draft"; the assignment has M0 Data ingestion, M1 EDA, M2 Baseline, M3 Error analysis, M4 Final deliverables.
  - Slide 4's footer says "372,293 Kickstarter projects, 2009–2017", while slide 3 says "2009 to early 2018" (2 projects are from 2018).
  - §11 says "All were addressed", but slide 12 and the milestone names were not changed.
- **How to fix:** Rename the milestones to match `01_assignment.md`, use "2009 to early 2018" consistently, and make the fix log describe partial fixes honestly.

### [Nit] Random Forest gets ordinal category codes, which handicaps it

- **Where:** Notebook "Preprocessing Pipelines", "Compare Models with Cross Validation"
- **Status:** VERIFIED
- **Problem:** `OrdinalEncoder` turns the 159 categories into arbitrary integers. Gradient Boosting treats them as categories, but the Random Forest splits them as if they were ordered numbers.
- **Evidence:** 3-fold CV on a 100k training sample, same Random Forest settings: ordinal ROC-AUC 0.709 / 0.707 / 0.709, one-hot 0.728 / 0.722 / 0.729, which is level with Logistic Regression. Gradient Boosting (0.752) still wins, so the conclusion does not change.
- **How to fix:** Give the Random Forest the one-hot preprocessor (without scaling), or add one sentence saying it was run with ordinal codes and is therefore slightly disadvantaged.

### [Nit] The time-based check reuses hyperparameters tuned on all years

- **Where:** Notebook "Does the Model Hold Up Over Time?"
- **Status:** VERIFIED (setup); the effect is SUSPECTED to be negligible
- **Problem:** `search.best_estimator_` was tuned on the random training set, which includes 2016–2017 projects, and then reused for the model trained before 2016. Hyperparameter search and threshold tuning also share the same CV folds.
- **Why it matters:** Very little, since tuning changed the log loss by only 0.0003, but it is not a clean out-of-time test.
- **How to fix:** Add one sentence stating this, or use the default Gradient Boosting settings for the time-based model.

## What was done well

- The revision addressed the root causes, not just the symptoms: dropping class weights gave probabilities that are calibrated across the whole range (my 10-bin check: 0.055 → 0.053, 0.251 → 0.255, 0.549 → 0.547, 0.741 → 0.734), and within every main category and goal range (within about 1.5 percentage points).
- Model comparison now uses threshold-free metrics that fit the stakeholder question (ROC-AUC, log loss, Brier score), with fold standard deviations, on the full training set.
- The baseline is scored with the same CV folds, with the median learned inside each fold, which is careful and correct.
- The time-based check is clear and honestly interpreted (the ranking holds, recall and rates drift, retrain before use), and `launch_year` was dropped for a sound reason.
- The leakage work is thorough: case-insensitive tag removal (24,135 names, all label 0), no residual partial tags, and a clear explanation of the corrupted `N,0"` records.
- The goal-stratified duration table directly answers the confounding concern, and slides 6 and 9 now reflect it with "a correlation" stated on the slide.
- Every stakeholder number on slides 4–9 matches the notebook outputs, and base rates appear next to every headline figure.
- Reproducibility is good: the notebook ran top to bottom (execution counts 1–38), a data path check gives a clear error, the scikit-learn version is printed, `ruff` passes at 88 characters, there are no absolute paths in the notebook, and the README and `pyproject.toml` now describe this project.
- The decision log (D1–D16) and the fix log make the reasoning easy to follow and to review.

## Recommended fix order (with rough effort per step)

1. **Fix the closing slide** (Major: "short campaign"). Change one line and re-export the PDF. *About 5 minutes.*
2. **Reframe the Launch Check and the duration story** (Major: what-if). Remove the "try a different length" invitation, reword "Explain each prediction", add the exact-length table and the round-number finding to the notebook, and adjust slide 6. *About 1 hour.*
3. **Rename or drop the band labels and compute the "similar projects" figure** (Minor). *About 20 minutes.*
4. **Rework slides 7–8 around equal-share comparison and the low band** (Minor). *About 30 minutes.*
5. **Correct the notebook statements** (Minor: all-below-0.754, 7 times, 1–14 days, dips, `N,0"` check). *About 20 minutes plus a re-run.*
6. **Add time qualifiers to the calibration claims and the test-set reuse note** (two Minors). *About 15 minutes.*
7. **Align SUMMARY milestones, the year range and the fix log** (Minor). *About 15 minutes.*
8. **Nits:** one-hot for the Random Forest or a sentence about it; a sentence on the time-check hyperparameters. *About 15–30 minutes, optional.*

## Questions for the author

1. Is the Launch Check meant to give advice ("change X") or only an estimate ("your chance is about Y")? The answer decides whether a what-if feature belongs in it at all.
2. Did you notice that round-number lengths (20, 25, 35, 40, 45 days) dip like 30 days? How would you explain this to a creator?
3. Why were the bands set at 25% and 50%? Would bands relative to the 36% base rate be easier to read?
4. Would you be willing to recalibrate on the most recent year (2017) before showing a chance to a creator today?
5. Should the F1 label be kept in the saved model at all, given that the product shows bands?
