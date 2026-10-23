// Technical deck: the full method, every key number, limits and how to reproduce.

const {
  FaTriangleExclamation, FaClock, FaUserSlash, FaTags, FaScaleBalanced, FaRotate,
  FaFont, FaUserCheck, FaSliders, FaServer, FaArrowRight, FaFilter, FaGlobe, FaEraser,
} = require("react-icons/fa6");
const L = require("./lib");

const { HEX, W, M, pct, int } = L;
const NB = "Notebook: notebooks/01_kickstarter_eda_and_modeling.ipynb";
const f3 = (v) => v.toFixed(3);

// Table with a dark header row and quiet body rows
function table(pres, slide, header, rows, opts) {
  const C = pres.SchemeColor;
  const head = header.map((h, i) => ({
    text: h,
    options: { bold: true, color: C.background1, fill: { color: C.text2 }, align: i === 0 ? "left" : "center" },
  }));
  const body = rows.map((row, r) =>
    row.map((cell, i) => {
      const value = typeof cell === "object" && cell !== null && "text" in cell ? cell : { text: String(cell) };
      return {
        text: value.text,
        options: {
          color: C.text1,
          fill: { color: r % 2 ? C.background2 : C.background1 },
          align: i === 0 ? "left" : "center",
          ...(value.options || {}),
        },
      };
    })
  );
  slide.addTable([head, ...body], {
    fontFace: L.THEME.bodyFontFace, fontSize: 14, valign: "middle", margin: [4, 8, 4, 8],
    border: { type: "solid", pt: 0.75, color: HEX.lt2 }, ...opts,
  });
}

// Pale coral (low) to white (average) to pale green (high), for heatmap cells
function heat(value, mid) {
  const lo = [246, 193, 176];
  const md = [255, 255, 255];
  const hi = [143, 214, 178];
  const [a, b, t] = value < mid ? [lo, md, (value - 0.05) / (mid - 0.05)] : [md, hi, (value - mid) / (0.6 - mid)];
  const k = Math.max(0, Math.min(1, t));
  return a.map((c, i) => Math.round(c + (b[i] - c) * k).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function kpi(pres, slide, { x, y, w, h, value, label, sub, color }) {
  const C = pres.SchemeColor;
  L.card(pres, slide, { x, y, w, h, name: `${label} card` });
  L.text(slide, value, { x: x + 0.3, y: y + 0.25, w: w - 0.6, h: 0.85, fontSize: 40, bold: true, color: color || C.accent1, fontFace: L.THEME.headFontFace });
  L.text(slide, label, { x: x + 0.3, y: y + 1.1, w: w - 0.6, h: 0.4, fontSize: 16, bold: true, color: C.text2 });
  L.text(slide, sub, { x: x + 0.3, y: y + 1.5, w: w - 0.6, h: h - 1.65, fontSize: 13, color: C.accent4 });
}

function bulletList(slide, items, opts) {
  slide.addText(
    items.map((item, i) => ({
      text: item,
      options: { bullet: { indent: 18 }, breakLine: i < items.length - 1, paraSpaceAfter: 8 },
    })),
    { isTextBox: true, margin: 0, valign: "top", fontSize: 15, ...opts }
  );
}

const TEAM = "Kashif Kazmi · Furkan Yurttepe · Christian Balan";
const GOAL_RULE_AUC = 0.6365; // "smaller goal = more likely" as a score, 5-fold CV like the models
const LEAK_RULE_MATCH = 0.997; // our data (372,293 projects): "pledged >= goal" matches the outcome

// Same business look as the client deck (lib.js theme "business")
async function buildTechnical(results, file) {
  L.useTheme("business");
  try {
    return await build(results, file);
  } finally {
    L.useTheme("funded");
  }
}

async function build(results, file) {
  const pres = L.newDeck({ title: "Kickstarter Launch Check: technical deep dive", subject: "Technical presentation" });
  const C = pres.SchemeColor;
  const d = results.data;
  const eda = results.eda;
  const fin = results.final;
  const base = results.baseline;
  const avg = d.success_rate;
  const cw = 3.55;
  const cgap = (W - 2 * M - 3 * cw) / 2;
  const S = ["Overview", "Data", "Exploration", "Modelling", "Evaluation", "Wrap-up"];

  // ===== Overview ==========================================================================
  pres.addSection({ title: S[0] });
  L.slideOn(pres, "Title (dark)", S[0], {
    kicker: "Machine learning project · Technical review",
    title: "Kickstarter Launch Check",
    body: "Technical deep dive: data, model, evaluation and limits of a pre-launch funding estimate",
    byline: `${TEAM} · October 2026`,
    notes: `This is the technical version of the project. It covers how we cleaned ${int(d.raw_rows)} raw projects, what the exploration showed, how the model was chosen and tuned, how it was evaluated, and where it fails. Every number comes from the notebook or from reports/results.json, which the training script regenerates.`,
  });

  let s = L.slideOn(pres, "Content", S[0], {
    kicker: "Executive summary",
    title: "Calibrated pre-launch chances that beat the goal rule",
    source: `Held-out test set: ${int(fin.test_rows)} projects · ${NB}`,
    notes: `Four numbers summarise the project. ${int(d.clean_rows)} projects after cleaning, ${pct(avg)} funded. A tuned gradient boosting model reaches ROC-AUC ${f3(fin.test.roc_auc)} on a held-out test set. As a yes/no label its F1 is ${f3(fin.test.f1)} against ${f3(base.test.f1)} for the goal-below-median rule. The probabilities are calibrated: Brier ${f3(fin.test.brier)}, and within one point per probability bin. The main drivers are category, goal and campaign length; the time-based check shows the ranking holds but the levels drift.`,
  });
  const kw = (W - 2 * M - 3 * 0.35) / 4;
  const kpis = [
    [int(d.clean_rows), "projects", `${d.first_year} to early ${d.last_year}, ${pct(avg)} funded`],
    [f3(fin.test.roc_auc), "ROC-AUC (test)", `Cross-validation ${f3(results.model_comparison ? results.model_comparison[2].roc_auc : fin.test.roc_auc)}; ranks 3 in 4 pairs right`],
    [f3(fin.test.f1), "F1 (test)", `Goal rule: ${f3(base.test.f1)}; always "not funded": 0`],
    [f3(fin.test.brier), "Brier score", "Calibrated: predicted and actual within 1 point per bin"],
  ];
  for (const [i, [value, label, sub]] of kpis.entries()) {
    kpi(pres, s, { x: M + i * (kw + 0.35), y: 1.85, w: kw, h: 2.3, value, label, sub });
  }
  L.text(s, "What drives success", { x: M, y: 4.5, w: 5.8, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
  bulletList(s, [
    "Category: Dance 62% vs Technology 20%, also within the same goal range",
    "Goal: 49% funded up to $1k, 6% over $100k (log-linear)",
    "Length: round numbers (30, 60 days) trail their neighbours",
  ], { x: M, y: 4.95, w: 5.8, h: 1.6, color: C.text1 });
  L.text(s, "What to watch", { x: 6.93, y: 4.5, w: 5.8, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
  bulletList(s, [
    `Time split (train <2016, test 2016+): ROC-AUC ${results.time_split ? f3(results.time_split.roc_auc) : "n/a"}, rates drift`,
    "Associations, not causes: no what-if advice",
    "No content, creator or marketing data",
  ], { x: 6.93, y: 4.95, w: 5.8, h: 1.6, color: C.text1 });

  s = L.slideOn(pres, "Content (tint)", S[0], {
    kicker: "Problem framing",
    title: "One question, pre-launch inputs, probability metrics",
    source: NB,
    notes: `The stakeholder is a creator before launch. The target is binary: funded or not funded for any reason. Inputs are restricted to what a creator knows before launch. Because the product is a probability, we compare models on ROC-AUC, log loss and Brier score and check calibration. F1 of the success class is used for the yes/no label and the baseline comparison. Accuracy is unsuitable: always predicting not funded already reaches ${pct(1 - avg)}.`,
  });
  const frame = [
    ["Target", "success = 1 if funded; 0 if failed, canceled or suspended. Live and undefined dropped."],
    ["Inputs", "Only what a creator knows before launch: category, country, goal, length, launch month and weekday, title length."],
    ["Metrics", `ROC-AUC, log loss, Brier and calibration for the probability. F1 for the yes/no label. Not accuracy: "always no" scores ${pct(1 - avg)}.`],
  ];
  for (const [i, [head, body]] of frame.entries()) {
    const x = M + i * (cw + cgap);
    L.card(pres, s, { x, y: 2.0, w: cw, h: 3.9, name: `${head} card` });
    L.text(s, `${i + 1}`, { x: x + 0.4, y: 2.3, w: 1, h: 0.8, fontSize: 40, bold: true, color: C.accent1, fontFace: L.THEME.headFontFace });
    L.text(s, head, { x: x + 0.4, y: 3.15, w: cw - 0.8, h: 0.5, fontSize: 22, bold: true, color: C.text2 });
    L.text(s, body, { x: x + 0.4, y: 3.75, w: cw - 0.8, h: 2.0, fontSize: 15, color: C.text1 });
  }

  // ===== Data ==============================================================================
  pres.addSection({ title: S[1] });
  s = L.slideOn(pres, "Content", S[1], {
    kicker: "Data cleaning",
    title: `From ${int(d.raw_rows)} rows to ${int(d.clean_rows)} clean projects`,
    source: "Kaggle dataset kemical/kickstarter-projects, file ks-projects-201801.csv (15 columns, no duplicate rows or IDs)",
    notes: `The raw file has ${int(d.raw_rows)} projects and 15 columns, with no duplicates. We dropped ${int(d.raw_rows - d.after_unknown_outcome_dropped)} live or undefined projects whose outcome is unknown, and ${d.invalid_launch_dropped} projects with a 1970 launch date, which is a missing timestamp. We repaired ${d.country_fixed} corrupted country codes by inferring the country from the currency, and removed ${int(d.status_tags_removed)} status tags hidden in project names. The result is ${int(d.clean_rows)} projects with 8 model features.`,
  });
  const flow = [
    [int(d.raw_rows), "raw projects", "15 columns"],
    [int(d.after_unknown_outcome_dropped), "known outcome", `−${int(d.raw_rows - d.after_unknown_outcome_dropped)} live or undefined`],
    [int(d.clean_rows), "valid launch date", `−${d.invalid_launch_dropped} dated 1970`],
    ["8", "model features", "pre-launch only"],
  ];
  const fw = 2.6;
  const fgap = (W - 2 * M - 4 * fw) / 3;
  for (const [i, [value, label, sub]] of flow.entries()) {
    const x = M + i * (fw + fgap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.95, w: fw, h: 1.9, rectRadius: 0.12, fill: { color: i === 3 ? C.accent6 : C.text2 }, line: { type: "none" }, objectName: `flow ${label}` });
    L.text(s, value, { x: x + 0.25, y: 2.15, w: fw - 0.5, h: 0.75, fontSize: 30, bold: true, color: C.background1, fontFace: L.THEME.headFontFace });
    L.text(s, label, { x: x + 0.25, y: 2.9, w: fw - 0.5, h: 0.4, fontSize: 16, bold: true, color: C.background1 });
    L.text(s, sub, { x: x + 0.25, y: 3.3, w: fw - 0.5, h: 0.4, fontSize: 13, color: C.accent5 });
    if (i < 3) s.addImage({ data: await L.icon(FaArrowRight, HEX.accent1), x: x + fw + fgap / 2 - 0.15, y: 2.75, w: 0.3, h: 0.3, altText: "then", objectName: `flow arrow ${i}` });
  }
  const fixes = [
    [FaGlobe, `${d.country_fixed} country codes`, `'N,0"' rows: country inferred from currency (EUR → "EU"). They were corrupted records.`],
    [FaEraser, `${int(d.status_tags_removed)} name tags`, `"(Canceled)" and "(Suspended)" added after the outcome: stripped as leakage.`],
    [FaFilter, `${d.canceled_reached_goal} edge cases`, "Canceled projects that had reached the goal: kept as not funded (no money paid)."],
  ];
  for (const [i, [Icon, head, body]] of fixes.entries()) {
    const x = M + i * (cw + cgap);
    L.card(pres, s, { x, y: 4.25, w: cw, h: 2.2, fill: C.background2, name: `${head} card`, shadow: false });
    await L.iconCircle(pres, s, Icon, { x: x + 0.3, y: 4.5, d: 0.7, fill: C.background1, iconHex: HEX.accent6, name: head });
    L.text(s, head, { x: x + 1.2, y: 4.55, w: cw - 1.5, h: 0.6, fontSize: 17, bold: true, color: C.text2, valign: "middle" });
    L.text(s, body, { x: x + 0.3, y: 5.35, w: cw - 0.6, h: 1.0, fontSize: 13, color: C.text1 });
  }

  s = L.slideOn(pres, "Content", S[1], {
    kicker: "Target definition",
    title: "Funded, or not funded for any reason",
    source: NB,
    notes: `The state column has six values. Successful becomes 1. Failed, canceled and suspended become 0, because from the creator's point of view none of them received the money. Live and undefined projects are dropped because their outcome is unknown. This gives ${pct(avg)} funded and ${pct(1 - avg)} not funded, a moderate imbalance we handle with the threshold, not with class weights, so the probabilities stay calibrated. An alternative notebook drops canceled projects instead; slide 22 compares the two.`,
  });
  table(pres, s, ["state", "projects", "target"], [
    ["successful", "133,956", { text: "1 · funded", options: { bold: true, color: C.accent1 } }],
    ["failed", "197,719", "0 · not funded"],
    ["canceled", "38,779", "0 · not funded"],
    ["suspended", "1,846", "0 · not funded"],
    ["live", "2,799", { text: "dropped (unknown)", options: { color: C.accent4 } }],
    ["undefined", "3,562", { text: "dropped (unknown)", options: { color: C.accent4 } }],
  ], { x: M, y: 1.9, w: 6.6, colW: [2.2, 1.9, 2.5], rowH: 0.55 });
  L.card(pres, s, { x: 7.73, y: 1.9, w: 5.0, h: 3.85, fill: C.background2, name: "balance card", shadow: false });
  L.text(s, "Class balance after cleaning", { x: 8.05, y: 2.15, w: 4.4, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  L.text(s, pct(avg), { x: 8.05, y: 2.65, w: 2.0, h: 0.8, fontSize: 40, bold: true, color: C.accent1, fontFace: L.THEME.headFontFace });
  L.text(s, `funded\n${int(d.funded)}`, { x: 9.75, y: 2.7, w: 2.6, h: 0.75, fontSize: 14, color: C.text1 });
  L.fundingBar(pres, s, { x: 8.05, y: 3.6, w: 4.35, value: avg, track: C.background1, name: "class balance" });
  L.text(s, `Accuracy is misleading: "always not funded" scores ${pct(1 - avg)}. No resampling and no class weights; the yes/no threshold handles the imbalance.`, { x: 8.05, y: 4.05, w: 4.4, h: 1.5, fontSize: 14, color: C.text1 });

  s = L.slideOn(pres, "Content (tint)", S[1], {
    kicker: "Target leakage",
    title: "Remove the future data: everything known only after launch",
    source: "99.7% on all 372,293 projects (canceled count as not funded); 99.997% among successful and failed only (alternative notebook, notebooks/reference)",
    notes: `Leakage was the biggest trap. Money pledged and backers are only known after the campaign; on all our projects, the rule pledged at least the goal matches the outcome 99.7 percent of the time, and 99.997 percent among successful and failed ones. We dropped all five outcome columns. There was also a hidden leak: Kickstarter appends Canceled or Suspended to the project name after the fact. ${int(d.status_tags_removed)} names had such a tag, and every single one was not funded. We strip these tags before computing name features. A small residue remains, about 120 renamed projects and 4 'Cancelled' spellings, which we accept because the name features carry very little weight.`,
  });
  L.card(pres, s, { x: M, y: 1.95, w: 5.9, h: 4.5, name: "obvious leak card" });
  L.text(s, "Obvious: outcome columns", { x: M + 0.4, y: 2.2, w: 5.1, h: 0.45, fontSize: 20, bold: true, color: C.text2 });
  L.text(s, pct(LEAK_RULE_MATCH, 1), { x: M + 0.4, y: 2.75, w: 5.1, h: 0.9, fontSize: 44, bold: true, color: C.accent2, fontFace: L.THEME.headFontFace });
  L.text(s, "of outcomes follow from \"pledged ≥ goal\"", { x: M + 0.4, y: 3.6, w: 5.1, h: 0.4, fontSize: 15, color: C.text1 });
  bulletList(s, ["pledged, usd pledged, usd_pledged_real", "backers", "state (the raw label)"], { x: M + 0.4, y: 4.25, w: 5.1, h: 1.8, color: C.text1 });
  L.card(pres, s, { x: 6.83, y: 1.95, w: 5.9, h: 4.5, name: "hidden leak card" });
  L.text(s, "Hidden: tags in the name", { x: 7.23, y: 2.2, w: 5.1, h: 0.45, fontSize: 20, bold: true, color: C.text2 });
  L.text(s, int(d.status_tags_removed), { x: 7.23, y: 2.75, w: 5.1, h: 0.9, fontSize: 44, bold: true, color: C.accent2, fontFace: L.THEME.headFontFace });
  L.text(s, "names ended in \"(Canceled)\" or \"(Suspended)\": 100% not funded", { x: 7.23, y: 3.6, w: 5.1, h: 0.6, fontSize: 15, color: C.text1 });
  bulletList(s, ["Stripped with a case-insensitive regex before name features", "Residue accepted: ~120 renamed projects, 4 \"(Cancelled)\"", "Name features weigh little (importance ≤ 0.008)"], { x: 7.23, y: 4.4, w: 5.1, h: 1.8, color: C.text1 });

  // ===== Exploration =======================================================================
  pres.addSection({ title: S[2] });
  const goal = eda.by_goal;
  s = L.slideOn(pres, "Content", S[2], {
    kicker: "EDA · Funding goal",
    title: "Success falls by a similar step each time the goal doubles",
    source: `Success rate by goal in USD · all ${int(d.clean_rows)} projects · green: above the ${pct(avg)} average`,
    notes: `Success drops steadily from ${pct(goal[0].rate)} for goals up to one thousand dollars to ${pct(goal[7].rate)} above one hundred thousand. The bins roughly double, and success falls by a similar amount each time, so the relationship is log-linear and the model uses log of the goal. Tiny goals of ten dollars or less, often tests, do not drive the headline: without goals under 100 dollars, the rate up to 1k is still 49.2 percent.`,
  });
  L.bars(pres, s, { x: M, y: 1.8, w: 8.2, h: 4.9, horizontal: false, labels: goal.map((g) => g.name), values: goal.map((g) => g.rate), colors: L.aboveBelow(goal.map((g) => g.rate), avg), name: "Success rate by funding goal" });
  L.card(pres, s, { x: 9.2, y: 1.95, w: 3.53, h: 4.6, fill: C.background2, name: "goal notes", shadow: false });
  L.text(s, "Feature choice", { x: 9.5, y: 2.2, w: 3.0, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  L.text(s, "log_goal = log(1 + goal in USD). Goals run from $0.01 to $166M.", { x: 9.5, y: 2.65, w: 3.0, h: 1.1, fontSize: 14, color: C.text1 });
  L.text(s, "Robustness", { x: 9.5, y: 3.85, w: 3.0, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  L.text(s, "1,143 goals ≤ $10 (63% funded). Without goals under $100, up to $1k is still 49.2%.", { x: 9.5, y: 4.3, w: 3.0, h: 1.4, fontSize: 14, color: C.text1 });

  const cats = eda.by_main_category;
  s = L.slideOn(pres, "Content", S[2], {
    kicker: "EDA · Category",
    title: "Category matters, and not only through the goal",
    source: `All 15 main categories · the model uses the ${d.n_categories} sub-categories · green: above the ${pct(avg)} average`,
    notes: `All 15 main categories are shown, so nothing is cherry-picked. Dance, Theater and Comics are funded most often, Technology, Journalism and Crafts least. Part of this is the goal: the median Technology goal is twenty thousand dollars, against about 3,300 for Dance. But the gap remains within the same goal range: with a goal of one to five thousand dollars, Dance reaches 69 percent and Theater 68, against 26 for Technology and 20 for Crafts. Crafts has the lowest median goal of all and still does badly, so the category has an effect of its own.`,
  });
  L.bars(pres, s, { x: M, y: 1.75, w: 7.4, h: 5.05, labels: cats.map((c) => c.name), values: cats.map((c) => c.rate), colors: L.aboveBelow(cats.map((c) => c.rate), avg), name: "Success rate by main category" });
  table(pres, s, ["Goal $1k to $5k", "funded"], [
    ["Dance", "69%"], ["Theater", "68%"], ["Technology", "26%"], ["Crafts", "20%"],
  ], { x: 8.4, y: 1.95, w: 4.33, colW: [2.83, 1.5], rowH: 0.48 });
  L.text(s, "Median goal: Technology $20,000, Dance $3,300, Crafts $2,328: low goal, still low success.", { x: 8.4, y: 4.6, w: 4.33, h: 1.2, fontSize: 14, color: C.text1 });

  const dg = eda.duration_by_goal;
  s = L.slideOn(pres, "Content", S[2], {
    kicker: "EDA · Campaign length within goal range",
    title: "Compare lengths at the same goal size",
    source: "Success rate by goal range (rows) and campaign length in days (columns) · colour: coral below, green above the average",
    notes: `Raw numbers suggest short campaigns do best, but short campaigns also ask for smaller goals: the median goal is 1,200 dollars for 1 to 14 days and 9,750 for 60 days. So we compare lengths within the same goal range. Two patterns hold in every row: exactly 30 days is below both 15 to 29 and 31 to 44 days, and 60 days is the weakest choice. Shorter is not simply better: for goals above 5k, 1 to 14 days does about as badly as 30.`,
  });
  const rows = dg.rows.map((row) => [
    { text: row.name, options: { bold: true } },
    ...row.rates.map((v, i) => ({
      text: pct(v),
      options: { fill: { color: heat(v, avg) }, bold: dg.columns[i] === "30" || dg.columns[i] === "60" },
    })),
  ]);
  table(pres, s, ["Goal \\ days", ...dg.columns], rows, { x: M, y: 1.95, w: W - 2 * M, colW: [2.33, ...dg.columns.map(() => 1.4)], rowH: 0.7, fontSize: 16 });
  L.text(s, [
    { text: "Holds for every goal size: ", options: { bold: true } },
    { text: "exactly 30 days is below both 15–29 and 31–44 days, and 60 days is the lowest column." },
  ], { x: M, y: 5.75, w: W - 2 * M, h: 0.5, fontSize: 17, color: C.text2 });

  const rl = eda.round_lengths;
  s = L.slideOn(pres, "Content", S[2], {
    kicker: "EDA · Round-number lengths",
    title: "Every round length trails the day before and after",
    source: "Success rate at each round length and its neighbours · same pattern inside each goal range (32 of 32 cases)",
    notes: `Thirty and sixty days stand out, so we checked every round number. Each of 15, 20, 25, 30, 35, 40, 45 and 60 days has a lower success rate than both the day before and the day after; the most common case, 30 days, is funded ${pct(rl[3].round)} of the time against ${pct(rl[3].before)} for 29 and ${pct(rl[3].after)} for 31. One day cannot plausibly change who backs a project, so the round number is a marker of creator behaviour, not a cause. The model learns these dips, which is why we never give what-if advice on length.`,
  });
  s.addChart(pres.charts.BAR, [
    { name: "Day before", labels: rl.map((r) => `${r.days} days`), values: rl.map((r) => r.before) },
    { name: "Round length", labels: rl.map((r) => `${r.days} days`), values: rl.map((r) => r.round) },
    { name: "Day after", labels: rl.map((r) => `${r.days} days`), values: rl.map((r) => r.after) },
  ], L.chartBase({
    x: M, y: 1.75, w: W - 2 * M, h: 4.95, barDir: "col", barGrouping: "clustered", barGapWidthPct: 60,
    chartColors: [HEX.accent5, HEX.accent2, HEX.accent6], showLegend: true, legendPos: "t", legendFontFace: "+mn-lt", legendFontSize: 13, legendColor: HEX.dk1,
    showValue: false, valAxisHidden: false, valAxisLabelFormatCode: "0%", valAxisMinVal: 0, valGridLine: { color: HEX.lt2, size: 0.75 },
    objectName: "Round lengths vs neighbours",
  }));

  const yr = eda.by_year;
  s = L.slideOn(pres, "Content", S[2], {
    kicker: "EDA · Launch year",
    title: "Success rates shifted over time",
    source: "2018 has only 2 projects (data collected in early January 2018) and is left out",
    notes: `Success was stable at 43 to 46 percent from 2009 to 2013, fell to ${pct(yr[5].rate)} in 2014 and ${pct(yr[6].rate)} in 2015 while volume jumped from about 45 thousand to 75 thousand projects, then recovered to ${pct(yr[8].rate)} in 2017. A likely external reason is that Kickstarter dropped its manual project review in mid-2014. Because the level changes over time, launch year is not a model feature, and we test the model on later years separately.`,
  });
  s.addChart(pres.charts.LINE, [{ name: "Success rate", labels: yr.map((y) => String(y.year)), values: yr.map((y) => y.rate) }], L.chartBase({
    x: M, y: 1.75, w: 6.0, h: 4.9, chartColors: [HEX.accent1], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9,
    dataLabelFormatCode: "0%", dataLabelPosition: "t", valAxisMinVal: 0, valAxisMaxVal: 0.6, objectName: "Success rate by year",
  }));
  L.bars(pres, s, { x: 6.93, y: 1.75, w: 5.8, h: 4.9, horizontal: false, fmt: "#,##0", labels: yr.map((y) => String(y.year)), values: yr.map((y) => y.projects), colors: yr.map(() => HEX.accent4), name: "Projects launched per year" });
  L.text(s, "Success rate", { x: M, y: 1.7, w: 3, h: 0.35, fontSize: 14, bold: true, color: C.text2 });
  L.text(s, "Projects launched", { x: 6.93, y: 1.7, w: 3, h: 0.35, fontSize: 14, bold: true, color: C.text2 });

  // ===== Modelling =========================================================================
  pres.addSection({ title: S[3] });
  s = L.slideOn(pres, "Content", S[3], {
    kicker: "Features and split",
    title: "Eight pre-launch features, one untouched test set",
    source: "Stratified 80/20 split, random_state=42 · every encoder and model is fitted inside a Pipeline on training data only",
    notes: `The model gets eight features, all computed per row from information known before launch. We deliberately left out main category, because the sub-category contains it; currency, which duplicates country; and launch year, because the model scores future campaigns and a tree would treat every future year like 2017. Twenty percent of projects are held out as a stratified test set and not touched until the final evaluation.`,
  });
  table(pres, s, ["feature", "meaning"], [
    ["category", `sub-category (${d.n_categories} values), native categorical`],
    ["country", "country code (23 values incl. EU)"],
    ["log_goal", "log(1 + goal in USD)"],
    ["duration_days", "deadline minus launch date, 1 to 92"],
    ["launch_month", "1 to 12"],
    ["launch_weekday", "0 = Monday to 6 = Sunday"],
    ["name_length", "title length in characters (tags removed)"],
    ["name_words", "title length in words"],
  ], { x: M, y: 1.9, w: 7.6, colW: [2.4, 5.2], rowH: 0.5, fontSize: 14 });
  L.card(pres, s, { x: 8.6, y: 1.9, w: 4.13, h: 4.55, fill: C.background2, name: "split card", shadow: false });
  L.text(s, "Train", { x: 8.9, y: 2.15, w: 3.5, h: 0.35, fontSize: 15, bold: true, color: C.text2 });
  L.text(s, int(fin.train_rows), { x: 8.9, y: 2.5, w: 3.5, h: 0.6, fontSize: 30, bold: true, color: C.accent1, fontFace: L.THEME.headFontFace });
  L.text(s, "Test (final exam)", { x: 8.9, y: 3.2, w: 3.5, h: 0.35, fontSize: 15, bold: true, color: C.text2 });
  L.text(s, int(fin.test_rows), { x: 8.9, y: 3.55, w: 3.5, h: 0.6, fontSize: 30, bold: true, color: C.accent6, fontFace: L.THEME.headFontFace });
  L.text(s, "Left out on purpose", { x: 8.9, y: 4.35, w: 3.5, h: 0.35, fontSize: 15, bold: true, color: C.text2 });
  L.text(s, "main_category (inside category), currency (= country), launch_year (future campaigns)", { x: 8.9, y: 4.75, w: 3.55, h: 1.5, fontSize: 13, color: C.text1 });

  s = L.slideOn(pres, "Content (tint)", S[3], {
    kicker: "Baseline",
    title: "Accuracy rewards doing nothing; F1 does not",
    source: `5-fold stratified CV on the training set · the goal median ($${int(base.median_goal_usd)}) is learned inside each fold`,
    notes: `Two baselines. Always predicting not funded reaches the best accuracy, ${pct(1 - avg)}, but never finds a funded project, so its F1 is zero. That is why accuracy is the wrong metric. The real baseline is the rule: success if the goal is below the median of ${int(base.median_goal_usd)} dollars. Its cross-validated F1 is ${f3(base.cv.f1)} plus or minus ${f3(base.cv.f1_std)}. This is the score to beat.`,
  });
  s.addChart(pres.charts.BAR, [
    { name: "Always not funded", labels: ["Accuracy", "Precision", "Recall", "F1"], values: [1 - avg, 0, 0, 0] },
    { name: `Goal below $${int(base.median_goal_usd)}`, labels: ["Accuracy", "Precision", "Recall", "F1"], values: [base.cv.accuracy, base.cv.precision, base.cv.recall, base.cv.f1] },
  ], L.chartBase({
    x: M, y: 1.75, w: 7.6, h: 4.9, barDir: "col", barGrouping: "clustered", barGapWidthPct: 70,
    chartColors: [HEX.accent4, HEX.accent3], showLegend: true, legendPos: "t", legendFontFace: "+mn-lt", legendFontSize: 13, legendColor: HEX.dk1,
    dataLabelFormatCode: "0.00", dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 1, objectName: "Baseline metrics",
  }));
  kpi(pres, s, { x: 8.6, y: 1.95, w: 4.13, h: 2.1, value: f3(base.cv.f1), label: "Score to beat (F1)", sub: `± ${f3(base.cv.f1_std)} across folds · test: ${f3(base.test.f1)}` });
  kpi(pres, s, { x: 8.6, y: 4.35, w: 4.13, h: 2.1, value: "0.000", label: "F1 of \"always no\"", sub: `despite ${pct(1 - avg)} accuracy`, color: C.accent2 });

  const mc = results.model_comparison;
  if (mc) {
    s = L.slideOn(pres, "Content", S[3], {
      kicker: "Model comparison",
      title: "Gradient boosting performed best",
      source: "5-fold stratified CV on the full training set · mean ± std across folds (Brier std < 0.001) · Brier and log loss: lower is better",
      notes: `We compared three algorithms with five-fold cross-validation on the whole training set, using threshold-free metrics, against the goal rule (smaller goal = more likely, ROC-AUC 0.64). Gradient boosting wins on all three: ROC-AUC ${f3(mc[2].roc_auc)}, log loss ${f3(mc[2].log_loss)}, Brier ${f3(mc[2].brier)}. The gaps are 6 to 15 times the fold standard deviation of about 0.001, so they are not noise. Logistic regression is a reasonable second, which tells us much of the signal is simple. Random forest gets ordinal category codes, which slightly handicaps it; that does not change the choice.`,
    });
    const withRule = [{ name: "Goal rule", roc_auc: GOAL_RULE_AUC }, ...mc];
    s.addChart(pres.charts.BAR, [{ name: "ROC-AUC", labels: withRule.map((m) => m.name), values: withRule.map((m) => m.roc_auc) }], L.chartBase({
      x: M, y: 1.75, w: 6.6, h: 4.9, barDir: "col", barGapWidthPct: 55, chartColors: ["DDE2DF", "B9C2BE", "B9C2BE", HEX.accent1],
      dataLabelFormatCode: "0.000", dataLabelPosition: "outEnd", valAxisMinVal: 0.5, valAxisMaxVal: 0.8, objectName: "CV ROC-AUC by model",
    }));
    L.text(s, "ROC-AUC, 5-fold CV (axis starts at 0.50 = coin flip)", { x: M, y: 1.7, w: 6.6, h: 0.35, fontSize: 14, bold: true, color: C.text2 });
    table(pres, s, ["model", "ROC-AUC", "log loss", "Brier"], mc.map((m, i) => [
      { text: m.name, options: { bold: i === 2 } },
      `${f3(m.roc_auc)} ± ${f3(m.roc_auc_std)}`,
      `${f3(m.log_loss)} ± ${f3(m.log_loss_std)}`,
      m.brier.toFixed(4),
    ]), { x: 7.53, y: 1.95, w: 5.2, colW: [1.75, 1.25, 1.25, 0.95], rowH: 0.6, fontSize: 12 });
    L.text(s, "HistGradientBoosting with native categorical support; no class weights, so probabilities stay calibrated.", { x: 7.53, y: 4.6, w: 5.2, h: 1.2, fontSize: 14, color: C.text1 });
  }

  const tp = results.tuning.params;
  s = L.slideOn(pres, "Content", S[3], {
    kicker: "Tuning and threshold",
    title: "Tuning barely moves the needle; the threshold matters",
    source: "RandomizedSearchCV (20 combinations, 5-fold, log loss) · TunedThresholdClassifierCV (5-fold, F1)",
    notes: `We tuned gradient boosting with a randomized search over 20 combinations, scored by log loss. The best setting reaches ${results.tuning.best_log_loss ?? "about the same"} against 0.5558 for the defaults, well inside the fold variation, so the settings are kept but the gain is negligible. Larger improvements would have to come from new information, not tuning. For the yes/no label, a cross-validated search picks the threshold that maximises F1: ${f3(fin.threshold)}, with CV F1 ${f3(fin.cv_f1)}. The low threshold makes the label generous, which is why creators see the probability, not the label.`,
  });
  table(pres, s, ["hyperparameter", "chosen"], Object.entries(tp).map(([k, v]) => [k, String(v)]), { x: M, y: 1.9, w: 5.6, colW: [3.4, 2.2], rowH: 0.55 });
  kpi(pres, s, { x: 6.73, y: 1.95, w: 2.85, h: 2.4, value: results.tuning.best_log_loss ? String(results.tuning.best_log_loss) : "n/a", label: "best CV log loss", sub: "defaults: 0.5558 (± 0.001)", color: C.accent6 });
  kpi(pres, s, { x: 9.88, y: 1.95, w: 2.85, h: 2.4, value: f3(fin.threshold), label: "F1-optimal threshold", sub: `CV F1 ${f3(fin.cv_f1)}` });
  L.text(s, "Early stopping is on by default, so max_iter is a ceiling (the final fit stopped at 231 trees). The threshold only sets the yes/no label; the probability is untouched.", { x: 6.73, y: 4.65, w: 6.0, h: 1.4, fontSize: 15, color: C.text1 });

  // ===== Evaluation ========================================================================
  pres.addSection({ title: S[4] });
  const eq = results.equal_share;
  s = L.slideOn(pres, "Content", S[4], {
    kicker: "Test set results",
    title: "Beats the goal rule, also at the same share",
    source: `${int(fin.test_rows)} held-out projects · same share: the model's threshold set so it labels as many projects as the rule (${pct(eq.share_labelled)})`,
    notes: `On the held-out test set the model beats the rule on every label metric: F1 ${f3(fin.test.f1)} against ${f3(base.test.f1)}. But the model labels more projects, ${pct(fin.test.share_labelled)} against ${pct(base.test.share_labelled)}, which inflates recall. So we also compare at the same share: precision ${f3(eq.precision)} against ${f3(base.test.precision)}, recall ${f3(eq.recall)} against ${f3(base.test.recall)}. The model is clearly better either way. ROC-AUC ${f3(fin.test.roc_auc)} and Brier ${f3(fin.test.brier)} match the cross-validation numbers, so there is no overfitting. Note: the test set was looked at once in an earlier review round; the changes made afterwards were driven by CV, not test scores.`,
  });
  const fmt = (v) => (v == null ? "–" : f3(v));
  table(pres, s, ["metric", "Goal rule", "Model (F1 threshold)", "Model (same share)"], [
    ["Accuracy", fmt(base.test.accuracy), fmt(fin.test.accuracy), fmt(eq.accuracy)],
    ["Precision", fmt(base.test.precision), fmt(fin.test.precision), fmt(eq.precision)],
    ["Recall", fmt(base.test.recall), fmt(fin.test.recall), fmt(eq.recall)],
    [{ text: "F1", options: { bold: true } }, fmt(base.test.f1), { text: fmt(fin.test.f1), options: { bold: true, color: C.accent1 } }, fmt(eq.f1)],
    ["Share labelled", pct(base.test.share_labelled), pct(fin.test.share_labelled), pct(eq.share_labelled)],
    ["ROC-AUC", "–", { text: fmt(fin.test.roc_auc), options: { bold: true, color: C.accent1 } }, "same model"],
    ["Brier", "–", fmt(fin.test.brier), "same model"],
  ], { x: M, y: 1.9, w: 8.2, colW: [2.2, 1.8, 2.2, 2.0], rowH: 0.55 });
  L.card(pres, s, { x: 9.2, y: 1.9, w: 3.53, h: 4.4, fill: C.background2, name: "test notes", shadow: false });
  L.text(s, "CV and test agree", { x: 9.5, y: 2.15, w: 3.0, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  L.text(s, `ROC-AUC 0.752 (CV) vs ${f3(fin.test.roc_auc)} (test). Brier 0.1895 vs ${f3(fin.test.brier)}.`, { x: 9.5, y: 2.6, w: 3.0, h: 1.1, fontSize: 14, color: C.text1 });
  L.text(s, "Warnings work", { x: 9.5, y: 3.8, w: 3.0, h: 0.4, fontSize: 17, bold: true, color: C.text2 });
  L.text(s, `When it says "not funded" it is right ${pct(fin.test.npv)} of the time (base rate ${pct(1 - avg)}).`, { x: 9.5, y: 4.25, w: 3.0, h: 1.3, fontSize: 14, color: C.text1 });

  const cal = results.calibration;
  s = L.slideOn(pres, "Content", S[4], {
    kicker: "Calibration",
    title: "When it says 40%, about 40% get funded",
    source: "Test set · 10 equal-width probability bins · the top bin holds only 18 projects",
    notes: `Calibration is the key property for a product that shows a probability. In every bin with a few hundred projects or more, the mean prediction and the actual rate differ by less than one percentage point; overall both are ${pct(cal.mean_predicted)}. Leaving out class weights made this possible. On the right are the three chance bands we show creators: below average, about average and above average, with how often each was really funded. This holds on average over all years; per year it is less exact, see the next slide.`,
  });
  const bins = cal.bins;
  s.addChart(pres.charts.BAR, [
    { name: "Predicted", labels: bins.map((_, i) => `${i * 10}–${i * 10 + 10}%`), values: bins.map((b) => b.predicted) },
    { name: "Actually funded", labels: bins.map((_, i) => `${i * 10}–${i * 10 + 10}%`), values: bins.map((b) => b.actual) },
  ], L.chartBase({
    x: M, y: 1.75, w: 7.9, h: 4.95, barDir: "col", barGrouping: "clustered", barGapWidthPct: 50,
    chartColors: [HEX.accent5, HEX.accent6], showLegend: true, legendPos: "t", legendFontFace: "+mn-lt", legendFontSize: 13, legendColor: HEX.dk1,
    showValue: false, valAxisHidden: false, valAxisLabelFormatCode: "0%", valAxisMinVal: 0, valAxisMaxVal: 1, valGridLine: { color: HEX.lt2, size: 0.75 },
    catAxisLabelFontSize: 11, objectName: "Calibration by probability bin",
  }));
  table(pres, s, ["chance band", "share", "funded"], results.bands.map((b) => [b.name, pct(b.share), { text: pct(b.actual), options: { bold: true } }]), { x: 8.9, y: 1.95, w: 3.83, colW: [1.83, 1.0, 1.0], rowH: 0.6 });
  L.text(s, "Bands are what Launch Check shows. Cut-offs at 25% and 50% are round numbers: always show the probability first.", { x: 8.9, y: 4.6, w: 3.83, h: 1.5, fontSize: 14, color: C.text1 });

  const ts = results.time_split;
  const cy = results.calibration_by_year;
  s = L.slideOn(pres, "Content", S[4], {
    kicker: "Stability over time",
    title: "The ranking holds; the level drifts",
    source: "Left: trained on projects launched before 2016, tested on 2016 onwards · right: random-split test set by launch year",
    notes: ts ? `The random split mixes years, but the model is meant for future campaigns. Trained only on projects before 2016 and tested on 2016 onwards, ROC-AUC is ${f3(ts.roc_auc)}, as good as on the random split, and F1 barely changes. But recall drops to ${f3(ts.recall)}, and the probabilities are slightly low: ${pct(ts.mean_predicted)} predicted against ${pct(ts.actual_rate)} actual. Per launch year the random-split model is off by up to about four points, because without launch year it predicts the average of all years. Conclusion: recalibrate on the newest data before any real use.` : "Time split not computed in this run.",
  });
  if (ts) {
    kpi(pres, s, { x: M, y: 1.95, w: 3.6, h: 2.15, value: f3(ts.roc_auc), label: "ROC-AUC, 2016+", sub: `random split: ${f3(fin.test.roc_auc)}` });
    kpi(pres, s, { x: M, y: 4.3, w: 3.6, h: 2.15, value: `${pct(ts.mean_predicted)} vs ${pct(ts.actual_rate)}`, label: "predicted vs actual", sub: `recall ${f3(ts.recall)} (random split ${f3(fin.test.recall)})`, color: C.accent2 });
  }
  s.addChart(pres.charts.BAR, [
    { name: "Predicted", labels: cy.map((y) => String(y.year)), values: cy.map((y) => y.predicted) },
    { name: "Actually funded", labels: cy.map((y) => String(y.year)), values: cy.map((y) => y.actual) },
  ], L.chartBase({
    x: 4.6, y: 1.75, w: 8.13, h: 4.95, barDir: "col", barGrouping: "clustered", barGapWidthPct: 50,
    chartColors: [HEX.accent5, HEX.accent6], showLegend: true, legendPos: "t", legendFontFace: "+mn-lt", legendFontSize: 13, legendColor: HEX.dk1,
    dataLabelFormatCode: "0%", dataLabelFontSize: 10, dataLabelPosition: "outEnd", valAxisMinVal: 0, valAxisMaxVal: 0.55, objectName: "Calibration by launch year",
  }));

  const bc = results.by_category_test;
  s = L.slideOn(pres, "Content", S[4], {
    kicker: "Error analysis",
    title: "Probabilities hold in every segment; the label does not",
    source: "Test set · ROC-AUC within each main category (overall " + f3(fin.test.roc_auc) + ") · axis starts at 0.60",
    notes: `Within every category, the mean predicted probability is within about one and a half points of the actual rate, so the probabilities are calibrated by segment too. Ranking quality within a category ranges from ${f3(bc[0].roc_auc)} in ${bc[0].name} to ${f3(bc[bc.length - 1].roc_auc)} in ${bc[bc.length - 1].name}; most are below the overall score because part of the overall ranking comes from the category itself. The yes/no label is a weak spot: it marks over 90 percent of Theater and Dance projects as promising while about 60 percent are funded, and by goal it behaves almost like a hard goal rule. Hence: show the probability.`,
  });
  L.bars(pres, s, { x: M, y: 1.75, w: 7.4, h: 5.05, fmt: "0.00", labels: bc.map((c) => c.name), values: bc.map((c) => c.roc_auc), colors: bc.map((c) => (c.roc_auc >= fin.test.roc_auc ? HEX.accent1 : HEX.accent6)), min: 0.6, name: "ROC-AUC within category" });
  const gt = results.by_goal_test;
  table(pres, s, ["segment", "funded", "predicted", "labelled"], [
    ["Theater", pct(bc.find((c) => c.name === "Theater").actual), pct(bc.find((c) => c.name === "Theater").predicted), { text: pct(bc.find((c) => c.name === "Theater").labelled), options: { color: C.accent2, bold: true } }],
    ["Dance", pct(bc.find((c) => c.name === "Dance").actual), pct(bc.find((c) => c.name === "Dance").predicted), { text: pct(bc.find((c) => c.name === "Dance").labelled), options: { color: C.accent2, bold: true } }],
    ["Goal ≤ $1k", pct(gt[0].actual), pct(gt[0].predicted), { text: pct(gt[0].labelled), options: { color: C.accent2, bold: true } }],
    ["Goal > $100k", pct(gt[7].actual), pct(gt[7].predicted), { text: pct(gt[7].labelled), options: { color: C.accent2, bold: true } }],
  ], { x: 8.4, y: 1.95, w: 4.33, colW: [1.45, 0.96, 1.0, 0.92], rowH: 0.55, fontSize: 13 });
  L.text(s, "Predicted matches funded everywhere; the yes/no label over-calls easy segments and under-calls big goals.", { x: 8.4, y: 4.95, w: 4.33, h: 1.3, fontSize: 14, color: C.text1 });

  const imp = results.importance;
  if (imp) {
    const nice = { category: "Sub-category", log_goal: "Funding goal", duration_days: "Campaign length", name_words: "Title words", country: "Country", launch_weekday: "Launch weekday", name_length: "Title length", launch_month: "Launch month" };
    s = L.slideOn(pres, "Content", S[4], {
      kicker: "What the model uses",
      title: "Category and goal carry the prediction",
      source: "Permutation importance: drop in test ROC-AUC when one feature is shuffled (20,000 test projects, 5 repeats)",
      notes: `Permutation importance shuffles one feature at a time and measures how much ROC-AUC drops. The sub-category matters most, ${imp[0].mean}, followed by the goal, ${imp[1].mean}, and campaign length, ${imp[2].mean}. Title words and country add a little; weekday, title length and month add almost nothing. Partial dependence shows the direction: the probability falls steadily with the goal, while for duration it shows sharp dips at round numbers. Importance means the model relies on a feature, not that changing it changes the outcome.`,
    });
    L.bars(pres, s, { x: M, y: 1.75, w: 8.0, h: 5.0, fmt: "0.000", labels: imp.map((f) => nice[f.feature] || f.feature), values: imp.map((f) => f.mean), colors: imp.map((_, i) => (i < 3 ? HEX.accent1 : HEX.accent4)), name: "Permutation importance" });
    L.card(pres, s, { x: 9.0, y: 1.95, w: 3.73, h: 4.5, fill: C.background2, name: "direction notes", shadow: false });
    L.text(s, "Direction (partial dependence)", { x: 9.3, y: 2.2, w: 3.2, h: 0.75, fontSize: 17, bold: true, color: C.text2 });
    bulletList(s, ["Goal: probability falls steadily as the goal rises", "Length: low under ~10 days, highest at 3–6 weeks, sharp dips at round numbers", "Reliance, not cause"], { x: 9.3, y: 3.05, w: 3.2, h: 3.2, fontSize: 14, color: C.text1 });
  }

  const ex = results.example;
  s = L.slideOn(pres, "Content", S[4], {
    kicker: "Product decision",
    title: "Why Launch Check gives no what-if advice",
    source: "US Tabletop Games, $10,000 goal, launched on a Tuesday in March, 6-word title · saved model",
    notes: `A what-if feature is tempting: change one input, see the chance move. But look: the same board game moves from ${pct(ex.probability)} to ${pct(ex.what_if[0].probability)} with 29 days, ${pct(ex.what_if[1].probability)} with 31 days, and ${pct(ex.what_if[2].probability)} with a Sunday launch. Those swings follow past creator behaviour, like round numbers and launch habits, not effects a creator could get. So Launch Check shows only the estimate. If a what-if is ever added, it should be limited to the goal, use a monotonic constraint so the curve cannot wiggle, and carry an association-not-effect warning. Cross-check: ${int(ex.similar_projects)} similar past projects were funded ${pct(ex.similar_rate)} of the time.`,
  });
  table(pres, s, ["scenario", "predicted chance"], [
    [{ text: "As planned: 30 days, Tuesday", options: { bold: true } }, { text: pct(ex.probability, 1), options: { bold: true } }],
    ...ex.what_if.map((w) => [w.label, { text: pct(w.probability, 1), options: { color: C.accent2, bold: true } }]),
  ], { x: M, y: 1.95, w: 6.4, colW: [4.2, 2.2], rowH: 0.65, fontSize: 16 });
  L.text(s, `Cross-check: similar past projects (Tabletop Games, $7.5k–15k, exactly 30 days): ${int(ex.similar_projects)}, of which ${pct(ex.similar_rate)} were funded.`, { x: M, y: 5.6, w: 6.4, h: 0.8, fontSize: 14, color: C.accent4 });
  L.card(pres, s, { x: 7.53, y: 1.95, w: 5.2, h: 4.5, name: "decision card" });
  await L.iconCircle(pres, s, FaTriangleExclamation, { x: 7.88, y: 2.25, d: 0.8, fill: C.background2, iconHex: HEX.accent2, name: "warning" });
  L.text(s, "Show the estimate only", { x: 8.88, y: 2.35, w: 3.6, h: 0.6, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
  bulletList(s, [
    "One-day changes swing the estimate by 10 to 20 points",
    "They reflect who picks those settings, not what the setting does",
    "If ever added: goal only, monotonic_cst, explicit warning",
  ], { x: 7.88, y: 3.35, w: 4.55, h: 2.9, fontSize: 15, color: C.text1 });

  // ===== Wrap-up ===========================================================================
  pres.addSection({ title: S[5] });
  s = L.slideOn(pres, "Content", S[5], {
    kicker: "Two approaches",
    title: "Main analysis vs. the alternative notebook",
    source: "Alternative: notebooks/reference/alt_approach_excluding_canceled.ipynb · its scores use a different target and rows, so they are not directly comparable",
    notes: `The repository also keeps an alternative notebook built in parallel. It drops canceled projects instead of counting them as not funded, which gives 331,675 projects and a 40 percent success rate, and it uses launch year and hour as features. Its test ROC-AUC is 0.765, but on an easier target, so the numbers are not directly comparable. Two of its ideas are worth adopting: a monotonic constraint on the goal, which cost only about 0.001 ROC-AUC, and a TF-IDF model on the title, which raised 3-fold CV ROC-AUC from 0.765 to 0.782 there. We kept the main analysis because it answers the creator's real question, gets the money or not, and avoids launch year.`,
  });
  table(pres, s, ["", "Main analysis (this deck)", "Alternative notebook"], [
    [{ text: "Canceled / suspended", options: { bold: true } }, "counted as not funded", "dropped"],
    [{ text: "Projects · funded", options: { bold: true } }, `${int(d.clean_rows)} · ${pct(avg)}`, "331,675 · 40%"],
    [{ text: "Launch year as feature", options: { bold: true } }, "no (future campaigns)", "yes, plus launch hour"],
    [{ text: "Test ROC-AUC", options: { bold: true } }, f3(fin.test.roc_auc), "0.765 (easier target)"],
    [{ text: "Extra checks", options: { bold: true } }, "calibration by year, time split, what-if audit", "monotonic goal constraint"],
    [{ text: "Idea to adopt", options: { bold: true } }, "–", "TF-IDF on title: CV ROC-AUC 0.765 → 0.782"],
  ], { x: M, y: 1.9, w: W - 2 * M, colW: [3.0, 4.6, 4.53], rowH: 0.62, fontSize: 15 });

  s = L.slideOn(pres, "Content (tint)", S[5], {
    kicker: "Limitations & constraints",
    title: "What to fix before real use",
    source: "Recalibration: CalibratedClassifierCV(FrozenEstimator(model), method=\"isotonic\") on the newest year, checked on a later slice",
    notes: `The limits: the model finds associations, not causes. It cannot see content, the creator's network or marketing, which explains many errors. The data ends in early ${d.last_year}, and per-year calibration is off by up to four points. The yes/no label is generous. The next steps follow directly: refresh and recalibrate on recent data, add title text and creator history, offer at most a goal-only what-if with a monotonic constraint, and deploy Launch Check with calibration monitoring.`,
  });
  const lim = [
    [FaScaleBalanced, "Associations, not causes", "No what-if advice; round-number dips are behaviour"],
    [FaUserSlash, "Blind spots", "No video, rewards, creator network or marketing"],
    [FaClock, "Old data", `Ends early ${d.last_year}; per-year calibration off by up to ~4 points`],
    [FaTags, "Generous label", `${pct(fin.test.share_labelled)} labelled promising vs ${pct(avg)} funded`],
  ];
  const nxt = [
    [FaRotate, "Refresh and recalibrate", "Add recent projects; isotonic recalibration"],
    [FaFont, "Add text", "TF-IDF on title and description (+0.017 CV AUC seen)"],
    [FaUserCheck, "Add creator history", "Past launches, backers, rewards"],
    [FaSliders, "Goal-only what-if", "monotonic_cst on log_goal, with a warning"],
    [FaServer, "Deploy and monitor", "Launch Check as a web tool; track calibration drift"],
  ];
  L.text(s, "Limits", { x: M, y: 1.75, w: 5.8, h: 0.45, fontSize: 20, bold: true, color: C.accent2 });
  for (const [i, [Icon, head, body]] of lim.entries()) {
    const y = 2.3 + i * 1.0;
    await L.iconCircle(pres, s, Icon, { x: M, y, d: 0.7, fill: C.background1, iconHex: HEX.accent2, name: head });
    L.text(s, head, { x: M + 0.95, y: y - 0.02, w: 4.9, h: 0.38, fontSize: 16, bold: true, color: C.text2 });
    L.text(s, body, { x: M + 0.95, y: y + 0.36, w: 4.9, h: 0.38, fontSize: 13, color: C.text1 });
  }
  L.text(s, "Before real use", { x: 6.93, y: 1.75, w: 5.8, h: 0.45, fontSize: 20, bold: true, color: C.accent1 });
  for (const [i, [Icon, head, body]] of nxt.entries()) {
    const y = 2.3 + i * 0.86;
    await L.iconCircle(pres, s, Icon, { x: 6.93, y, d: 0.62, fill: C.background1, iconHex: HEX.accent1, name: head });
    L.text(s, head, { x: 7.8, y: y - 0.04, w: 4.9, h: 0.36, fontSize: 16, bold: true, color: C.text2 });
    L.text(s, body, { x: 7.8, y: y + 0.32, w: 4.9, h: 0.36, fontSize: 13, color: C.text1 });
  }

  s = L.slideOn(pres, "Content", S[5], {
    kicker: "Reproduce it",
    title: "Everything runs locally in five commands",
    source: "Requires uv (Python 3.13) · decks need Node.js 18+ · see README.md",
    notes: `Everything in this deck can be reproduced on a laptop. uv sync installs the exact environment. kickstarter-download fetches the Kaggle file. kickstarter-train cleans the data, trains the final model and writes reports/results.json, which both decks read. kickstarter-check scores a planned campaign from the command line. make slides rebuilds both PowerPoint decks from the fresh numbers, and pytest runs the tests on synthetic data.`,
  });
  const cmds = [
    ["uv sync", "install Python 3.13 and pinned packages"],
    ["uv run kickstarter-download", "fetch ks-projects-201801.csv into data/"],
    ["uv run kickstarter-train", "clean, train, evaluate → models/ and reports/results.json"],
    ['uv run kickstarter-check --category "Tabletop Games" --goal 10000 --days 30', "score a planned campaign"],
    ["make slides", "rebuild both decks from reports/results.json"],
  ];
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.9, w: W - 2 * M, h: 4.5, rectRadius: 0.12, fill: { color: C.text2 }, line: { type: "none" }, objectName: "terminal" });
  for (const [i, [cmd, what]] of cmds.entries()) {
    const y = 2.2 + i * 0.82;
    L.text(s, `$ ${cmd}`, { x: M + 0.4, y, w: W - 2 * M - 0.8, h: 0.4, fontSize: 16, color: C.background1, fontFace: "Courier New", bold: true });
    L.text(s, `# ${what}`, { x: M + 0.4, y: y + 0.38, w: W - 2 * M - 0.8, h: 0.35, fontSize: 13, color: C.accent5, fontFace: "Courier New" });
  }

  s = L.slideOn(pres, "Title (dark)", S[5], {
    notes: "Thank you. Happy to go deeper into any step: the cleaning, the leakage checks, the model choice or the calibration.",
  });
  L.text(s, "Thank you for your attention.", { x: M, y: 2.6, w: W - 2 * M, h: 1.2, fontSize: 48, bold: true, color: C.background1, align: "center", valign: "middle", fontFace: L.THEME.headFontFace, fit: "shrink" });
  L.text(s, "Questions?", { x: M, y: 3.9, w: W - 2 * M, h: 0.8, fontSize: 32, bold: true, color: C.accent1, align: "center", valign: "middle", fontFace: L.THEME.headFontFace });

  await pres.writeFile({ fileName: file });
  await L.applyTheme(file);
  return file;
}

module.exports = { buildTechnical };
