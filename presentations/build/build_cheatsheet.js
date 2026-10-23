// Presenter cheat sheet from script.json: what to say on each slide, plus the details we cut from the slides.
//   node build_cheatsheet.js   ->  ../PRESENTER_CHEATSHEET.md and ../presenter.html
// The same script.json feeds the client deck's speaker notes (client.js), so both always match.

const fs = require("fs");
const path = require("path");

const SCRIPT = require("./script.json");
const OUT = path.join(__dirname, "..");
const TITLE = "Kickstarter Launch Check · Presenter cheat sheet";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function markdown() {
  const lines = [`# ${TITLE}`, "", "Read the **Say** part aloud. **If asked** holds the details we took off the slides.", ""];
  for (const [i, s] of SCRIPT.entries()) {
    lines.push(`## ${i + 1} · ${s.title}`, "", `**Say:** ${s.say}`, "");
    if (s.backup.length) lines.push("**If asked:**", "", ...s.backup.map((b) => `- ${b}`), "");
  }
  return lines.join("\n");
}

function html() {
  const cards = SCRIPT.map((s, i) => `
  <article class="slide" id="s${i + 1}">
    <header><span class="n">${i + 1}</span><h2>${esc(s.title)}</h2></header>
    <p class="say">${esc(s.say)}</p>
    ${s.backup.length ? `<details open><summary>If asked</summary><ul>${s.backup.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></details>` : ""}
  </article>`).join("");
  const nav = SCRIPT.map((_, i) => `<a href="#s${i + 1}">${i + 1}</a>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Presenter cheat sheet</title>
<style>
:root { --ink: #1f2421; --muted: #5d6863; --line: #e1e5e3; --soft: #f5f7f6; --green: #05ce78; --green-d: #037a47; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--soft); color: var(--ink); font: 17px/1.55 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; }
.top { position: sticky; top: 0; z-index: 2; background: var(--ink); color: #fff; padding: 12px 16px; }
.top h1 { margin: 0 0 8px; font-size: 1rem; font-weight: 700; }
.top nav { display: flex; flex-wrap: wrap; gap: 6px; }
.top nav a { color: #fff; text-decoration: none; font-weight: 700; font-size: .85rem; min-width: 30px; text-align: center; padding: 4px 6px; border-radius: 6px; background: #323b36; }
.top nav a:hover { background: var(--green-d); }
main { max-width: 760px; margin: 0 auto; padding: 16px; }
.hint { color: var(--muted); font-size: .9rem; margin: 4px 0 16px; }
.slide { background: #fff; border: 1px solid var(--line); border-top: 4px solid var(--green); border-radius: 10px; padding: 18px 20px; margin: 0 0 14px; scroll-margin-top: 110px; }
.slide header { display: flex; align-items: baseline; gap: 12px; }
.n { flex: none; display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--green); color: #fff; font-weight: 800; font-size: .95rem; }
h2 { margin: 0; font-size: 1.1rem; line-height: 1.3; }
.say { font-size: 1.12rem; margin: 12px 0 0; }
details { margin-top: 12px; background: var(--soft); border-radius: 8px; padding: 8px 12px; }
summary { cursor: pointer; font-weight: 700; font-size: .8rem; letter-spacing: .1em; text-transform: uppercase; color: var(--green-d); }
details ul { margin: 8px 0 2px; padding-left: 1.1em; color: var(--muted); font-size: .95rem; }
details li { margin: 0 0 5px; }
@media print {
  body { background: #fff; font-size: 12pt; }
  .top { position: static; background: none; color: var(--ink); padding: 0 0 8pt; }
  .top nav, .hint { display: none; }
  main { max-width: none; padding: 0; }
  .slide { break-inside: avoid; border-width: 1px 1px 1px 4px; border-color: #ccc #ccc #ccc var(--green); }
  details { background: none; padding: 0; }
}
</style>
</head>
<body>
<div class="top"><h1>${esc(TITLE)}</h1><nav aria-label="Slides">${nav}</nav></div>
<main>
  <p class="hint">Read the big text aloud. “If asked” holds the details we took off the slides. Tap a number to jump to that slide.</p>${cards}
</main>
</body>
</html>
`;
}

fs.writeFileSync(path.join(OUT, "PRESENTER_CHEATSHEET.md"), markdown());
fs.writeFileSync(path.join(OUT, "presenter.html"), html());
console.log("Built", path.join(OUT, "PRESENTER_CHEATSHEET.md"), "and presenter.html");
