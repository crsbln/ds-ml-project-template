// Client deck: business look, short, visual, no jargon (KISS). One message per slide.
// Same 16 slides as the HTML deck in crsbln/ds-ml-slides.

const { FaClipboardList, FaMicrochip, FaPercent, FaFilter, FaEyeSlash, FaLock, FaLightbulb, FaTrophy } = require("react-icons/fa6");
const L = require("./lib");
const SCRIPT = require("./script.json"); // presenter script: also builds PRESENTER_CHEATSHEET.md / presenter.html

const { HEX, W, H, M, pct, int, of100 } = L;
const SOURCE = "Source: 372,293 finished Kickstarter campaigns, 2009 to early 2018 (Kaggle dataset)";
const TEAM = ["Kashif Kazmi", "Furkan Yurttepe", "Christian Balan"];
// All three of us are AIPM (AI Project Management); the roles are each person's focus in this project
const MEMBERS = [
  ["KK", "Kashif Kazmi", "Project Manager", "Plans the milestones, runs the Kanban board and keeps the team on track."],
  ["FY", "Furkan Yurttepe", "Data Scientist", "Cleans and explores the data and builds the prediction model."],
  ["CB", "Christian Balan", "Design Thinker", "Frames the creator's problem and turns the findings into a clear story."],
];
const FEATURE_NAMES = { category: "Category", log_goal: "Funding goal", duration_days: "Campaign length", name_words: "Words in title", country: "Country", launch_weekday: "Launch weekday", name_length: "Title length", launch_month: "Launch month" };

// Computed from the cleaned data (not in results.json):
const TECH_MEDIAN_GOAL = { funded: 10000, notFunded: 20200 }; // Technology, median goal by outcome
const LEAK_RULE_MATCH = 0.997;
const GOAL_RULE_AUC = 0.6365; // "smaller goal = more likely" as a score, 5-fold cross-validation like the models // share of outcomes where "pledged >= goal" equals the label

const RED = "FF6B6B";
const GREY = "C9CFCC";
const GREEN_SOFT = "E4F8EE";

async function buildClient(results, file) {
  L.useTheme("business");
  try {
    return await build(results, file);
  } finally {
    L.useTheme("funded");
  }
}

async function build(results, file) {
  const pres = L.newDeck({ title: "Will your Kickstarter project get funded?", subject: "Client presentation" });
  // every slide's speaker notes come from script.json, in slide order
  let slideNo = 0;
  const slideOn = (p, layout, section, opts) => {
    const sc = SCRIPT[slideNo++];
    const notes = `${sc.say}\n\nIf asked:\n${sc.backup.map((b) => `- ${b}`).join("\n")}`;
    return L.slideOn(p, layout, section, { ...opts, notes });
  };
  const C = pres.SchemeColor;
  const d = results.data;
  const eda = results.eda;
  const funded = of100(d.success_rate);
  const HF = L.THEME.headFontFace;
  const S1 = "Introduction";
  const S2 = "What matters";
  const S3 = "Launch Check";
  const S4 = "What to do";
  const cw = 3.75;
  const cgap = (W - 2 * M - 3 * cw) / 2;
  const plain = (pres, slide, opts) => L.card(pres, slide, { shadow: false, ...opts });

  // 1 · Cover ----------------------------------------------------------------------------
  pres.addSection({ title: S1 });
  let s = slideOn(pres, "Title (dark)", S1, {
    kicker: "Crowdfunding · Launch Check",
    title: "Will your Kickstarter project get funded?",
    byline: `${TEAM.join(" · ")} · October 2026`,
    notes: `Welcome. Every creator asks the same question before launch: will my project get funded? We looked at ${int(d.clean_rows)} past Kickstarter campaigns to answer it with data, and built a simple check that gives a creator an honest chance before launch day.`,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.35, w: 0.9, h: 0.09, rectRadius: 0.045, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "accent rule" });
  L.text(s, "1", { x: W - M - 0.6, y: H - 0.5, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: "right", valign: "middle" });

  // 2 · Team (Kashif's slide) ----------------------------------------------------------
  s = slideOn(pres, "Content", S1, {
    kicker: "Who we are",
    title: "Our team",
    notes: "We are a team of three, all AIPM, AI Project Management. In this project each of us had a focus. Kashif Kazmi is our project manager, who planned the milestones, ran our Kanban board and kept the team on track. Furkan Yurttepe is our data scientist, who cleaned and explored the data and built the prediction model. Christian Balan is our design thinker, who framed the problem from the creator's point of view and shaped the story you will hear.",
  });
  for (const [i, [initials, name, role, desc]] of MEMBERS.entries()) {
    const x = M + i * (cw + cgap);
    plain(pres, s, { x, y: 2.1, w: cw, h: 3.0, name: `${name} card` });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.1, w: cw, h: 0.07, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `${name} accent` });
    s.addShape(pres.shapes.OVAL, { x: x + 0.4, y: 2.5, w: 1.1, h: 1.1, fill: { color: GREEN_SOFT }, line: { type: "none" }, objectName: `${name} avatar` });
    L.text(s, initials, { x: x + 0.4, y: 2.5, w: 1.1, h: 1.1, fontSize: 24, bold: true, color: C.accent6, align: "center", valign: "middle" });
    L.text(s, name, { x: x + 0.4, y: 3.85, w: cw - 0.8, h: 0.5, fontSize: 22, bold: true, color: C.text1 });
    L.text(s, `${role}, AIPM`, { x: x + 0.4, y: 4.35, w: cw - 0.8, h: 0.35, fontSize: 15, bold: true, color: C.accent6 });
  }

  // 3 · Approach: show the plan and the chance -----------------------------------------
  const ex0 = results.example;
  s = slideOn(pres, "Content", S1, {
    kicker: "Our approach",
    title: "How likely is a campaign to get funded?",
    notes: `Our approach in three steps. One: we learn from the past, all ${int(d.clean_rows)} finished campaigns. Two: a creator enters the plan, only what is known before launch: goal, category, country, length, launch day and the title, here “Heroes of the Frozen Northern Isles”. Three: the creator gets an honest chance of funding. For this board game it is ${pct(ex0.probability)}, above average.`,
  });
  const heads = ["We learn from the past", "You enter your plan", "You get your chance"];
  for (const [i, head] of heads.entries()) {
    const x = M + i * (cw + cgap);
    plain(pres, s, { x, y: 2.35, w: cw, h: 4.2, fill: C.background2, name: `step ${i + 1}` });
    s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: 2.6, w: 0.55, h: 0.55, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `step ${i + 1} number` });
    L.text(s, `${i + 1}`, { x: x + 0.35, y: 2.6, w: 0.55, h: 0.55, fontSize: 17, bold: true, color: C.background1, align: "center", valign: "middle" });
    L.text(s, head, { x: x + 0.35, y: 3.3, w: cw - 0.7, h: 0.45, fontSize: 20, bold: true, color: C.text1 });
    if (i < 2) L.text(s, "›", { x: x + cw, y: 2.55, w: cgap, h: 0.6, fontSize: 30, bold: true, color: C.accent6, align: "center", valign: "middle" });
  }
  // 1: the data
  L.text(s, int(d.clean_rows), { x: M + 0.35, y: 3.95, w: cw - 0.7, h: 0.9, fontSize: 44, bold: true, color: C.accent6, fontFace: HF });
  L.text(s, "past campaigns", { x: M + 0.35, y: 4.85, w: cw - 0.7, h: 0.5, fontSize: 15, color: C.accent4 });
  // 2: the plan as input fields
  const chips = [["Goal", `$${int(ex0.goal_usd)}`], ["Category", ex0.category], ["Country", ex0.country], ["Length", `${ex0.duration_days} days`], ["Launch day", "Tuesday"], ["Title", "“Heroes of the Frozen Northern Isles”"]];
  const x2 = M + cw + cgap + 0.35;
  const chw = (cw - 0.7 - 0.12) / 2;
  for (const [i, [k, v]] of chips.entries()) {
    // two per row for the short fields, launch day and title get a row each
    const wide = i >= 4;
    const cx = wide ? x2 : x2 + (i % 2) * (chw + 0.12);
    const cy = 3.85 + (wide ? 2 + (i - 4) : Math.floor(i / 2)) * 0.67;
    const w = wide ? cw - 0.7 : chw;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w, h: 0.58, rectRadius: 0.06, fill: { color: C.background1 }, line: { color: "E1E5E3", width: 1 }, objectName: `plan ${k}` });
    L.text(s, k.toUpperCase(), { x: cx + 0.12, y: cy + 0.05, w: w - 0.2, h: 0.22, fontSize: 8, bold: true, color: C.accent4, charSpacing: 1 });
    L.text(s, v, { x: cx + 0.12, y: cy + 0.26, w: w - 0.2, h: 0.3, fontSize: 12, bold: true, color: C.text1 });
  }
  // 3: the chance as a ring
  const x3 = M + 2 * (cw + cgap) + 0.35;
  s.addChart(pres.charts.DOUGHNUT, [{ name: "chance", labels: ["funded", "rest"], values: [ex0.probability, 1 - ex0.probability] }], {
    x: x3 - 0.1, y: 3.8, w: 1.9, h: 1.9, holeSize: 72, chartColors: [HEX.accent1, "E1E5E3"], showLegend: false, showValue: false, showLabel: false, showPercent: false, showTitle: false, dataBorder: { pt: 0, color: "FFFFFF" }, objectName: "chance ring",
  });
  L.text(s, pct(ex0.probability), { x: x3 - 0.1, y: 3.8, w: 1.9, h: 1.9, fontSize: 26, bold: true, color: C.accent6, align: "center", valign: "middle", fontFace: HF });
  L.text(s, "chance of funding", { x: x3 + 1.9, y: 4.3, w: cw - 2.3, h: 0.9, fontSize: 14, color: C.accent4, valign: "middle" });

  // 4 · Problem --------------------------------------------------------------------------
  s = slideOn(pres, "Content", S1, {
    kicker: "The problem",
    title: "~1/3 of all projects get funded",
    notes: `Kickstarter is all or nothing. If you miss your goal, even by one dollar, you get nothing. And most campaigns miss: out of every 100, only ${funded} got funded. The other ${100 - funded} got nothing back for weeks of work.`,
  });
  const dot = 0.36;
  const gap = 0.1;
  for (let i = 0; i < 100; i++) {
    s.addShape(pres.shapes.OVAL, {
      x: M + (i % 10) * (dot + gap), y: 1.95 + Math.floor(i / 10) * (dot + gap), w: dot, h: dot,
      fill: { color: i < funded ? HEX.accent1 : GREY }, line: { type: "none" }, objectName: `dot ${i + 1}`,
    });
  }
  // quiet bracket under the dots: 100 in total
  const gx0 = M, gx1 = M + 9 * (dot + gap) + dot, gy = 1.95 + 10 * (dot + gap) + 0.02;
  s.addShape(pres.shapes.LINE, { x: gx0, y: gy + 0.08, w: gx1 - gx0, h: 0, line: { color: "C3C9C6", width: 1 }, objectName: "bracket" });
  s.addShape(pres.shapes.LINE, { x: gx0, y: gy, w: 0, h: 0.08, line: { color: "C3C9C6", width: 1 }, objectName: "bracket left" });
  s.addShape(pres.shapes.LINE, { x: gx1, y: gy, w: 0, h: 0.08, line: { color: "C3C9C6", width: 1 }, objectName: "bracket right" });
  L.text(s, "100", { x: (gx0 + gx1) / 2 - 0.4, y: gy + 0.12, w: 0.8, h: 0.25, fontSize: 9, bold: true, color: "9AA5A0", align: "center" });
  L.text(s, [{ text: `${funded}  `, options: { fontSize: 72, bold: true, color: C.accent6 } }, { text: "got funded", options: { fontSize: 36, bold: true, color: C.text1 } }], { x: 6.3, y: 2.3, w: 6.6, h: 1.4, valign: "middle", fontFace: HF });
  L.text(s, [{ text: `${100 - funded}  `, options: { fontSize: 72, bold: true, color: "A9B1AD" } }, { text: "not funded", options: { fontSize: 36, bold: true, color: C.accent4 } }], { x: 6.3, y: 3.9, w: 6.6, h: 1.4, valign: "middle", fontFace: HF });

  // 5 · Goal -----------------------------------------------------------------------------
  pres.addSection({ title: S2 });
  const goal = eda.by_goal;
  const goalLabels = ["Up to $1k", "$1k to $2.5k", "$2.5k to $5k", "$5k to $10k", "$10k to $25k", "$25k to $50k", "$50k to $100k", "Over $100k"];
  s = slideOn(pres, "Content", S2, {
    kicker: "Finding 1 · The goal",
    title: "Smaller goals get funded far more often",
    notes: `Our first finding is about money. Campaigns that asked for up to one thousand dollars were funded ${pct(goal[0].rate)} of the time, about one in two. Campaigns asking for more than one hundred thousand dollars were funded only ${pct(goal[7].rate)} of the time. Every time the goal doubles, the odds drop a step. Ask for what you truly need, and use stretch goals for the extras.`,
  });
  L.bars(pres, s, { x: M, y: 1.75, w: 7.7, h: 5.0, labels: goalLabels, values: goal.map((g) => g.rate), colors: goal.map(() => HEX.accent1), name: "Share funded by funding goal", dataLabelFontBold: true, dataLabelFontSize: 14, catAxisLabelFontSize: 14 });
  plain(pres, s, { x: 8.75, y: 2.0, w: 3.98, h: 4.5, fill: C.background2, name: "goal box" });
  L.text(s, pct(goal[0].rate), { x: 9.1, y: 2.25, w: 3.4, h: 0.95, fontSize: 54, bold: true, color: C.accent6, fontFace: HF });
  L.text(s, "funded · goal up to $1k", { x: 9.1, y: 3.2, w: 3.4, h: 0.5, fontSize: 16, color: C.accent4 });
  L.text(s, pct(goal[7].rate), { x: 9.1, y: 3.9, w: 3.4, h: 0.95, fontSize: 54, bold: true, color: C.accent2, fontFace: HF });
  L.text(s, "funded · goal over $100k", { x: 9.1, y: 4.85, w: 3.4, h: 0.5, fontSize: 16, color: C.accent4 });

  // 6 · Category (Kashif's layout) -------------------------------------------------------
  const cats = eda.by_main_category;
  const top = cats[0];
  const bottom = cats[cats.length - 1];
  s = slideOn(pres, "Content", S2, {
    kicker: "Finding 2 · The category",
    title: `Arts beat tech: ${top.name} ${pct(top.rate)}, ${bottom.name} ${pct(bottom.rate)}`,
    notes: `Our second finding: what you make matters. ${top.name} campaigns were funded ${pct(top.rate)} of the time, ${bottom.name} only ${pct(bottom.rate)}. Why does tech struggle? Tech campaigns ask for far more money: a typical successful one asked for $${int(TECH_MEDIAN_GOAL.funded)}, a failed one about $${int(TECH_MEDIAN_GOAL.notFunded)}. Arts projects often have a loyal community behind them. If you are in a tough category, build your audience before you launch.`,
  });
  L.bars(pres, s, { x: M, y: 1.7, w: 8.0, h: 5.15, labels: cats.map((c) => c.name), values: cats.map((c) => c.rate), colors: cats.map(() => HEX.accent1), name: "Share funded by main category", dataLabelFontBold: true, dataLabelFontSize: 13, catAxisLabelFontSize: 13 });
  plain(pres, s, { x: 8.95, y: 2.1, w: 3.78, h: 2.6, fill: C.background2, name: "why tech struggles box" });
  L.text(s, "Why tech struggles", { x: 9.3, y: 2.5, w: 3.1, h: 0.5, fontSize: 20, bold: true, color: C.accent4 });
  L.text(s, "Goals too high.", { x: 9.3, y: 3.1, w: 3.2, h: 1.2, fontSize: 34, bold: true, color: C.text1, fontFace: HF });

  // 7 · Length: 30 vs 60 days ------------------------------------------------------------
  const r30 = eda.round_lengths.find((r) => r.days === 30);
  const r60 = eda.round_lengths.find((r) => r.days === 60);
  s = slideOn(pres, "Content", S2, {
    kicker: "Finding 3 · The length",
    title: "The 30-day default and 60 days do worst",
    notes: `Our third finding surprised us. Most creators keep the default of exactly 30 days: ${int(r30.projects)} campaigns, almost half of all. Only ${pct(r30.round)} of them got funded, while 29-day campaigns reached ${pct(r30.before)} and 31-day campaigns ${pct(r30.after)}. The same happens at 60 days, the maximum: only ${pct(r60.round)} funded, against ${pct(r60.before)} at 59 days and ${pct(r60.after)} at 61 days. One day cannot change who backs you, so this is most likely a sign of planning. Do not pick a number because it is round, pick an end date for a reason.`,
  });
  const vw = (W - 2 * M - 0.4) / 2;
  for (const [i, [head, share, r, days]] of [
    ["30 days · the default", `${pct(r30.projects / d.clean_rows)} of all campaigns`, r30, [29, 30, 31]],
    ["60 days · the maximum", `${pct(r60.projects / d.clean_rows)} of all campaigns`, r60, [59, 60, 61]],
  ].entries()) {
    const x = M + i * (vw + 0.4);
    plain(pres, s, { x, y: 1.75, w: vw, h: 4.25, name: `${head} card` });
    L.text(s, head, { x: x + 0.3, y: 1.95, w: vw - 0.6, h: 0.45, fontSize: 20, bold: true, color: C.text1 });
    L.text(s, share, { x: x + 0.3, y: 1.98, w: vw - 0.6, h: 0.45, fontSize: 13, color: C.accent4, align: "right" });
    L.bars(pres, s, {
      x: x + 0.3, y: 2.5, w: vw - 0.6, h: 3.35, horizontal: false,
      labels: days.map((n) => `${n} days`), values: [r.before, r.round, r.after],
      colors: [HEX.accent1, HEX.accent2, HEX.accent1], name: `Share funded around ${days[1]} days`,
      dataLabelFontBold: true, dataLabelFontSize: 20, catAxisLabelFontSize: 15, valAxisMaxVal: 0.55, barGapWidthPct: 60,
    });
  }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.15, w: W - 2 * M, h: 0.6, rectRadius: 0.1, fill: { color: GREEN_SOFT }, line: { type: "none" }, objectName: "takeaway" });
  L.text(s, [
    { text: "Round number = weakest result.", options: { bold: true, color: C.accent6 } },
  ], { x: M + 0.3, y: 6.15, w: W - 2 * M - 0.6, h: 0.6, fontSize: 17, color: C.text1, valign: "middle" });

  // 8 · The trap -------------------------------------------------------------------------
  s = slideOn(pres, "Content (dark)", S2, {
    kicker: "A key step",
    title: "The trap: data from the future",
    notes: `A key step in building the model. The data also holds the money pledged and the number of backers. A model that uses them is right ${pct(LEAK_RULE_MATCH, 1)} of the time, because "pledged at least the goal" simply is the definition of funded. That is like calling a football match after the final whistle. On launch day that money does not exist yet, so we removed both columns and only use what is known on launch day.`,
  });
  // drawn like the HTML: "you are here" at launch, everything to the right is the future
  const tx = (v) => M + (v / 1000) * (W - 2 * M);   // HTML viewBox x -> inches
  const ty = (v) => 1.75 + (v / 330) * 4.9;         // HTML viewBox y -> inches
  const tw = (v) => (v / 1000) * (W - 2 * M);
  const th = (v) => (v / 330) * 4.9;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: tx(372), y: ty(0), w: tw(628), h: th(330), rectRadius: 0.15, fill: { color: RED, transparency: 92 }, line: { color: RED, width: 1, dashType: "dash", transparency: 50 }, objectName: "future zone" });
  L.text(s, "THE FUTURE", { x: tx(700), y: ty(14), w: tw(280), h: 0.35, fontSize: 13, bold: true, color: "FF8A8A", charSpacing: 3, align: "right" });
  L.text(s, "✓  WHAT WE USE", { x: tx(30), y: ty(14), w: 4, h: 0.35, fontSize: 13, bold: true, color: C.accent1, charSpacing: 2 });
  for (const [i, label] of ["Goal", "Category", "Country", "Length"].entries()) {
    const x = tx(30 + (i % 2) * 162), y = ty(58 + Math.floor(i / 2) * 62);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: tw(150), h: th(50), rectRadius: 0.08, fill: { color: "133A2A" }, line: { color: HEX.accent1, width: 1.25 }, objectName: `${label} chip` });
    L.text(s, label, { x, y, w: tw(150), h: th(50), fontSize: 17, bold: true, color: C.background1, align: "center", valign: "middle" });
  }
  for (const [i, label] of ["Money pledged", "Number of backers"].entries()) {
    const x = tx(640), y = ty(74 + i * 62);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: tw(300), h: th(50), rectRadius: 0.08, fill: { color: "3A2526" }, line: { color: RED, width: 1.25 }, objectName: `${label} chip` });
    L.text(s, label, { x, y, w: tw(300), h: th(50), fontSize: 17, bold: true, color: "FFB4B4", align: "center", valign: "middle", strike: "sngStrike" });
  }
  L.text(s, "✗  NOT USED", { x: tx(640), y: ty(200), w: tw(300), h: 0.35, fontSize: 13, bold: true, color: RED, charSpacing: 2, align: "center" });
  s.addShape(pres.shapes.LINE, { x: tx(30), y: ty(270), w: tw(946), h: 0, line: { color: "5A645F", width: 2.5, endArrowType: "triangle" }, objectName: "timeline" });
  s.addShape(pres.shapes.LINE, { x: tx(372), y: ty(0), w: 0, h: th(330), line: { color: HEX.accent1, width: 2.5 }, objectName: "now line" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: tx(304), y: ty(288), w: tw(136), h: th(34), rectRadius: 0.17, fill: { color: HEX.accent1 }, line: { type: "none" }, objectName: "you are here" });
  L.text(s, "YOU ARE HERE", { x: tx(304), y: ty(288), w: tw(136), h: th(34), fontSize: 10, bold: true, color: C.text2, align: "center", valign: "middle", charSpacing: 1 });
  s.addShape(pres.shapes.OVAL, { x: tx(372) - 0.13, y: ty(270) - 0.13, w: 0.26, h: 0.26, fill: { color: HEX.accent1 }, line: { type: "none" }, objectName: "launch marker" });
  s.addShape(pres.shapes.OVAL, { x: tx(790) - 0.13, y: ty(270) - 0.13, w: 0.26, h: 0.26, fill: { color: RED }, line: { type: "none" }, objectName: "end marker" });
  L.text(s, "Launch day", { x: tx(90), y: ty(240), w: tw(200), h: 0.35, fontSize: 15, bold: true, color: C.background1, align: "center" });
  L.text(s, "Campaign ends", { x: tx(690), y: ty(286), w: tw(200), h: 0.35, fontSize: 15, bold: true, color: C.background1, align: "center" });

  // 9 · How we built it: five big steps -------------------------------------------------
  pres.addSection({ title: S3 });
  s = slideOn(pres, "Content", S3, { kicker: "Our process", title: "How we built it" });
  const build = [[FaFilter, "", "Clean the data"], [FaEyeSlash, "", "Remove future data"], [FaLightbulb, "80%", "to train"], [FaLock, "20%", "for the test"], [FaTrophy, "", "Pick the best model"]];
  const bw = (W - 2 * M - 4 * 0.3) / 5;
  for (const [i, [Icon, big, label]] of build.entries()) {
    const x = M + i * (bw + 0.3);
    const dark = i === 4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.2, w: bw, h: 3.6, rectRadius: 0.14, fill: { color: dark ? C.text2 : C.background2 }, line: { type: "none" }, objectName: `step ${i + 1}` });
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: 2.5, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `step ${i + 1} number` });
    L.text(s, `${i + 1}`, { x: x + 0.3, y: 2.5, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: C.background1, align: "center", valign: "middle" });
    s.addImage({ data: await L.icon(Icon, dark ? HEX.accent1 : HEX.accent6), x: x + 0.3, y: 3.25, w: 0.65, h: 0.65, altText: label, objectName: `step ${i + 1} icon` });
    if (big) L.text(s, big, { x: x + 0.3, y: 4.0, w: bw - 0.5, h: 0.7, fontSize: 36, bold: true, color: C.text1, fontFace: HF });
    L.text(s, label, { x: x + 0.3, y: big ? 4.7 : 4.15, w: bw - 0.5, h: 0.9, fontSize: 18, bold: true, color: dark ? C.background1 : C.text1 });
    if (i < 4) L.text(s, "›", { x: x + bw, y: 3.6, w: 0.3, h: 0.6, fontSize: 26, bold: true, color: C.accent6, align: "center", valign: "middle" });
  }

  // 10 · Model comparison: graphic only (the speaker explains the score) ------------------
  s = slideOn(pres, "Content", S3, { kicker: "Model comparison", title: "Gradient boosting performed best" });
  const mc = Object.fromEntries(results.model_comparison.map((m) => [m.name, m.roc_auc]));
  const cmp = [["Gradient boosting", mc["Gradient Boosting"], HEX.accent1], ["Logistic regression", mc["Logistic Regression"], "B9C2BE"], ["Random forest", mc["Random Forest"], "B9C2BE"], ["Goal rule", GOAL_RULE_AUC, "DDE2DF"]];
  L.bars(pres, s, {
    x: M, y: 1.9, w: W - 2 * M - 1.2, h: 4.8, labels: cmp.map((c) => c[0]), values: cmp.map((c) => c[1]), colors: cmp.map((c) => c[2]),
    min: 0, fmt: "0.00", name: "Model comparison", dataLabelFontBold: true, dataLabelFontSize: 20, catAxisLabelFontSize: 18, valAxisMaxVal: 1, barGapWidthPct: 55,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: W - M - 1.05, y: 2.4, w: 0.95, h: 0.4, rectRadius: 0.06, fill: { color: HEX.accent1 }, line: { type: "none" }, objectName: "best badge" });
  L.text(s, "BEST", { x: W - M - 1.05, y: 2.4, w: 0.95, h: 0.4, fontSize: 13, bold: true, color: C.text2, align: "center", valign: "middle", charSpacing: 1 });

  // 11 · Can you trust it? One example, two equal rings ------------------------------------
  const b35 = results.calibration.bins.find((b) => Math.abs(b.predicted - 0.35) < 0.02);
  s = slideOn(pres, "Content", S3, { kicker: "Can you trust it?", title: `When we predict ${pct(b35.predicted)}, ${pct(b35.actual)} get funded` });
  const how = [[FaClipboardList, "Campaign plan", "", false], [FaMicrochip, "Our model", `learned from ${int(d.clean_rows)}`, true], [FaPercent, "Predicted chance", "", false]];
  const hw = [2.5, 3.6, 2.8];
  let hx = (W - (hw[0] + hw[1] + hw[2] + 2 * 0.6)) / 2;
  for (const [i, [Icon, label, sub, dark]] of how.entries()) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: hx, y: 1.6, w: hw[i], h: 0.75, rectRadius: 0.12, fill: { color: dark ? C.text2 : C.background2 }, line: { type: "none" }, objectName: `how ${i + 1}` });
    s.addImage({ data: await L.icon(Icon, dark ? HEX.accent1 : HEX.accent6), x: hx + 0.2, y: 1.78, w: 0.4, h: 0.4, altText: "", objectName: `how ${i + 1} icon` });
    L.text(s, sub ? [{ text: label, options: { bold: true, color: C.background1 } }, { text: `  ${sub}`, options: { color: "9AA7A0", fontSize: 11 } }] : label, { x: hx + 0.72, y: 1.6, w: hw[i] - 0.8, h: 0.75, fontSize: 15, bold: !sub, color: C.text1, valign: "middle" });
    hx += hw[i];
    if (i < 2) { L.text(s, "→", { x: hx, y: 1.6, w: 0.6, h: 0.75, fontSize: 22, bold: true, color: C.accent1, align: "center", valign: "middle" }); hx += 0.6; }
  }
  const rings = [["We predicted", b35.predicted, "B9C2BE", "7D8883"], ["Really got funded", b35.actual, HEX.accent1, HEX.accent6]];
  for (const [i, [label, v, ringHex, numHex]] of rings.entries()) {
    const rx = i === 0 ? 2.55 : 7.8;
    s.addChart(pres.charts.DOUGHNUT, [{ name: label, labels: ["share", "rest"], values: [v, 1 - v] }], {
      x: rx, y: 2.75, w: 2.8, h: 2.8, holeSize: 78, chartColors: [ringHex, "F5F7F6"], showLegend: false, showValue: false, showLabel: false, showPercent: false, showTitle: false, dataBorder: { pt: 0, color: "FFFFFF" }, objectName: `${label} ring`,
    });
    L.text(s, pct(v), { x: rx, y: 2.75, w: 2.8, h: 2.8, fontSize: 54, bold: true, color: numHex, align: "center", valign: "middle", fontFace: HF });
    L.text(s, label, { x: rx - 0.6, y: 5.7, w: 4.0, h: 0.5, fontSize: 20, bold: true, color: i === 0 ? C.accent4 : C.text1, align: "center" });
  }
  L.text(s, "=", { x: 5.6, y: 3.45, w: 2.1, h: 1.4, fontSize: 88, bold: true, color: C.text1, align: "center", valign: "middle", fontFace: HF });

  // 12 · What the model looks at (Kashif's slide, our numbers) ----------------------------
  const imp = results.importance;
  const impTop = imp[0].mean;
  s = slideOn(pres, "Content", S3, {
    kicker: "What the model looks at",
    title: "Category and goal drive the prediction",
    notes: "Which information does the model use most? We scrambled one piece of information at a time and measured how much worse the model got. The category and the funding goal are by far the most important, followed by the campaign length. Details like the title, the country or the launch date matter only a little.",
  });
  L.bars(pres, s, {
    x: M, y: 1.8, w: W - 2 * M, h: 5.0, labels: imp.map((f) => FEATURE_NAMES[f.feature] || f.feature),
    values: imp.map((f) => Math.round((f.mean / impTop) * 100)), colors: imp.map((_, i) => (i < 2 ? HEX.accent1 : GREY)),
    fmt: "0", name: "What the model looks at", dataLabelFontBold: true, dataLabelFontSize: 16, catAxisLabelFontSize: 16,
  });

  // 13 · Launch Check example -------------------------------------------------------------
  const ex = results.example;
  s = slideOn(pres, "Content", S3, {
    kicker: "The Launch Check",
    title: "A board game, checked before launch",
    notes: `Here is how it looks for a creator. A board game from the US, asking for ten thousand dollars over 30 days. The Launch Check says ${pct(ex.probability)}, which is above the ${funded}% average. That is a fair chance, not a sure thing. The check shows your starting odds; it does not tell you to change one detail to game the number.`,
  });
  plain(pres, s, { x: M, y: 1.95, w: 5.7, h: 4.6, name: "plan card" });
  L.text(s, "The plan", { x: M + 0.4, y: 2.2, w: 4.9, h: 0.5, fontSize: 22, bold: true, color: C.text1 });
  const inputs = [["Category", ex.category], ["Country", ex.country], ["Funding goal", `$${int(ex.goal_usd)}`], ["Campaign length", `${ex.duration_days} days`]];
  for (const [i, [k, v]] of inputs.entries()) {
    const y = 2.9 + i * 0.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.4, y, w: 4.9, h: 0.65, rectRadius: 0.08, fill: { color: C.background2 }, line: { type: "none" }, objectName: `input ${k}` });
    L.text(s, k, { x: M + 0.6, y, w: 2.2, h: 0.65, fontSize: 14, color: C.accent4, valign: "middle" });
    L.text(s, v, { x: M + 2.6, y, w: 2.5, h: 0.65, fontSize: 16, bold: true, color: C.text1, valign: "middle", align: "right" });
  }
  const rx = W - M - 5.7;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: rx, y: 1.95, w: 5.7, h: 4.6, rectRadius: 0.12, fill: { color: C.text2 }, line: { type: "none" }, objectName: "result card" });
  L.text(s, "Chance of funding", { x: rx + 0.4, y: 2.2, w: 4.9, h: 0.5, fontSize: 18, color: C.accent5 });
  L.text(s, pct(ex.probability), { x: rx + 0.4, y: 2.7, w: 4.9, h: 1.5, fontSize: 88, bold: true, color: C.accent1, fontFace: HF });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: rx + 0.4, y: 4.3, w: 2.4, h: 0.45, rectRadius: 0.06, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "band pill" });
  L.text(s, ex.band.toUpperCase(), { x: rx + 0.4, y: 4.3, w: 2.4, h: 0.45, fontSize: 13, bold: true, color: C.text2, align: "center", valign: "middle" });
  L.fundingBar(pres, s, { x: rx + 0.4, y: 5.15, w: 4.9, value: ex.probability, track: "3A423E", name: "example chance" });
  s.addShape(pres.shapes.RECTANGLE, { x: rx + 0.4 + 4.9 * d.success_rate - 0.02, y: 5.05, w: 0.04, h: 0.42, fill: { color: C.background1 }, line: { type: "none" }, objectName: "average marker" });
  L.text(s, `Average campaign: ${funded}%`, { x: rx + 0.4, y: 5.55, w: 4.9, h: 0.4, fontSize: 14, color: C.accent5 });

  // 14 · Limits: one iceberg --------------------------------------------------------------------------
  pres.addSection({ title: S4 });
  s = slideOn(pres, "Content", S4, {
    kicker: "What the Launch Check cannot see",
    title: "Limitations & Constraints",
    notes: `Every tool has limits. The check only knows the plan: goal, category, length, country and timing. It cannot see your video, your rewards, your fans or your marketing, and those often make the difference. Our data ends in early ${d.last_year}, so before real use we would refresh it. Use it as a starting point, not as a verdict.`,
  });
  // the same drawing as the HTML deck (assets/iceberg.svg), rendered to an image
  const berg = require("fs").readFileSync(require("path").join(__dirname, "assets", "iceberg.svg"));
  const bergPng = await require("sharp")(berg).png().toBuffer();
  s.addImage({ data: "image/png;base64," + bergPng.toString("base64"), x: M + 0.4, y: 1.7, w: W - 2 * M - 0.8, h: (W - 2 * M - 0.8) * 0.44, altText: "Iceberg: the Launch Check sees only the plan above the water; video and rewards, fans, marketing and today's market lie below", objectName: "iceberg" });

  // 15 · Insights & Recommendations ------------------------------------------------------
  s = slideOn(pres, "Content", S4, { title: "Insights & Recommendations" });
  const recs = [["Set a realistic goal", `up to $1k: ${pct(goal[0].rate)} · over $100k: ${pct(goal[7].rate)}`], ["Pick your end date on purpose", `30 days: ${pct(r30.round)} · 60 days: ${pct(r60.round)}`], ["Know your category", `${top.name} ${pct(top.rate)} · ${bottom.name} ${pct(bottom.rate)}`]];
  for (const [i, [t, sub]] of recs.entries()) {
    const y = 1.9 + i * 1.6;
    plain(pres, s, { x: M, y, w: W - 2 * M, h: 1.3, name: `recommendation ${i + 1}` });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M + 0.3, y: y + 0.25, w: 0.8, h: 0.8, rectRadius: 0.1, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `number ${i + 1}` });
    L.text(s, `${i + 1}`, { x: M + 0.3, y: y + 0.25, w: 0.8, h: 0.8, fontSize: 30, bold: true, color: C.background1, align: "center", valign: "middle" });
    L.text(s, t, { x: M + 1.45, y: y + 0.2, w: 10.5, h: 0.5, fontSize: 24, bold: true, color: C.text1 });
    L.text(s, sub, { x: M + 1.45, y: y + 0.72, w: 10.5, h: 0.4, fontSize: 17, color: C.accent4 });
  }

  // 16 · Thank you: one centred line -------------------------------------------------------
  s = slideOn(pres, "Title (dark)", S4, {});
  L.text(s, "Thank you for your attention.", { x: M, y: 2.6, w: W - 2 * M, h: 1.2, fontSize: 48, bold: true, color: C.background1, align: "center", valign: "middle", fontFace: HF, fit: "shrink" });
  L.text(s, "Questions?", { x: M, y: 3.9, w: W - 2 * M, h: 0.8, fontSize: 32, bold: true, color: C.accent1, align: "center", valign: "middle", fontFace: HF });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: (W - 0.9) / 2, y: 5.0, w: 0.9, h: 0.09, rectRadius: 0.045, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "accent rule" });
  L.text(s, "16", { x: W - M - 0.6, y: H - 0.5, w: 0.6, h: 0.3, fontSize: 10, color: C.accent5, align: "right", valign: "middle" });

  await pres.writeFile({ fileName: file });
  await L.applyTheme(file);
  return file;
}

module.exports = { buildClient };
