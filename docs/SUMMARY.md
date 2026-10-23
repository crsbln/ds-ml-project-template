# Project Summary: Kickstarter Success Prediction

This document explains, in plain language, what was done in this project, which tools were used where, and which decisions were made and why. It is written for readers with no background in data science.

> Türkçe sürüm: [OZET.md](tr/OZET.md)

## 1. What is this project about?

[Kickstarter](https://www.kickstarter.com) is a crowdfunding website. People present an idea (an album, a board game, a gadget), set a **funding goal** and ask the public for money. Kickstarter is **all or nothing**: if the goal is not reached by the deadline, the creator receives nothing.

Only about **one in three** projects reaches its goal. Our question was:

> **Can we estimate the chance that a project gets funded, using only information a creator knows *before* launching the campaign?**

Our audience (the "stakeholder") is a creator who is thinking about starting a campaign and wants to know their chances, and which factors are linked to success.

This was the second project of the neuefische Data Science bootcamp. The assignment ([01_assignment.md](course/01_assignment.md)) offered several options; we chose **Option B: Kickstarter project success**.

## 2. The data

- **Source:** the public dataset [Kickstarter Projects](https://www.kaggle.com/datasets/kemical/kickstarter-projects) on Kaggle, file `ks-projects-201801.csv` (about 58 MB).
- **Size:** 378,661 projects launched from 2009 to early 2018, 15 columns (name, category, country, currency, goal, launch date, deadline, money pledged, number of backers, final state, …).
- **Where it lives:** in the `data/` folder on your own computer only. It is **not** uploaded to GitHub (see decision D3).

## 3. What we did, step by step

The work followed the five milestones of the assignment (M0 to M4). Everything happens in one notebook: [04_kickstarter_eda_and_modeling.ipynb](../notebooks/01_kickstarter_eda_and_modeling.ipynb).

### Setup and planning
- Created our own copy of the course template on GitHub (private repository) and installed the Python environment with `uv sync`.
- Built a **Kanban board** on GitHub with 5 milestones and 21 tasks (issues) to plan and track the work.

### Milestone 0 – Data Ingestion
- Loaded the data and checked its structure, missing values and duplicates (there were no duplicates).
- **Defined the target** (what we predict): a new column `success` = 1 if the project was funded, 0 if not.
- **Removed "cheating" columns** (leakage): money pledged and number of backers are only known after the campaign ends.
- Found and fixed several data errors (see section 6).

### Milestone 1 – EDA
*EDA = Exploratory Data Analysis: looking at the data with tables and charts to understand it.*
- Drew five charts: success rate by category, by funding goal, by campaign length, by country, and by launch year and month. For campaign length we also compared projects **with the same goal size**, because short campaigns usually have small goals.
- Checked the **class balance**: 36% funded, 64% not funded.

### Milestone 2 – Baseline
- Wrote down the business goal and chose the **metrics** (see decision D6).
- Created new **features** (inputs for the model), for example campaign length in days and the goal on a log scale.
- Split the data: **80% for training**, **20% kept aside as a test set** for the final evaluation.
- Built a **baseline**: the simplest possible rule, "a project succeeds if its goal is below the median of 5,500 USD". Its cross-validated F1 score was **0.520** (0.524 on the test set). This is the score to beat.

### Milestone 3 – Error analysis
- Prepared the data for the models (turning text categories into numbers; scaling numbers for the linear model only).
- Compared **three algorithms** with **5-fold cross validation** on the full training set: Logistic Regression, Random Forest and Gradient Boosting. Gradient Boosting won.
- **Tuned** Gradient Boosting (20 combinations of settings) and chose a **decision threshold** for the yes/no label.
- Evaluated the final model on the test set, checked that its probabilities are **calibrated**, and ran an extra **time-based test** (trained before 2016, tested from 2016). The test set was also looked at in the first review round; see the note in the notebook.
- **Error analysis:** looked at where the model makes mistakes (overall, by category, by goal size), which inputs matter most, and in which direction they push the prediction.
- Saved the final model to `models/`.

### Milestone 4 – Final
- Built two presentations, generated from `reports/results.json` by `presentations/build/` (Node.js, pptxgenjs): a **16-slide client deck** for a non-technical audience (problem, three findings, how we built and checked the model, the Launch Check, limitations, recommendations), also as an animated web version ([crsbln.github.io/ds-ml-slides](https://crsbln.github.io/ds-ml-slides/)) with a presenter cheat sheet, and a **25-slide technical deck** for reviewers and Q&A.
- Cleaned the notebook: all imports at the top, a "How to Run" section and a summary, style checked with `ruff` (PEP 8 rules, 88-character lines).
- Exported both decks to PDF: [client](../presentations/client/Kickstarter_Launch_Check_Client.pdf), [technical](../presentations/technical/Kickstarter_Success_Technical.pdf).
- Had the project reviewed independently twice ([CRITIQUE.md](reviews/CRITIQUE.md), [CRITIQUE_2.md](reviews/CRITIQUE_2.md)) and fixed the findings (see section 11).
- Pushed everything to GitHub.

## 4. Tools we used, and where

| Tool | What it is | Where we used it |
|---|---|---|
| **uv** | Installs Python and the project's packages | `uv sync` to set up the environment ([pyproject.toml](../pyproject.toml), `uv.lock`) |
| **VS Code + Jupyter** | Editor for notebooks (code + text + charts in one file) | Writing and running the notebook |
| **pandas** | Working with tables of data | Loading, cleaning, grouping, new columns |
| **NumPy** | Fast maths on numbers | Log transform of the goal (`np.log1p`) |
| **matplotlib / seaborn** | Drawing charts | All EDA and error analysis charts |
| **scikit-learn** | The main machine learning library | Train/test split, preprocessing, the three models, cross validation, tuning, threshold, calibration, metrics, feature importance, partial dependence |
| **joblib** | Saving Python objects to a file | Saving the final model to `models/kickstarter_success_model.joblib` |
| **ruff** | Code style checker | Checking the notebook against PEP 8 |
| **Git + GitHub** | Version control and online storage | Commits, pushes, private repository |
| **GitHub Projects / Issues / Milestones** | Task planning | Kanban board with 21 issues and 5 milestones |
| **Kaggle** | Website with public datasets | Downloading the data |

### The three models in plain words
- **Logistic Regression:** gives each input a weight and adds them up into a probability. Simple and easy to explain.
- **Random Forest:** builds many decision trees ("if goal > X and category = Y then …") and lets them vote.
- **Gradient Boosting:** builds trees one after another; each new tree tries to fix the mistakes of the previous ones. Usually the strongest on table data, and the winner here.

## 5. Decisions we made

| # | Question | Options | Our choice | Why |
|---|---|---|---|---|
| D1 | Which project? | 5 Zindi challenges, Kickstarter, 10 Kaggle datasets | **Kickstarter (Option B)** | Clear story and stakeholder, one data file, flexible rules, suitable for a beginner |
| D2 | Which data file? | `201612` or `201801` | **`ks-projects-201801.csv`** | Newer, and it contains the goal already converted to USD (`usd_goal_real`) |
| D3 | Put the data on GitHub? | Yes / No | **No** (`data/*` in `.gitignore`) | Large file and licence restrictions; the notebook explains where to download it |
| D4 | What counts as "success"? | Only successful vs failed / canceled and suspended count as failed | **Canceled and suspended = not funded**; `live` and `undefined` dropped | From a creator's view these projects never got the money; unknown outcomes cannot be learned from |
| D5 | Which columns are leakage? | – | **Dropped** `pledged`, `usd pledged`, `usd_pledged_real`, `backers`, `state`; removed "(Canceled)" and "(Suspended)" tags from names | Only known after the campaign, they would give away the answer |
| D6 | Which metrics? | Accuracy, precision, recall, F1, ROC-AUC, log loss, Brier | **Probability first:** ROC-AUC, log loss, Brier score and calibration; **F1** (with precision and recall) for the yes/no label | The creator asks "what are my chances?"; accuracy is misleading because "always fail" already scores 64% |
| D7 | Which baseline? | "Always fail" or a simple rule | **Goal below the training median (5,500 USD)**, scored with the same cross validation | Based on the strongest EDA finding and easy to explain |
| D8 | How to split? | Random stratified or by time | **Random, stratified, 80/20, `random_state=42`**, plus an extra **time-based test** | Keeps the 36/64 ratio; the time test checks how the model holds up on later years |
| D9 | Which models? | Many options | **Logistic Regression, Random Forest, Gradient Boosting** | One simple, two tree-based models; the assignment asks for at least three |
| D10 | Full data or a sample? | 50k sample or full training set | **Full training set** (about 298,000 projects) | With native categorical features the models train in seconds, so no sample is needed |
| D11 | Class imbalance? | Class weights or threshold | **No class weights**; imbalance handled by the decision threshold | Class weights pushed all probabilities up by about 11 points and made them misleading |
| D12 | Unknown country code `N,0"` | Drop, "Unknown", guess from currency | **Guess from currency**, EUR projects labelled `EU` | Every real country uses exactly one currency; the euro is shared by many countries |
| D13 | Yes/no threshold | Default 0.5 or tuned | **Tuned for F1 (0.30)**, used mainly to compare with the baseline; creators see the **probability** in three **chance bands** | A label alone calls too many projects "promising"; bands are honest and easy to read |
| D14 | Notebook layout | Edit the example notebook or start a new one | **New notebook** (`04_…`) | Keeps the coffee example as a reference |
| D15 | Slides | Language and tool | **English**; client and technical decks generated as PowerPoint from `reports/results.json`, exported to PDF, plus an animated web version of the client deck | Course language; PDF required by the assignment; one numbers file keeps every slide in sync |
| D16 | Which features? | All available | **Dropped `main_category`** (already inside `category`) and **`launch_year`** | `launch_year` cannot be used for future years; `main_category` is redundant |
| D17 | Test-set reuse after the first review | Keep claiming "used once", or say it openly | **Say it openly** in the notebook | The first review looked at test results and the model changed afterwards; the changes followed CV and calibration principles, and CV and test scores agree (ROC-AUC 0.752 vs 0.754) |
| D18 | Chance band names | Low / medium / high, or relative to the average | **Below / about / above average** (36%), same cut-offs | A 51% coin flip should not be called "high"; the number is shown first because the cut-offs are fixed |
| D19 | What-if in Launch Check | Offer it, or show only the estimate | **Estimate only** | The model learned creator habits (round-number lengths, launch weekday), so small input changes move the estimate a lot without changing the real odds |

## 6. Problems we found and fixed

| Problem | What we saw | Fix |
|---|---|---|
| Missing launch dates | 7 projects launched on 1970-01-01 (a computer's "no date" value), giving campaigns of 46 years | Dropped these 7 rows |
| Broken country code | 234 projects had the country `N,0"`; these are corrupted records (all raw `N,0"` rows also miss `usd pledged`) | Inferred the country from the currency (210 projects); 24 euro projects labelled `EU` |
| Hidden leakage in the name | Kickstarter adds "(Canceled)" or "(Suspended)" to the name **after** a project is canceled or suspended (24,135 names, sometimes repeated) | Removed all such tags before creating name features |
| Misleading 2018 point | Only 2 projects in 2018 (data collected in early January 2018) | Left 2018 out of the year chart |

## 7. Results

**What drives success (from the charts):**
- **Funding goal:** up to 1,000 USD, 49% are funded; over 100,000 USD, only 6%. Tiny test projects (goals under 100 USD) do not change this.
- **Category:** Dance (62%), Theater (60%) and Comics (54%) do best; Technology (20%), Journalism (21%) and Crafts (24%) worst. The gap remains for the same goal: with a goal of 1k–5k USD, Dance is funded 69% of the time and Technology 26%. A possible reason, not proven: funded small Dance, Theater and Music projects had few but generous backers (median 43–53, about 60–75 USD each), which fits support from the creator's own circle; Games and Comics had many small backers (98–141, about 40 USD each).
- **Campaign length:** for the same goal size, exactly 30 days (chosen by 45% of creators) is below both 15–29 and 31–44 days, and 60 days is the weakest choice. For goals up to 5k USD, 30 and 60 days are the two weakest; for larger goals, very short (1–14) and very long (61–92 days) campaigns are about as weak as 30 days. Every round-number length (15, 20, 25, … 60 days) does worse than the day before and after, which points to creator behaviour rather than to the length itself.
- **Country and launch month** matter very little.

**How good is the model (on the 74,459 test projects it had never seen)?**

| | Simple rule (baseline) | Final model |
|---|---|---|
| Of 100 projects called "promising", funded (precision) | 45 | **50** |
| Of 100 funded projects, found (recall) | 63 | **81** |
| F1 score | 0.524 | **0.619** |
| ROC-AUC | – | **0.754** |
| Brier score (lower is better) | – | **0.189** |

The model labels more projects as "promising" than the rule (58% against 50%). When both pick the same number of projects (half), the model's precision is **53** (rule: 45) and its recall **74** (rule: 63).

The probabilities are **calibrated on average** over all years: projects given about 35% were funded 35% of the time. Per launch year they are off by up to about 4 percentage points. The chance bands are named relative to the average success rate of 36%:

| Chance band | Share of projects | Actually funded |
|---|---|---|
| Below average (under 25%) | 34% | 14% |
| About average (25–50%) | 39% | 37% |
| Above average (50% or more) | 27% | 62% |

The model relies most on the category, the funding goal and the campaign length.

**Limits:**
- Projects in the below-average band were funded only 14 times in 100 (average: 36), so the band works well as a **risk warning**.
- "Above average" is no guarantee: those projects are funded about six times in ten.
- The model gives an **estimate, not advice**: it has learned habits of past creators (for example round-number lengths), so changing one input by a little can move the estimate a lot (29 instead of 30 days: 72% instead of 51% for the example project) without changing the real odds.
- On later years (time-based test) the ranking holds (ROC-AUC 0.757), but recall drops from 81% to 75% and the rates drift; the model should be retrained on recent data.
- It cannot see the campaign itself (video, rewards, promotion, the creator's network), and the patterns it finds are associations, not proof of cause.

**Recommendations for creators:** set a realistic goal (a smaller goal also limits what you can raise), choose the campaign length on purpose (round numbers like 30 and 60 days did worse than the days around them), and know the success rate of your category.

## 8. Files in this repository

| File / folder | Content |
|---|---|
| [01_kickstarter_eda_and_modeling.ipynb](../notebooks/01_kickstarter_eda_and_modeling.ipynb) | The complete analysis: data cleaning, EDA, models, calibration, error analysis |
| [Client deck](../presentations/client/Kickstarter_Launch_Check_Client.pptx) ([PDF](../presentations/client/Kickstarter_Launch_Check_Client.pdf), [live](https://crsbln.github.io/ds-ml-slides/)) | 16 slides for a non-technical audience, with speaker notes |
| [Technical deck](../presentations/technical/Kickstarter_Success_Technical.pptx) ([PDF](../presentations/technical/Kickstarter_Success_Technical.pdf)) | 25 slides for reviewers and Q&A |
| [Presenter cheat sheet](../presentations/PRESENTER_CHEATSHEET.md) | What to say on each client slide, plus the details kept off the slides |
| `models/kickstarter_success_model.joblib` | The saved final model (scikit-learn 1.9.0) |
| `data/` | Place for the downloaded CSV (not on GitHub) |
| [README.md](../README.md) | Project overview and how to run it |
| [CRITIQUE.md](reviews/CRITIQUE.md) / [ELESTIRI.md](tr/ELESTIRI.md) | Independent review of the project in English and Turkish |
| [CRITIQUE_2.md](reviews/CRITIQUE_2.md) / [ELESTIRI_2.md](tr/ELESTIRI_2.md), [CRITIQUE_3.md](reviews/CRITIQUE_3.md) / [ELESTIRI_3.md](tr/ELESTIRI_3.md) | Second and third review rounds |
| [DESIGN_REVIEW.md](reviews/DESIGN_REVIEW.md) / [TASARIM_INCELEME.md](tr/TASARIM_INCELEME.md) | Design review of the presentation |
| [01_assignment.md](course/01_assignment.md), [02_kanban_board.md](course/02_kanban_board.md) | The course assignment and the Kanban guide |
| [03_eda-and-modeling.ipynb](../notebooks/reference/course_example_coffee.ipynb) | The course's example notebook (coffee data), used only as a reference |
| [SUMMARY.md](SUMMARY.md) / [OZET.md](tr/OZET.md) | This summary in English and Turkish |

## 9. How to run it yourself

1. Run `uv sync` in the project folder.
2. Download `ks-projects-201801.csv` from Kaggle and put it in `data/`.
3. Open the notebook in VS Code, choose the `.venv` (Python 3.13) kernel, and click **Restart** → **Run All** (takes a few minutes).

## 10. Glossary

| Term | Meaning |
|---|---|
| **Target** | The thing we want to predict (here: funded or not) |
| **Feature** | An input the model uses (goal, category, …) |
| **Leakage** | Giving the model information it would not have in real life, so it "cheats" |
| **Train / test set** | Data the model learns from / data kept aside to check it honestly |
| **Cross validation** | Splitting the training data into 5 parts and testing 5 times, so one lucky split does not fool us |
| **Baseline** | The simplest possible rule; the score a real model must beat |
| **Precision** | Of the projects called "promising", how many really were funded |
| **Recall** | Of the projects that really were funded, how many the model found |
| **F1 score** | A balance of precision and recall (0 = useless, 1 = perfect) |
| **ROC-AUC** | How well the model ranks successful above unsuccessful projects (0.5 = guessing, 1 = perfect) |
| **Brier score / log loss** | How far the predicted probabilities are from what really happened (lower is better) |
| **Calibration** | Whether "40%" really means that about 40 in 100 such projects get funded |
| **Hyperparameters** | Settings of a model chosen by us, not learned from the data |
| **Decision threshold** | The probability above which the model says "promising" |
| **One-hot encoding** | Turning a text category into 0/1 columns the model can read |
| **Pipeline** | Preprocessing and model packed into one object, so they are always applied together |
| **Partial dependence** | A chart showing how the average prediction changes when one input changes |

## 11. Changes after the independent review

An independent reviewer ([CRITIQUE.md](reviews/CRITIQUE.md)) found no critical problems but 4 major, 7 minor and 5 small issues. 13 were fully resolved and 3 only partly; the second review (below) found what was left, and it was fixed then. Slide numbers in the first two tables refer to the earlier 12-slide version of the deck.

| Finding | What we changed |
|---|---|
| Scores inflated by class weighting (Major) | Removed `class_weight="balanced"`; probabilities are now calibrated (calibration plot, Brier score); the Launch Check slide shows a calibrated chance and a band |
| F1 threshold a poor operating point (Major) | The probability is now the main output, compared with ROC-AUC, log loss and Brier score; creators see chance bands; the 84% warning figure is shown next to the 64% base rate *Partly: slides 7–8 still used the F1 label. Fixed in round 2 (same-share comparison, below-average band).* |
| "Keep the campaign short" confounded by goal (Major) | Added a goal-stratified table and partial dependence plots; rewrote the recommendation and slides 6 and 9 *Partly: the closing slide still said "short campaign". Fixed in round 2.* |
| Random split only (Major) | Added a time-based test (before 2016 vs 2016 onwards); dropped `launch_year`; softened the generalisation claim |
| "(Suspended)" name leak (Minor) | Name cleaning now removes every "(Canceled)" and "(Suspended)" tag, in any case |
| CV and test scores mixed; tuning within noise (Minor) | Baseline scored with the same CV; mean ± standard deviation reported; separate test table; tuning described as "no meaningful difference" |
| Error analysis on a different model (Minor) | Error analysis, permutation importance (with ROC-AUC and standard deviations) and partial dependence now use the final model |
| Numbers without code; small inconsistencies (Minor) | Category and month tables now printed; threshold, year range and data-error count aligned *Partly: slide 4 still said 2009–2017 and the milestone names differed from the assignment. Fixed in round 2.* |
| "+19%" and "83%" can be misread (Minor) | Slides use counts out of 100 with base rates |
| Edge cases in target and goal (Minor) | Notebook documents canceled projects that reached their goal (698), tiny goals and relaunches |
| README and dependencies (Minor) | New project README; `pyproject.toml` renamed, `plotly` removed, `pandas`, `numpy`, `matplotlib`, `joblib` and `ruff` added; scikit-learn version noted |
| Small issues (Nit) | 88-character lines checked with ruff; goal labels "up to 1k"; native categorical features for Gradient Boosting; note on corrupted `N,0"` records; tuning on the full training set |

### Second review ([CRITIQUE_2.md](reviews/CRITIQUE_2.md))

A second independent review ([CRITIQUE_2.md](reviews/CRITIQUE_2.md), Turkish: [ELESTIRI_2.md](tr/ELESTIRI_2.md)) confirmed the metrics (test ROC-AUC 0.754) and found 2 major, 6 minor and 2 small issues, mostly in the wording of the slides and the notebook. The model itself was not changed.

| Finding | Status | What we changed |
|---|---|---|
| Launch Check what-if gives misleading advice (Major) | Fixed | Removed the what-if invitation (slide 10). "Explain each prediction" now means "which factors the estimate is based on" (slide 11). New notebook table of round-number lengths and a what-if demonstration (29 days: 72% instead of 51%). Slides 6 and 9 now say "round numbers like 30 and 60 days". A goal-only what-if with `monotonic_cst` is described as a condition for any future what-if, not built. |
| Closing slide says "short campaign" (Major) | Fixed | Slide 12 now says "Realistic goal, deliberate length, know your odds." |
| "High chance" for 51%; uncomputed "similar projects" figure (Minor) | Fixed | Bands renamed below / about / above average (36%), same cut-offs. The similar-projects figure is now computed (1,375 projects, 43% funded) and explained; removed from the slide. |
| Slides 7–8 compare recall at different shares (Minor) | Fixed | New same-share comparison (threshold 0.349): precision 53 vs 45, recall 74 vs 63 (slide 7). Slide 8 shows the below-average band (14 of 100 funded). The F1 table stays in the notebook. |
| Test set reused across review rounds (Minor) | Fixed | Honest note in the notebook and decision D17; slide 7 no longer says "evaluated once". |
| Calibration holds on average, not per year (Minor) | Fixed; recalibration not done on purpose | New 10-bin and per-year calibration tables (per year off by up to about 4 percentage points); "on average" added to slide 7 and the README. Recalibrating on 2017 is recommended in the notebook but not done, because the model is a course prototype and not deployed. |
| Notebook statements do not match outputs (Minor) | Fixed | Technology and Games above 0.754; "about 6 to 15 times or more"; 1–14 days wording; all round-number dips; new `N,0"` check cell. |
| SUMMARY and slide inconsistencies (Minor) | Fixed | Milestones renamed to match the assignment (here and on GitHub, with issues moved); slide 4 says "2009 to early 2018"; this fix log rewritten. |
| Random Forest gets ordinal codes (Nit) | Kept on purpose; note added | One-hot rerun skipped: it would not change the choice of Gradient Boosting; the notebook now states the handicap. |
| Time check reuses tuned hyperparameters (Nit) | Kept on purpose; note added | Tuning changed the CV log loss by only 0.0003, so the effect is negligible; the notebook says so. |

**Other changes in this round:** the slide sources are now in `slides/` with a build script (`python3 slides/build_pdf.py`); the notebook was re-run top to bottom (all headline numbers unchanged); the translator's note in ELESTIRI.md about milestones was corrected; the deck got the team names, an outline, a step-by-step story (data story, baseline and machine-learning slides, a conclusion) and 8 technical notes.

### Third review ([CRITIQUE_3.md](reviews/CRITIQUE_3.md))

A third independent review ([CRITIQUE_3.md](reviews/CRITIQUE_3.md), Turkish: [ELESTIRI_3.md](tr/ELESTIRI_3.md)) reproduced the metrics and found no critical or major issue, but 3 minor and 3 small ones. The model was not changed. Slide numbers refer to the 24-page deck before the technical notes were moved to the appendix.

| Finding | Status | What we changed |
|---|---|---|
| "30 and 60 days do worst" holds for goals up to 5k USD only (Minor) | Fixed | Slides 10, 19 and 23, speaker notes, README, this summary and the notebook now say "trail their neighbours": below 15–29 and 31–44 days, with 60 days lowest, for every goal size. |
| "Creative projects beat product ideas" rests on 8 of 15 categories (Minor) | Fixed | Slide 8 title now "Dance, theater and comics do best; technology worst"; the footer names the categories not shown (Publishing, Photography, Crafts). |
| Conclusion says "the goal matters most", the model says category (Minor) | Fixed | Slide 23: "the goal and the category matter most". |
| Fix log uses old slide numbers; file tables incomplete (Nit) | Fixed | Note added above; later review files added to the file tables. |
| Name cleaning misses "(Cancelled)" and free-text cancellations (Nit) | Kept on purpose; note added | About 130 names still mention a cancellation. The name features have very little weight (0.008 and 0.002), so the notebook now states this instead of retraining. |
| Early stopping: 231 trees, not 400 (Nit) | Fixed | Notebook and slide 15 say that `max_iter=400` is an upper limit. |

### Design review ([DESIGN_REVIEW.md](reviews/DESIGN_REVIEW.md))

A design review (Turkish: [TASARIM_INCELEME.md](tr/TASARIM_INCELEME.md)) scored the deck 8/10 for visual design and 7/10 for clarity and found 22 points (2 high, 6 medium, 14 low). We applied the three changes with the biggest impact:
- The 8 technical notes moved to an appendix after "Thank you" (pages 17–24), so the talk runs through 16 slides without skipping.
- The limits slide now uses the same colour rule as the charts: rust for the warning (14 / 100), blue for the rest.
- A shorter talk: the outline is now a short agenda, the machine-learning slide has one line per step, the model slide's title states the result, and the speaker notes went from about 1,520 to about 1,200 words (about 8.5 minutes).

We also added the supporter-circle check (section 7) to the notebook, the category technical note, the recommendations ("line up supporters before launch") and the next steps, where a fifth card asks whether the few, generous backers of small dance, theater and music projects are mostly friends and family. The other design points are listed in the review and are optional.

Later, slides 8–11 (baseline, machine learning, results, limits) were rewritten in plainer language: bar charts that compare the rule and the model with a random guess, an 80/20 "final exam" bar, and the chance bands described as "model says under 25% / over 50%". A backup slide with likely questions and short answers opens the appendix.
