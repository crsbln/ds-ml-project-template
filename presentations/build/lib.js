// Shared design system for both decks: theme, slide layouts and reusable visuals.
//
// Motif: the "funding bar", a rounded progress bar like the one on every campaign page.
// It shows any share (a success rate, a probability) the same way on every slide.

const fs = require("fs");
const path = require("path");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const pptxgen = require("pptxgenjs");

const THEMES = {
  // Technical deck: green "funded" palette, Cambria headings
  funded: {
    name: "Funded",
    headFontFace: "Cambria",
    bodyFontFace: "Calibri",
    colors: {
      dk1: "1B2A24", // body text, near-black green
      lt1: "FFFFFF",
      dk2: "0E3B2E", // deep forest: dark slides
      lt2: "EEF5F1", // pale mint: cards and tracks
      accent1: "0FA968", // funded green
      accent2: "E4572E", // not-funded coral
      accent3: "F2B33D", // gold highlight
      accent4: "66756F", // muted grey-green: captions
      accent5: "A8DCC3", // light green
      accent6: "2F6F5A", // mid green
      hlink: "0FA968",
      folHlink: "2F6F5A",
    },
  },
  // Client deck: business look matching the HTML deck (ds-ml-slides)
  business: {
    name: "Launch Check",
    headFontFace: "Calibri",
    bodyFontFace: "Calibri",
    colors: {
      dk1: "1F2421", // body text
      lt1: "FFFFFF",
      dk2: "1F2421", // dark slides
      lt2: "F5F7F6", // soft grey: cards and tracks
      accent1: "05CE78", // Kickstarter-style green
      accent2: "2E3431", // charcoal: the weak spots
      accent3: "8FE3BB", // light green
      accent4: "5D6863", // muted grey: captions
      accent5: "C9D3CE", // light text on dark
      accent6: "037A47", // dark green for text
      hlink: "037A47",
      folHlink: "5D6863",
    },
  },
};
const THEME = { ...THEMES.funded, colors: { ...THEMES.funded.colors } };
const HEX = THEME.colors; // for hex-only options (chart colors, grid lines, shadows)
const W = 13.333;
const H = 7.5;
const M = 0.6; // outer margin
const RESULTS = path.join(__dirname, "..", "..", "reports", "results.json");

function loadResults() {
  return JSON.parse(fs.readFileSync(RESULTS, "utf8"));
}

const pct = (v, digits = 0) => `${(v * 100).toFixed(digits)}%`;
const int = (v) => Math.round(v).toLocaleString("en-US");
const of100 = (v) => Math.round(v * 100);

// Switch the shared theme in place (HEX is THEME.colors, so it follows)
function useTheme(key) {
  const t = THEMES[key];
  Object.assign(THEME, { name: t.name, headFontFace: t.headFontFace, bodyFontFace: t.bodyFontFace });
  Object.assign(HEX, t.colors);
}

function newDeck({ title, subject }) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Christian Balan, Syed Kashif Ali Kazmi, Furkan Y.";
  pres.company = "neuefische Data Science";
  pres.title = title;
  pres.subject = subject;
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  defineLayouts(pres);
  return pres;
}

function defineLayouts(pres) {
  const C = pres.SchemeColor;
  const footer = (color) => ({
    placeholder: {
      options: {
        name: "source", type: "body", x: M, y: H - 0.5, w: W - 2 * M - 0.8, h: 0.3,
        fontSize: 10, color, margin: 0, valign: "middle",
      },
      text: "",
    },
  });
  const number = (color) => ({
    x: W - M - 0.6, y: H - 0.5, w: 0.6, h: 0.3, fontSize: 10, color, align: "right",
  });

  pres.defineSlideMaster({
    title: "Title (dark)",
    background: { color: C.text2 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: M, y: 1.55, w: 9, h: 0.4, fontSize: 14, bold: true, color: C.accent5, charSpacing: 2, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: M, y: 2.0, w: 9.2, h: 2.2, fontSize: 48, bold: true, align: "left", color: C.background1, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: M, y: 4.3, w: 8.6, h: 1.0, fontSize: 20, color: C.accent5, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "byline", type: "body", x: M, y: H - 1.0, w: 9, h: 0.4, fontSize: 12, color: C.background1, margin: 0 }, text: "" } },
    ],
  });

  pres.defineSlideMaster({
    title: "Section (dark)",
    background: { color: C.text2 },
    slideNumber: number(C.accent5),
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: M, y: 2.5, w: 10, h: 0.5, fontSize: 16, bold: true, color: C.accent3, charSpacing: 2, margin: 0 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: M, y: 3.0, w: 11, h: 1.4, fontSize: 40, bold: true, align: "left", color: C.background1, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: M, y: 4.4, w: 10, h: 1.0, fontSize: 18, color: C.accent5, valign: "top", margin: 0 }, text: "" } },
    ],
  });

  for (const [title, background, head, num] of [["Content", C.background1, C.text2, C.accent4], ["Content (tint)", C.background2, C.text2, C.accent4], ["Content (dark)", C.text2, C.background1, C.accent5]]) {
    pres.defineSlideMaster({
      title,
      background: { color: background },
      slideNumber: number(num),
      objects: [
        { placeholder: { options: { name: "kicker", type: "body", x: M, y: 0.35, w: W - 2 * M, h: 0.35, fontSize: 12, bold: true, color: background === C.text2 ? C.accent3 : C.accent1, charSpacing: 2, margin: 0 }, text: "" } },
        { placeholder: { options: { name: "title", type: "title", x: M, y: 0.7, w: W - 2 * M, h: 0.9, fontSize: 34, bold: true, align: "left", color: head, valign: "top", margin: 0 }, text: "" } },
        footer(num),
      ],
    });
  }
}

// Add a slide on a layout and fill its text placeholders by name.
function slideOn(pres, layout, section, { kicker, title, body, byline, source, notes }) {
  const slide = pres.addSlide({ masterName: layout, sectionTitle: section });
  if (kicker) slide.addText(kicker.toUpperCase(), { placeholder: "kicker" });
  if (title) slide.addText(title, { placeholder: "title" });
  if (body) slide.addText(body, { placeholder: "body" });
  if (byline) slide.addText(byline, { placeholder: "byline" });
  if (source) slide.addText(source, { placeholder: "source" });
  if (notes) slide.addNotes(notes);
  return slide;
}

// ---- visuals -------------------------------------------------------------------------

async function icon(Icon, hex, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color: `#${hex}`, size: String(size) })
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

// Icon centred in a filled circle
async function iconCircle(pres, slide, Icon, { x, y, d = 0.9, fill, iconHex, name }) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: `${name} circle` });
  const pad = d * 0.24;
  slide.addImage({ data: await icon(Icon, iconHex), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: name, objectName: `${name} icon` });
}

// The motif: a rounded track with a filled share
function fundingBar(pres, slide, { x, y, w, h = 0.22, value, fill, track, name }) {
  const C = pres.SchemeColor;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: h / 2, fill: { color: track || C.background2 }, line: { type: "none" }, objectName: `${name} track` });
  const filled = Math.max(h, w * Math.min(1, value));
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: filled, h, rectRadius: h / 2, fill: { color: fill || C.accent1 }, line: { type: "none" }, objectName: `${name} fill` });
}

function card(pres, slide, { x, y, w, h, fill, name, shadow = true }) {
  const C = pres.SchemeColor;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.12, fill: { color: fill || C.background1 },
    line: { color: HEX.lt2, width: 1 },
    shadow: shadow ? { type: "outer", color: "000000", opacity: 0.12, blur: 8, offset: 2, angle: 90 } : undefined,
    objectName: name,
  });
}

function text(slide, value, opts) {
  slide.addText(value, { isTextBox: true, margin: 0, valign: "top", fontSize: 16, ...opts });
}

// Chart styling shared by every chart, so labels look the same deck-wide
function chartBase(extra = {}) {
  return {
    showTitle: false,
    showLegend: false,
    showValue: true,
    dataLabelFontFace: "+mn-lt",
    dataLabelFontSize: 13,
    dataLabelColor: HEX.dk1,
    catAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 13,
    catAxisLabelColor: HEX.dk1,
    catAxisLineShow: false,
    valAxisLabelFontFace: "+mn-lt",
    valAxisLabelFontSize: 11,
    valAxisLabelColor: HEX.accent4,
    valGridLine: { style: "none" },
    catGridLine: { style: "none" },
    valAxisHidden: true,
    ...extra,
  };
}

// One-series bar chart, one colour per bar
function bars(pres, slide, { labels, values, colors, horizontal = true, fmt = "0%", min = 0, name, ...pos }) {
  slide.addChart(
    pres.charts.BAR,
    [{ name, labels, values }],
    chartBase({
      ...pos,
      barDir: horizontal ? "bar" : "col",
      barGapWidthPct: 45,
      chartColors: colors,
      dataLabelFormatCode: fmt,
      dataLabelPosition: "outEnd",
      catAxisOrientation: horizontal ? "maxMin" : "minMax",
      valAxisMinVal: min,
      objectName: name,
    })
  );
}

// Green above the reference value, coral below
function aboveBelow(values, reference) {
  return values.map((v) => (v >= reference ? HEX.accent1 : HEX.accent2));
}

async function applyTheme(file) {
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const part = "ppt/theme/theme1.xml";
  const slots = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"];
  const scheme = `<a:clrScheme name="${THEME.name}">` + slots.map((k) => `<a:${k}><a:srgbClr val="${HEX[k]}"/></a:${k}>`).join("") + "</a:clrScheme>";
  const xml = (await zip.file(part).async("string"))
    .replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, head) => `${head}${THEME.name}"`);
  zip.file(part, xml);
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith(".xml")) continue;
    const bad = (await zip.file(name).async("string")).match(/<a:srgbClr val="((?![0-9A-Fa-f]{6}")[^"]*)"/);
    if (bad) throw new Error(`${name}: colour "${bad[1]}" is not hex; a scheme colour went to a hex-only option`);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

module.exports = {
  THEME, HEX, W, H, M, useTheme, loadResults, pct, int, of100, newDeck, slideOn, icon, iconCircle,
  fundingBar, card, text, chartBase, bars, aboveBelow, applyTheme,
};
