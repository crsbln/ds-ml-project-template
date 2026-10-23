# Project Critique: Kickstarter Success Prediction

- **Reviewer:** independent senior data science review
- **Date:** 2026-10-19
- **Scope (files reviewed):** `01_assignment.md`, `04_kickstarter_eda_and_modeling.ipynb` (all 76 cells, code and saved outputs), `kickstarter_success_presentation.pdf` (12 slides, text extracted with `pdftotext`), `SUMMARY.md`, `README.md`, `pyproject.toml`, `.gitignore`, the tracked file list (`git ls-files`), `models/kickstarter_success_model.joblib`. `03_eda-and-modeling.ipynb` (course example) and `OZET.md` (Turkish copy of the summary) were not reviewed.
- **Method:** I re-implemented the notebook's cleaning and feature steps in read-only scripts outside the repository and ran them against `data/ks-projects-201801.csv` with the project's `.venv` (scikit-learn 1.9.0, pandas 3.0.3). I loaded the saved model and re-scored the exact same test split (`random_state=42`). Extra checks: residual leakage in project names, the target definition against pledged amounts, a temporal hold-out (train on launches before 2016, test on 2016 onwards), fold-to-fold variance of the cross validation scores, a calibration table of the saved model, an unweighted model for comparison, and a goal-stratified and adjusted analysis of campaign duration. No repository file other than this one was created or changed; the notebook was not re-run.

## Executive summary

This is a well-structured, honest and largely correct project. The target is sensible, the obvious leakage columns are removed, the hidden "(Canceled)" leak in names was found and fixed (I confirmed the fix works), the pipeline keeps preprocessing inside cross validation, and the test set is used once. I reproduced the headline test numbers exactly (F1 0.624, ROC-AUC 0.762, 83.6% correct "unlikely" warnings). The model's ranking quality also holds on a time-based hold-out (AUC 0.764). The problems are mainly in what the scores are used for and how they are communicated. (1) `class_weight="balanced"` adds no accuracy but inflates every score by about 11 percentage points. The "Launch Check" slide then shows "69 / 100", while comparable projects get funded only about 51–56% of the time. (2) The "keep the campaign short" recommendation is confounded by goal size and is not what the data supports: 31–44 day campaigns do as well as or better than short ones, and the real signal is "avoid the 30-day default and 60 days". (3) A single F1-tuned threshold labels 56% of all projects "promising" when only 36% are funded. That is a poor operating point for a creator who wants to know their chances. Read the model results as a fair ranking with modest power. The slide claims about scores and campaign length should be fixed before they go to stakeholders.

## Findings

No finding is rated Critical: I found nothing that invalidates the reported test metrics. There are 4 Major, 8 Minor and 5 Nit findings.

### [Major] The "success score" is inflated by class weighting; the Launch Check slide overstates the chances

- **Where:** Notebook "Save the Model and Predict a New Project" (cell 74–75); slide 10 "Launch Check"; slide 11 "Future work"; SUMMARY §7 "Limits"
- **Status:** VERIFIED
- **Problem:** The model uses `class_weight="balanced"`, which pushes predicted scores upwards. The slide shows a tabletop game scored at "69 / 100 · Promising". The notebook correctly says the scores are not calibrated, but the stakeholder slide shows the number with no caveat. Most viewers will read "69 / 100" as "69% chance".
- **Why it matters:** A creator would think their chances are much better than the data suggests. The class weighting also gains nothing: an unweighted model has the same ranking quality and is already well calibrated.
- **Evidence:** I re-scored the saved model on the 74,459 test projects:
  - The mean predicted score is 0.471, but the actual success rate is 0.360.
  - Projects scored 0.64–0.74 were actually funded 55.8% of the time (n = 10,437). For the 0.6–0.7 bin, the actual rate is 0.511.
  - In the training data, real tabletop games with a 7.5k–15k USD goal were funded 50.6% of the time (n = 3,420).
  - Calibration table (mean score → actual rate): 0.25 → 0.16, 0.45 → 0.31, 0.65 → 0.51, 0.75 → 0.63.
  - Brier score: 0.200 for the saved model. The same hyperparameters without `class_weight` reach a Brier score of 0.186, the same AUC (0.761) and the same best F1 (0.625, at threshold ≈ 0.31), with calibrated bins (0.25 → 0.25, 0.45 → 0.46, 0.65 → 0.65).
- **How to fix:**
  1. Drop `class_weight="balanced"`. With threshold tuning it is redundant: both shift the same decision boundary.
  2. Keep `TunedThresholdClassifierCV` for the yes/no label, and use `predict_proba` from the unweighted model as the displayed probability. If you keep weighting, wrap the model in `CalibratedClassifierCV(method="isotonic", cv=5)`.
  3. Add a calibration plot and the Brier score to the notebook: `CalibrationDisplay.from_predictions(y_test, proba, n_bins=10)`.
  4. On slide 10, show a calibrated probability ("about 51% of similar projects were funded") or remove the number. Move the calibration item on slide 11 from "Future work" to "done".

### [Major] F1 at one threshold is a poor operating point for the stated stakeholder

- **Where:** Notebook "Business Goal and Metric", "Tune the Decision Threshold", "Error Analysis"; slides 7–8; SUMMARY D6/D13
- **Status:** VERIFIED (numbers); the framing point is reasoned
- **Problem:** The stakeholder is a creator asking "what are my chances, and what can I change?". That question calls for a well-ranked, calibrated probability. A yes/no label tuned for F1 does not answer it. F1 ignores true negatives and rewards over-predicting the minority class. The tuned threshold therefore calls most projects "promising".
- **Why it matters:** "Promising" carries little information. On the test set 56.5% of projects get the label, compared with a 36% base rate. For goals up to 1k USD, 81.7% are labelled promising while 49.7% are funded. The notebook itself says the model "hardly distinguishes" projects within high-success categories. The 83% "risk warning" figure also needs context: always predicting "not funded" would already be right 64% of the time.
- **Evidence:** Saved model on the test set: TN 27,111, FP 20,557, FN 5,303, TP 21,488. The negative predictive value (how often "unlikely" is correct) is 83.6%, against a 64.0% base rate.
- **How to fix:** Make the calibrated probability the primary output, with ROC-AUC, Brier score or log loss as the main metrics. Keep F1 as a secondary metric for a label. If a label is needed, base the threshold on what each error costs the creator, or use three bands ("low / medium / high chance") taken from calibrated probabilities. When quoting the 83%, give the base rate next to it ("83% vs 64% if you always predicted failure").

### [Major] "Keep the campaign short" is confounded by goal size and not supported by the data

- **Where:** Notebook "Campaign Duration" takeaway and "Feature Importance" takeaway; slide 6 "Longer campaigns don't help"; slide 9 recommendation 2; SUMMARY §7 recommendations
- **Status:** VERIFIED
- **Problem:** Short campaigns mostly belong to small-goal projects: the median goal is 1,200 USD for 1–14 days, 3,500 USD for 15–29 days and 9,750 USD for 60 days. The raw bar chart therefore mixes the duration effect with the goal effect. The notebook adds a correlation caveat, but slide 9 still presents duration as a "decision you control" and says "Keep the campaign short". The feature importance section ends with "the three most influential decisions they control are...", which is causal language drawn from permutation importance.
- **Why it matters:** The advice is partly wrong. Within every goal band, 31–44 days does at least as well as campaigns under 30 days. The consistent pattern is that the exact 30-day default and 60 days do badly. A creator with a 30k USD goal who shortens the campaign to 20 days is acting against the evidence.
- **Evidence:** Success rate by goal band (rows) and duration (columns):

  | Goal | <30 d | 30 d | 31–44 d | 45–59 d |
  |---|---|---|---|---|
  | ≤1k | 0.591 | 0.428 | 0.569 | 0.463 |
  | 1k–5k | 0.524 | 0.380 | 0.537 | 0.389 |
  | 5k–25k | 0.402 | 0.293 | 0.431 | 0.294 |
  | >25k | 0.201 | 0.139 | 0.261 | 0.151 |

  For single exact durations with goals of 25k–50k USD: 20 days 9.6%, 30 days 18.1%, 45 days 20.7%. A logistic regression adjusted for log goal, main category and launch year gives these coefficients against the 30-day reference: <30 d +0.51, 31–44 d +0.58, 45–59 d −0.04, 60 d −0.68.
- **How to fix:** Replace the recommendation with something like: "Don't just accept the 30-day default, and avoid very long (60-day) campaigns. Projects that chose a non-default length of up to about six weeks did best. This is a correlation, possibly a sign of more careful planning." Add the stratified table above, or a partial dependence plot (`PartialDependenceDisplay`), to the notebook. Rephrase "decisions they control" as "the factors most associated with success". Make clear that lowering the goal raises the chance of success but also lowers the money raised.

### [Major] Random split only: "generalises reliably to new projects" is not tested, and `launch_year` is extrapolated

- **Where:** Notebook "Train-Test Split", "Final Model and Test Evaluation" takeaway, "Save the Model" example (`launch_year = 2017`); slide 7; SUMMARY D8
- **Status:** VERIFIED
- **Problem:** The notebook shows that success rates change a lot over time (46% in 2011, 28% in 2015, 37% in 2017) but splits the data at random. The product scores future campaigns, so a time-based hold-out is the honest test. `launch_year` is also a feature: any year after 2017 is treated exactly like 2017 by the trees, so the model cannot know the current base rate.
- **Why it matters:** The ranking holds up over time, but the operating point the slides quote does not. Recall falls from 80% to about 70%, so the slide's "finds 80% of successful projects" would not hold for new projects.
- **Evidence:** Same hyperparameters, threshold 0.439, trained on launches before 2016 and tested on 2016–2018 (n = 106,282): AUC 0.764, F1 0.611, precision 0.546, recall 0.695. A random split of the same size gives AUC 0.761, F1 0.627, precision 0.513, recall 0.805. With the saved model, the example project scores 0.694 for both `launch_year = 2017` and `launch_year = 2026`.
- **How to fix:** Add a temporal hold-out (for example train ≤ 2015, validate 2016, test 2017) and report it next to the random split. Tune the threshold, and ideally recalibrate, on the most recent period. Either drop `launch_year` (in my test, AUC dropped only from 0.764 to 0.758) or state clearly that the model assumes the 2017 environment. Soften "generalises reliably to new projects" to "is stable across random splits; on later years the ranking holds but recall drops to about 70%".

### [Minor] A second name leak, "(Suspended)", is not removed

- **Where:** Notebook "Clean Project Names"; SUMMARY §6
- **Status:** VERIFIED
- **Problem:** Kickstarter also adds " (Suspended)" to suspended projects. 1,046 names carry this tag, all of them suspended (label 0). They still feed `name_length` (+12 characters) and `name_words` (+1).
- **Why it matters:** It is a small leak (0.3% of rows) but the same kind of leak the author rightly removed for "(Canceled)". I also checked whether the "(Canceled)" removal leaves a trace. It does not: Kickstarter seems to add the tag only when it fits, so tagged names are short and untagged canceled names are long. After cleaning, the mean name length is 33.6 for canceled and 32.8 for failed projects, so that fix is sound.
- **Evidence:** Of 23,088 "(Canceled)" names, 23,085 are canceled and 3 suspended. All 1,046 "(Suspended)" names are suspended. No other suffix is specific to one state: "(Relaunch)", "(Short Film)" and similar tags appear across all outcomes.
- **How to fix:** `kickstarter["name"].str.replace(r"\s*\((Canceled|Suspended)\)\s*$", "", regex=True).str.strip()`, and update the markdown to mention both tags.

### [Minor] Cross validation scores are mixed with test scores; tuning gains are within noise

- **Where:** Notebook "Compare Models with Cross Validation" (cell 52 table), "Hyperparameter Tuning" takeaway, "Tune the Decision Threshold" table
- **Status:** VERIFIED
- **Problem:**
  - The comparison table adds the baseline's **test-set** score as a row next to **CV-on-sample** scores, and the step table in cell 59 lists it under a "CV F1" column.
  - Fold standard deviations are not reported.
  - The tuning gain (0.611 → 0.613) is smaller than one fold standard deviation, yet the takeaway explains it ("helps the model learn general patterns rather than noise").
  - The threshold was tuned with the same folds that chose the hyperparameters, so the CV F1 of 0.620 is slightly optimistic. The independent validation set gives 0.616.
- **Why it matters:** Readers cannot tell which differences are real. The tuning step looks more useful than it is.
- **Evidence:** My re-run of 5-fold CV on the same 50k sample: default gradient boosting F1 0.611 ± 0.004 (AUC 0.750 ± 0.004), tuned F1 0.613 ± 0.006 (AUC 0.752 ± 0.005), logistic regression F1 0.591 ± 0.004.
- **How to fix:** Report the mean ± standard deviation across folds. Score the baseline rule with the same CV (it is a one-line function) or put it in a separate table labelled "test". Rename the column to "F1 (source)". Say "tuning made no meaningful difference" and drop the interpretation of the chosen settings.

### [Minor] Error analysis and feature importance describe a different model than the one shipped

- **Where:** Notebook "Error Analysis", "Feature Importance"
- **Status:** VERIFIED (setup); the effect is SUSPECTED to be small
- **Problem:** The error analysis and permutation importance use `tuned_model`, trained on the 50k sample with threshold 0.431. The saved model is trained on 298k projects with threshold 0.439. Permutation importance is also measured as the change in F1 at a fixed threshold, which is noisy. It splits credit between correlated features (`category`/`main_category`, `name_length`/`name_words`), and it says nothing about the direction of an effect.
- **Why it matters:** The importance ranking is probably right, but it is reported more precisely than it is. Readers can also mistake importance for "what to change" (see the Major finding on campaign length).
- **How to fix:** Use a cross-validated out-of-fold prediction of the final configuration on the training set (`cross_val_predict`), or keep the sample model but say clearly that it is a stand-in. Compute permutation importance with `scoring="roc_auc"` or `neg_log_loss`, and report `importances_std`. Group correlated features (or drop `main_category`, which `category` already contains), and show direction with partial dependence plots.

### [Minor] Some numbers in the markdown have no code behind them; small inconsistencies

- **Where:** Notebook cells 17, 20 and 33 (takeaways), cells 59/72, summary cell 1; SUMMARY §3/§6
- **Status:** VERIFIED
- **Problem:**
  - Median goals by category ("Technology 20k, Dance/Theater about 3.3k, Crafts about 2.3k"), category sizes ("Dance about 3,700, Technology about 32,000") and monthly rates ("July 32%, March 38%") appear in the markdown but are not printed by any cell. I recomputed them and they are correct: 20,000 / 3,300 / 3,292 / 2,328 USD; 3,749 and 32,189 projects; 32.4% and 38.3%.
  - Cell 59 calls threshold 0.43 the final model, but the shipped model uses 0.439.
  - The data is described as "2009–2017", but the 2 projects from 2018 stay in the modelling data.
  - SUMMARY says "three data errors" while the table in §6 lists four rows.
  - SUMMARY's milestone names (for example "Milestone 1 – Baseline", "Milestone 2 – Slide draft") differ from the assignment's milestones (M1 EDA, M2 baseline, M3 error analysis).
- **Why it matters:** For a reproducible notebook, every number in the text should come from an output. The inconsistencies chip away at reader trust.
- **How to fix:** Add a small table cell, for example `kickstarter.groupby("main_category").agg(rate=("success", "mean"), n=("success", "size"), median_goal=("usd_goal_real", "median"))`, and print the monthly rates. Align the threshold wording, the year range and the milestone names.

### [Minor] Slide 7 "+19% better" and "83% reliable" can be misread

- **Where:** Slide 7 "Our model beats a simple rule of thumb"; slide 8 "Limits"; SUMMARY §7
- **Status:** VERIFIED
- **Problem:** "+19% better" is a relative improvement in F1 (0.624 / 0.524). A non-technical audience will read it as "19% more projects funded" or "19 points more accurate". "83% reliable" has no base rate next to it (see the Major finding on the operating point).
- **Why it matters:** These are the two numbers people will remember from the talk.
- **How to fix:** Use concrete counts instead, for example: "Of 100 projects it calls promising, 51 get funded (simple rule: 45; random pick: 36)", and "When it warns, it is right 84 times in 100 (guessing 'fail' every time: 64)."

### [Minor] Edge cases in the target and the goal are not discussed

- **Where:** Notebook "Target Decision", "Success Rate by Funding Goal"; SUMMARY D4
- **Status:** VERIFIED
- **Problem:**
  - 698 canceled projects had pledged at least their goal. These were canceled despite reaching the goal, often to relaunch, and are labelled "not funded".
  - 1,143 projects have goals of 10 USD or less (62.6% funded), and 38 have goals under 1 USD. These are tests or joke projects that make the "<1k: 49%" headline look better.
  - Relaunches of the same idea can appear in both train and test. I checked this: only 2.2% of test names also occur in train, and names are not used as text features, so the effect is negligible.
- **Why it matters:** The impact is limited, but the "set a realistic goal" message rests partly on trivial goals.
- **How to fix:** Mention these cases in the target section. Consider dropping goals below about 100 USD, or check that the headline does not change without them. Add a sentence on relaunches.

### [Minor] Repository and README do not describe this project; dependencies are incomplete

- **Where:** `README.md`, `pyproject.toml`, `models/`
- **Status:** VERIFIED
- **Problem:**
  - `README.md` is still the course template: it describes the coffee example and tells readers to open `03_eda-and-modeling.ipynb`.
  - `pyproject.toml` keeps the template name, lists `plotly` (unused), and does not declare the packages imported directly (`pandas`, `numpy`, `matplotlib`, `joblib`) or `ruff` (named as a tool in SUMMARY).
  - The committed `.joblib` model (2.1 MB) only loads reliably with the same scikit-learn version (1.9.0), which is not stated.
  - The notebook reads `data/...` with a relative path, so it only works when the working directory is the repository root.
- **Why it matters:** A visitor on GitHub lands on a README about coffee. Reproducibility depends on dependencies that are only installed indirectly.
- **How to fix:** Rewrite the README (project question, data download, how to run, results, links to the notebook, slides and SUMMARY). Run `uv add pandas numpy matplotlib joblib`, `uv remove plotly` and `uv add --dev ruff`, and rename the project. Note the scikit-learn version next to the saved model. Optionally use `Path(__file__)`-independent paths, such as a `DATA_DIR = Path("data")` constant with a clear error message if the file is missing.

### [Nit] PEP 8 line length; the ruff claim overstates what was checked

- **Where:** Notebook code cells; SUMMARY §3 and §4 ("style checked with ruff (PEP 8)")
- **Status:** VERIFIED
- **Problem:** 46 code lines are longer than 79 characters, and 18 are longer than 88 (up to 98). Ruff's default rule set does not include E501 (line length), so a default `ruff check` does not test this.
- **How to fix:** Run `ruff check --select E,W,F,I --line-length 88 04_kickstarter_eda_and_modeling.ipynb` and `ruff format`, and wrap the long `sns.barplot(...)` calls.

### [Nit] Goal bin labels are off by the edge value

- **Where:** Notebook "Success Rate by Funding Goal"; slide 4
- **Status:** VERIFIED
- **Problem:** `pd.cut` uses right-closed bins, so "<1k" is really "≤1k" and includes 12,959 projects with exactly 1,000 USD. The numbers barely change (49.4% vs 50.5% for strictly <1k).
- **How to fix:** Use `right=False` or labels such as "≤1k".

### [Nit] Gradient boosting on dense one-hot columns, with scaling for trees

- **Where:** Notebook "Preprocessing Pipeline", "Compare Models with Cross Validation"
- **Status:** VERIFIED (setup)
- **Problem:** The 204 dense one-hot columns are fed to `HistGradientBoostingClassifier`, and the numeric columns are scaled although trees do not need it. Native categorical support is simpler, faster, and splits categories more efficiently.
- **How to fix:** Use `OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)` plus `HistGradientBoostingClassifier(categorical_features="from_dtype")` (or a boolean mask), and pass numeric columns through unchanged for the tree models. Keep scaling for logistic regression.

### [Nit] The 'N,0"' rows are corrupted records, not only a bad country code

- **Where:** Notebook "Success Rate by Country"; SUMMARY D12
- **Status:** VERIFIED
- **Problem:** All 3,797 rows with a missing `usd pledged` are exactly the 'N,0"' rows, and 3,562 of them are "undefined". The 234 that remain after filtering are funded 50% of the time (vs 36% overall), which suggests a different scraping path. Inferring the country from the currency is still valid: in this data every currency except EUR maps to exactly one country.
- **How to fix:** Add one sentence describing this pattern. The fix itself is fine.

### [Nit] Using a 50k sample for model selection is probably unnecessary

- **Where:** Notebook "Compare Models with Cross Validation"; SUMMARY D10
- **Status:** SUSPECTED
- **Problem:** Gradient boosting on 298k rows trains in well under a minute per fit, and the final `TunedThresholdClassifierCV` already fits on the full training set. Hyperparameters such as `min_samples_leaf=100` were chosen on a dataset 6 times smaller than the one they are applied to.
- **How to fix:** Tune on the full training set (or at least 150k rows) with `HalvingRandomSearchCV`. Optionally keep the sample only for the slow Random Forest.

## What was done well

- A clear, testable question with a named stakeholder, and a target definition (canceled and suspended = not funded; live and undefined dropped) that is argued in a table.
- Systematic removal of leakage columns, and spotting the "(Canceled)" leak in names, which many people miss. I confirmed that the removal leaves no length trace.
- Correct cleaning steps: the 1970 epoch dates and the 'N,0"' countries are fixed with sound reasoning. The currency-to-country mapping is verified as valid.
- Good validation practice overall: a stratified hold-out, every transformer inside a `Pipeline`, stratified CV, a separate validation set for error analysis, and a test set used once. The notebook ran top to bottom in order (execution counts 1–32), and I reproduced the test metrics exactly from the saved model.
- A baseline that is meaningful and explained (the goal-median rule learned on train only), plus the trivial "always fail" rule to show why accuracy fails.
- Error analysis by segment that is honest about weaknesses ("hardly distinguishes ... within these categories", over-optimism for small goals), and a correlation caveat on the duration chart.
- Probabilities are flagged as uncalibrated in the notebook and SUMMARY, and the limits are stated on a slide.
- Clean, readable code with all imports at the top, and a plain-language SUMMARY with a decision log (D1–D15). The decision log is excellent practice.

## Recommended fix order

1. **Calibrate or stop showing raw scores on the slides** (Major: inflated score). Remove `class_weight`, refit, add a calibration plot and Brier score, and update slides 7, 8, 10 and 11. *About 1–2 hours, including a full refit.*
2. **Rewrite the campaign-length recommendation** (Major: confounded advice). Add the goal-stratified table or partial dependence plot, and update slides 6 and 9, the notebook takeaways and SUMMARY. *About 1 hour.*
3. **Rethink the operating point and metric wording** (Major: F1 operating point; Minor: slide 7 wording). Use calibrated probability bands, and give the base rate next to the 83% figure and the "+19%". *About 1 hour.*
4. **Add a temporal hold-out and soften the generalisation claim** (Major: random split). Decide what to do with `launch_year`. *About 1 hour.*
5. **Remove the "(Suspended)" tag** and re-run (Minor). *About 10 minutes plus re-run time.*
6. **Report CV standard deviations, separate CV and test tables, and fix the threshold, year and milestone wording** (Minor: score comparability; Minor: unsupported numbers). *About 30–45 minutes.*
7. **Feature importance with AUC or log loss, grouped features, and partial dependence plots** (Minor). *About 45 minutes.*
8. **README, `pyproject.toml` and ruff line length** (Minor: repository; Nit: PEP 8). *About 30 minutes.*
9. Remaining nits (bin labels, native categoricals, the 'N,0"' note, tuning on the full data). *About 1 hour, optional.*

## Questions for the author

1. Is the main stakeholder the creator (wants a probability and advice) or the platform (wants to flag risky projects for review)? The right metric and threshold depend on this.
2. Why did you use `class_weight="balanced"` together with threshold tuning? Did you compare against an unweighted model?
3. Should canceled projects that reached their goal (698) really count as "not funded"? Did you consider dropping canceled projects, or treating cancel-and-relaunch pairs separately?
4. Is the Launch Check meant to show a number to creators at all? If so, would bands ("low / medium / high", tied to calibrated rates) be clearer than "69 / 100"?
5. Was the 50k sample needed for runtime, or could tuning run on the full training set?
