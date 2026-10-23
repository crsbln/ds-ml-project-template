# The Machine Learning Part: What We Did and Why

This file explains the machine learning (ML) part of the Kickstarter success prediction project as if to someone who knows nothing about it. For every step we answer four questions: **What did we do? Why? What was the result? Which choice did we make, and why?**

All numbers come from the outputs of the notebook [04_kickstarter_eda_and_modeling.ipynb](../notebooks/01_kickstarter_eda_and_modeling.ipynb). Turkish version: [ML_ACIKLAMA.md](tr/ML_ACIKLAMA.md).

---

## EDA in brief

- **Data:** 378,661 Kickstarter projects from Kaggle. We removed projects with an unknown outcome (live, undefined) and fixed broken dates and country codes. That left **372,293 projects**, of which **36% were funded**.
- **Target (`success`):** 1 if funded, 0 in every other case (failed, canceled, suspended).
- **Leakage cleaning:** we removed everything that is only known after the campaign: money pledged, number of backers, `state`, and the "(Canceled)" tags in names. The model may only see information that is **known before launch**.
- **Exploration:** the three things most associated with success are the funding goal, the category and the campaign length.
  - Small goals succeed far more often.
  - Dance and Theater are high, Technology is low.
  - Round lengths like 30 and 60 days trail the lengths just before and after.
- **The model's 8 inputs:** category, country, the log of the goal (`log_goal`), campaign length, launch month, launch weekday, name length and number of words in the name.

---

## First, the basic idea: what is a "model"?

We have 372,000 past projects, and we know the outcome of each one. We want the model to look at these examples and learn the pattern **"which features go together with success?"**, and then give a success probability to **a new project it has never seen**.

This is called **supervised learning**, because while learning, the model sees the correct answers (`success`). It is like a student practising with mock exams that come with an answer key.

---

## Step 1: Splitting the data (train / test)

**What did we do?** We kept 80% of the projects (297,834) for **training** and 20% (74,459) for **testing**. We did not touch the test projects until the very end.

**Why?** If you test a student with the exact questions they practised on, you cannot tell whether they understood or just memorised. The test set is the **"real exam" the model has never seen**. Only with it can we measure honestly how well the model will do on new projects.

**Choices:**
- **Why 80/20?** It is a common standard. 74,000 test projects are more than enough for the results not to depend on luck.
- **Why "stratified"?** We split so that the success rate is exactly 36% on both sides. A purely random split could, by chance, give 38% on one side and 34% on the other, which would distort the comparison.
- **Why `random_state=42`?** So that the split is the same on every run and the results can be reproduced. The number 42 has no special meaning.

---

## Step 2: The baseline, a "simple rule to beat"

**What did we do?** Without any machine learning, we set up a very simple rule: **"If the goal is below 5,500 USD, say funded."** 5,500 USD is the median goal in the training data.

**Why?** Building a complex model and saying "F1 = 0.62" means nothing on its own. Is that good or bad? It only gets meaning when compared with a simple rule. If the model cannot beat the rule, it is not worth building.

**Result:** the rule's F1 score is **0.524**. In everyday language:
- Of 100 projects the rule calls "funded", **45** really were.
- Of 100 projects that really were funded, it finds **63**.

**Choice: why the goal?** It was the strongest and easiest-to-understand pattern in the EDA. The point of a baseline is to set a reasonable, honest bar.

### What do these measures mean?
- **Precision:** of the projects I call "funded", how many really were? → 45 of 100
- **Recall:** of the projects that really were funded, how many did I catch? → 63 of 100
- **F1:** a balanced average of the two. If either one is very low, F1 is low too.

---

## Step 3: Comparing three models

**What did we do?** We tried three different learning methods:

| Model | How it works, simply put |
|---|---|
| **Logistic Regression** | Gives each input a weight and adds them up. Simple and fast. |
| **Random Forest** | Builds hundreds of decision trees **independently** and lets them vote. |
| **Gradient Boosting** | Builds trees **one after another**. Each new tree corrects the errors of the ones before. |

**How did we compare them? Cross validation.** We split the training data into 5 parts. The model was trained on 4 parts and tested on the 5th, and this was repeated 5 times with a different part as the exam each time. So every model sat 5 different mock exams.

**Why cross validation and not the test set directly?** **Choosing** between models is also a kind of learning. If we had chosen by looking at the test set, it would no longer be "never seen". We made all choices inside the training data and saved the test set for the end.

**Result:**

| Model | ROC-AUC ↑ | Log loss ↓ | Brier ↓ |
|---|---|---|---|
| Logistic Regression | 0.728 | 0.575 | 0.197 |
| Random Forest | 0.718 | 0.581 | 0.200 |
| **Gradient Boosting** | **0.752** | **0.556** | **0.190** |

Gradient Boosting came first on all three measures.

### What do these measures mean?
- **ROC-AUC (ranking skill):** pick one random funded and one random unfunded project. Does the model give the funded one a higher probability? 0.5 means a coin flip, 1.0 means perfect. 0.75 means "it ranks the pair correctly in 3 out of 4 comparisons".
- **Log loss and Brier:** measure **how accurate** the probabilities are. If the model says "I am 90% sure" and is wrong, it is penalised heavily. Lower is better.

### Choices
- **Why did we choose Gradient Boosting?** It ranked best and gave the best probabilities. It can also handle the category as a real category (native categorical support): it does not turn "Tabletop Games" into a number with an order, and it can group similar categories.
- **Why try three models?** You cannot know in advance which method is best for this data. Going from a simple model to a more complex one is the standard approach.
- **Why ROC-AUC and log loss as the main measures, not accuracy?** 64% of the projects are not funded. A model that calls every project "not funded" gets 64% accuracy but is useless. Our real output is a **probability**, so we measured ranking and probability quality.
- **Why no "class weights"?** A common trick for imbalanced data is to give the minority class (funded projects) more weight. But this pushes all probabilities up: when the model says 50%, the real rate would be 36%. We wanted to give creators an **honest probability**, so we did not do it.

**A small honesty note:** Random Forest received the categories as number codes, which handicapped it slightly. But the gap is large enough that the choice would not change; the notebook says so.

---

## Step 4a: Hyperparameter tuning

**What did we do?** Gradient Boosting has settings: how many trees, how big each tree is, how big each step is. With `RandomizedSearchCV` we tried **20 different combinations** of settings, each scored again with 5-fold cross validation and log loss.

**Result:** the best settings were `max_iter=400`, `learning_rate=0.05`, `max_leaf_nodes=31`, `min_samples_leaf=100` and `l2_regularization=1.0`. But the gain was almost zero: log loss went from 0.5558 to 0.5555.

**What does that mean?** The model is already close to what the data allows. To do better we need **better information, not better settings**: the campaign video, the rewards, the creator's network. This is the basis of the "Limitations & Constraints" slide in the client deck.

**What do the settings mean?**
- `learning_rate=0.05`: each new tree corrects only 5% of the error. Small steps learn more slowly but more robustly.
- `min_samples_leaf=100`: every branch of a tree must rest on at least 100 projects. That way the model cannot build a rule on "a coincidence I saw in 3 projects", in other words it cannot memorise.
- `max_iter=400`: an **upper limit** on the number of trees. Early stopping kicked in and the model stopped at 231 trees, because more trees no longer helped.

**Choice: why 20 random combinations and not all of them?** Trying every combination (grid search) would take hours. 20 random tries usually find a good region, and the result was "no difference" anyway.

## Step 4b: The decision threshold

**The problem:** the model gives a probability, say 42%. Do we call that "funded" or "not funded"? The default threshold is 50%. But since only 36% of projects are funded, 50% is a very high bar, and we would miss many funded projects.

**What did we do?** With `TunedThresholdClassifierCV` we searched, again with cross validation, for the threshold that gives the highest F1. Result: **0.30**. If the model gives a probability above 30%, it says "funded".

**Choice:** our main output is still the **probability**. The yes/no label only exists so we can compare with the baseline rule. We tell creators "your chance is about 51%", not "funded / not funded".

---

## Step 5: Test results, the real exam

Only now, after all the choices were made, did we open the test set.

| Measure | Result | Meaning |
|---|---|---|
| **ROC-AUC** | **0.754** | Almost the same as 0.752 in cross validation, so the model did not memorise |
| **F1** (threshold 0.30) | **0.619** | Clearly better than the baseline's 0.524 |
| **Brier** | **0.189** | The probabilities are accurate |

### A fair comparison: the same number of picks
The F1 comparison had a problem: the model and the rule called a different number of projects "funded". The more projects you call "funded", the more funded ones you catch, so the comparison was not fair. We therefore set the model's threshold to 0.349, so that it picks **the same number of projects** as the rule:

| | Simple rule | Model |
|---|---|---|
| Of 100 projects called "funded", really funded | 45 | **53** |
| Of 100 really funded projects, found | 63 | **74** |
| Gives a probability? | no | **yes** |

For comparison: random picks would be right 36 times in 100.

### Calibration: can we trust the probabilities?
If the model says "35%", then about 35 of 100 such projects should really be funded. We checked this on the test set: **it holds on average**. We also turned this into three easy-to-read bands:

| Band | Really funded |
|---|---|
| Below average (<25%) | **14** of 100 → a useful warning sign |
| About average (25–50%) | **37** of 100 |
| Above average (>50%) | **62** of 100 → not a guarantee |

**Choice: why bands?** A number like "47%" means little to most people. "Above average" is easy to understand. But we show the number first, because 49% and 51% fall into different bands.

---

## Step 6: Extra tests, looking for the model's weak spots

### Time check
**The problem:** in a random split all years are mixed. But the model is meant for **future** projects, and success rates changed over the years: 46% in 2011, 28% in 2015.

**What did we do?** We trained the model on projects launched **before 2016** and tested it on projects launched in **2016 or later**.

**Result:** the ranking held (ROC-AUC 0.757). But the probability levels drifted, by up to about 4 points per year. So the model still knows "which project is better", but its "exact percentage" ages over time. Our recommendation: **retrain the model regularly on new data**.

### Error analysis
We looked by category:
- In every main category the probabilities are within about 1.5 points of the actual rate.
- Ranking skill differs by category: 0.685 in Theater, 0.804 in Technology.

**Why did we do this?** A model that is "good on average" can be bad for some groups. Calling the model good without checking this would be incomplete.

---

## Step 7: What does the model look at? Saving it, and Launch Check

### Permutation importance
**The idea:** shuffle the values of one input at random. The more the model's score drops, the more important that input is.

| Input | Drop in ROC-AUC |
|---|---|
| category | **0.108** |
| log_goal | **0.091** |
| duration_days | 0.034 |
| name_words, country | ~0.008 |
| the rest | almost 0 |

The model relies most on the **category** and the **goal**. The sentence "goal and category matter most" on the conclusion slide comes from here.

### Partial dependence: in which direction?
The probability falls steadily as the goal rises. For the campaign length there are dips at round numbers such as 15, 20, 30, 45 and 60 days.

**A critical interpretation:** one day more or less does not change who backs a project. These dips reflect the behaviour of creators who "pick a round number without thinking about the length". **This is a correlation, not a cause.** That is why Launch Check has no what-if. Otherwise it would give misleading advice like "choose 29 days instead of 30, and your chance goes from 51% to 72%".

### Saving and using the model
The model was saved to one file with `joblib` (pipeline and threshold together): `models/kickstarter_success_model.joblib`. For a new project, for example a 10,000 USD Tabletop Games project, 30 days, in the US, the model gives **about 51%**. This is the Launch Check example in the presentation.

---

## All choices in one table

| Choice | Why |
|---|---|
| Only information known before launch | In real use the outcome is not known yet (prevents leakage) |
| 80/20, stratified | An honest final exam, with the same success rate on both sides |
| A baseline first | To prove that the model really adds something |
| Selection with cross validation | To keep the test set for the end |
| Gradient Boosting | Best ranking and best probabilities, handles categories directly |
| No class weights | So that the probabilities stay honest |
| Tuning by log loss | Because the main output is a probability |
| Threshold 0.30 | With a 36% success rate, 50% is too high a bar |
| Comparison at the same number of picks | To compare the model and the rule fairly |
| Time check | The model will be applied to the future |
| No what-if | The model learned a correlation, not a cause |

**Honesty note:** during the review rounds we looked at the test set more than once. That is why the notebook does not say "the test set was used only once"; it states this openly.

---

## Check yourself

1. Why did we compare the models with cross validation and not with the test set?
2. If we had used class weights, what would have happened to the probabilities we give creators?
3. If the model gives 72% for 29 days and 51% for 30 days, why would it be wrong to tell a creator "choose 29 days"?
