# Design Review: Kickstarter Success Prediction deck

Reviewed: `kickstarter_success_presentation.pdf` (24 pages, 1920×1080: 16 main slides + 8 technical notes), sources in `slides/slides/*.html`, order in `slides/deck.json`, shared CSS in `slides/build_pdf.py`. Based on the current build (commit 3927263, which changed pp. 8, 10, 11, 15, 19 and 23). Every page was rendered to PNG and looked at. Contrast ratios below are computed from the hex values in the source.

Page numbers below are PDF page numbers. Main slides: 1, 2, 3, 4, 6, 8, 10, 12, 13, 14, 17, 19, 20, 22, 23, 24. Technical notes (TN): 5, 7, 9, 11, 15, 16, 18, 21.

## 1. Verdict

This is a clean, calm, consistent deck. It has a clear palette (navy #16233B, cream #F7F5EF, blue #2B5C9E, rust #B5481A, amber #F2A65A), a good serif/sans pairing (Domine + DM Sans), honest zero-based bar charts with direct labels, and headlines that mostly state an insight. The weak points are about delivery more than looks. The 8 technical notes sit between the main slides, so you have to click past them live. The colour that means "bad" flips on the limits slide. A few middle slides (outline, ML pipeline, model table, conclusion) are text-heavy for a 10-minute talk whose speaker notes already run about 10.5 minutes.

**Scores:** visual design **8/10**, clarity of content **7/10**.

**Top 3 changes with the biggest impact**
1. **Move all 8 technical notes to an appendix after "Thank you"** (reorder `deck.json`). The talk then becomes 16 pages you can click through without skipping.
2. **Fix the colour meaning on page 17**: make "14 / 100" (the warning) rust #B5481A and "62 / 100" (above average) blue #2B5C9E, and keep one rule for the whole deck: rust = the bars or numbers the headline warns about.
3. **Cut about 1.5 minutes of text**: shrink the outline (p. 2) to an agenda, slim the ML pipeline slide (p. 13), and give the model slide (p. 14) a result headline instead of a table you have to read.

## 2. Deck-level findings

| # | Severity | Problem | Fix |
|---|---|---|---|
| D1 | High | Technical notes are interleaved (pages 5, 7, 9, 11, 15, 16, 18, 21). Live, you must skip 8 pages. One wrong click puts a 250-word page in front of the audience and breaks the rhythm. Page 2 even says "we skip them in the talk". | Put the TNs after `thanks` in `deck.json` ("Appendix" section). Change the footer on page 4 from "details on the next page" to "details in the appendix". On page 2, rewrite the teal-bar note as "Technical notes are in the appendix". |
| D2 | High | Orange/rust has no single meaning. On p. 8 the footnote says orange = below the 36% average. On p. 10 orange marks 30 and 60 days, even though 38% is *above* average. On p. 6 only the >$100k bar is orange, though 14–35% are also below average. On p. 17 it flips completely: the warning (14/100) is blue and the good result (62/100) is rust. On p. 20 the "Above average" badge is amber. | Adopt one rule: **rust #B5481A = what the headline warns about, blue #2B5C9E = the rest, grey #9AA5B4 = average.** Pages 6, 8 and 10 already follow it. Change the p. 8 footnote to "orange = below the 36% average" only if you keep that rule there; otherwise drop the legend, since the grey average bar explains it. Fix p. 17 (swap the two colours). |
| D3 | Medium | Pacing: the main-slide speaker notes total about 1,520 words, roughly 10.8 min at 140 words/min, for 16 slides in a 10-minute slot. That leaves no buffer for transitions or a nervous start. | Trim about 200 words: outline (p. 2, 105 words of notes) down to 2 sentences; merge "How to make it better" (p. 22) into the conclusion or say it in one sentence; shorten the p. 13 notes. |
| D4 | Medium | The outline (p. 2) and the conclusion (p. 23) repeat the same 5 steps with the same numbers. The outline gives away every finding before the story starts, and the step pills already show the structure. | Make p. 2 a light agenda: 5 step names plus one 4–6 word teaser each (e.g. "3 · Baseline: a simple rule to beat") at ≥ 32px. Keep the numbers for p. 23. |
| D5 | Low | Left margin jumps: 112px on pp. 2, 4, 13, 23, 128px everywhere else. The eyebrow and title shift 16px between p. 13 and p. 14 and between p. 4 and p. 6. | Use `padding-left:128px` (and right 128px) on outline, approach, ml-story and conclusion. |
| D6 | Low | Inactive step pills: #8A94A3 on #F7F5EF = **2.8:1** at 19px, below WCAG AA (4.5:1). They cannot be read from the back. | In `build_pdf.py` `.steps span` use `color:#5F6B7A` (about 5.0:1) and `font-size:22px`. The active pill stays the dark fill. |
| D7 | Low | The three bar charts use different geometry: bar height 46 / 38 / 48px and scale 24 / 18 / 16px per percentage point (pp. 6, 8, 10). Each chart is honest on its own (zero baseline, proportional), but 50% looks a different length on each slide. | Use one scale, e.g. 18px per % and 44px bars, with the bars starting at the same x on all three. |
| D8 | Low | Section tints #F7F5EF (cream) vs #EEF2F6 (cool grey, pp. 12–17) are almost identical on a projector, and Step 5 mixes dark (p. 19) with cream (pp. 20, 22). This is harmless, but do not count on it to signal sections. | Keep as is, or use cream for all light main slides. |
| D9 | Low | The PDF embeds ArialMT and Lucida Grande as fallback fonts for a few glyphs (e.g. "→"). Checked at 144 dpi on p. 12: the fallback arrow looks fine. The real problem there is the line break: "→" ends line 1 and "“funded”" is left alone on line 2. | On p. 12 write the rule on two deliberate lines: "Goal under $5,500" / "→ “funded”" (put a `<br>` before the arrow). |

## 3. Per-slide findings

| Page | Severity | Problem | Concrete fix |
|---|---|---|---|
| 1 Cover | none | Strong: big Domine question, amber eyebrow, clear hierarchy. | Optional: "23 October 2026" instead of "October 2026". |
| 2 Outline | Medium (D4) | 138 words at 22–24px. The lower 40% of each card is empty, and the findings are given away. | Agenda version (see D4). Fix the teal note (D1). |
| 3 Problem | none | Best slide: one huge number (320px rust), one sentence, a bold "before". | Keep. |
| 4 Data | Medium | 138 words in three cards. The parallel card headings use three different colours (rust, blue, amber) for no reason. "Details on the next page" assumes interleaved TNs. | Two lines per card, ≥ 30px. One heading colour (#2B5C9E on white, #F2A65A on navy). Footer change per D1. |
| 6 Goal | Low | Clear and honest. No average reference, unlike p. 8. | Add a thin dashed line at 36% labelled "average 36%" (#9AA5B4) so the audience sees where "bad" starts. |
| 8 Category | Low | Good: sorted, direct labels, grey average bar, and a headline that names the result. The new headline wraps to 2 lines with one orphan word ("worst") on line 2, which pushes the chart down. The colour legend is still in a 24px grey footnote that nobody reads. | Make it fit on one line, e.g. "Dance and theater do best, technology worst" (or `font-size:64px`). Remove the legend from the footnote (the grey average bar explains it) or put "above / below average" as small labels next to the grey bar. |
| 10 Duration | Medium | The new headline ("…trail their neighbours") now matches the chart. Two problems remain. The headline wraps with one orphan word ("neighbours") on line 2. The key condition "goals of $1k–5k" is still hidden in a footnote that has grown to 2 lines and about 40 words at 24px, which nobody will read live. | Headline that fits one line: "30 and 60 days trail their neighbours". Add a 28px subline under the title: "Projects with goals of $1k–5k". Cut the footnote to "Same pattern for every goal size · a correlation" and leave the detail to TN p. 11. |
| 12 Baseline | Low | The text column of the three stat cards does not line up ("45" row starts about 15px left of the "63" and "no" rows). "no" as a big blue serif number looks like a statistic. | Give the number `flex:none;width:120px`. Replace "no" with a smaller grey "✕" or the plain text "No chance estimate". |
| 13 ML pipeline | Medium | Densest main slide: 163 words at 22–25px, with jargon ("cross validation", "cut-off", "time check"). In 10 minutes this is about 35 seconds of airtime. | Keep the 4 card titles plus one short line each (≥ 30px), e.g. "Try: 3 models, Gradient Boosting wins" / "Tune: almost no gain" / "Decide: a chance, not yes/no" / "Test: 74,459 unseen projects". Move the rest to TN p. 15. |
| 14 Model | Medium | The headline "Then, a model that beats the rule" is a topic. The table makes people read and compare columns. The paragraph below mixes two messages (random baseline + calibration). The column header "Rule: goal under $5,500" wraps to 2 lines. | Headline: "Our model finds 74 of 100 funded projects; the rule finds 63". Header "Simple rule". Optional: two pairs of horizontal bars (45 vs 53, 63 vs 74) instead of the table. Keep one sentence below: "Chances are honest on average: about 35% means funded about 35% of the time." |
| 17 Limits | High (D2) | Colour inversion: the bad number (14/100) is blue and the good number (62/100) is rust, the opposite of pages 8 and 10. | "14 / 100" → `color:#B5481A`; "62 / 100" → `color:#2B5C9E`. |
| 19 Recommendations | Low | Strong dark slide, numbered, amber numerals. The new item 2 text now matches p. 10. The order (goal, length, category) still differs from the findings and the conclusion (goal, category, length). | Swap items 2 and 3 so they follow the findings order. |
| 20 Launch Check | Low | Good before/after mock-up with a strong number. The "Above average" pill is amber, the colour family that means "warning" on the light slides. | Pill `background:#9CC0F0; color:#16233B` (light blue reads as positive on navy), or a white outline pill. |
| 22 Next steps | Low | Four tidy cards, each about 45% empty. Low information for its airtime. | Merge into p. 23 as one line, or cut the cards to 2 and use the time saved for p. 14. |
| 23 Conclusion | Low | Good one-page summary, highlighted final row. 146 words at 28px is fine for a closing slide only if the outline is lighter (D4). Left margin 112px (D5). | Keep the content, fix the margin. Bold only the 5 key numbers, not the words "goal / category / length". |
| 24 Thank you | Low | "Notebook on GitHub" has no link, and the repository is private, so the audience cannot act on it. | Add the URL or a QR code if you make it public; otherwise write "Notebook available on request". |
| TN 5–21 | Low | Very consistent 2×2 template with a teal bar, clear labels and a source line. As reading material it is good. At 23px body and 19px sources with about 220–260 words, it is not for projection, which is fine once it is in the appendix. The source lines wrap on pp. 5 and 15. | No change needed after D1. Optionally shorten the two wrapping source lines. |

## 4. What already works well

- One coherent visual system: a restrained palette, Domine headlines with DM Sans body, generous margins and a consistent eyebrow, title and footer position.
- Charts follow good practice: horizontal bars, zero baselines, proportional lengths, direct value labels, no gridlines or 3D, sorted where it makes sense, the key bar highlighted.
- Most headlines state the takeaway ("Smaller goals succeed far more often", "A risk check, not a crystal ball").
- Plain-language framing for non-technical listeners ("of 100 projects it calls funded, 45 really were") instead of raw precision and recall.
- The step pills give a clear sense of where you are in the story.
- Contrast is good almost everywhere: body #4A5568 on cream 6.9:1, rust on cream 4.9:1, amber on navy 7.8:1. Blue and orange are a colour-blind-safe pair.
- The strong problem slide (p. 3) and the product mock-up (p. 20) give the talk a clear start and payoff.

## 5. Quick-win checklist (impact ÷ effort, highest first)

1. [ ] p. 17: swap the colours: "14 / 100" #B5481A, "62 / 100" #2B5C9E (2 hex values).
2. [ ] `deck.json`: move the 8 `tn-*` slides after `thanks`. Update the p. 4 footer and the p. 2 teal note. Rebuild.
3. [ ] pp. 8 and 10: one-line headlines (no orphan words). On p. 10, move "Projects with goals of $1k–5k" into a subline and shorten the footnote.
4. [ ] p. 14: result headline "Our model finds 74 of 100 funded projects; the rule finds 63". Column header "Simple rule".
5. [ ] `build_pdf.py`: `.steps span` colour #5F6B7A, 22px.
6. [ ] Unify the left padding to 128px on outline, approach, ml-story and conclusion.
7. [ ] p. 2: turn the outline into a short agenda. Trim the speaker notes by about 200 words (aim for 9 minutes).
8. [ ] p. 13: one line per card, ≥ 30px.
9. [ ] p. 24: add a real link or "available on request".
10. [ ] p. 12: fix the stat-card alignment; replace "no".
11. [ ] p. 6: add a dashed 36% average line. p. 19: swap items 2 and 3.
12. [ ] Rehearse once with a timer, from the PDF, in presenter view.

*Not checked:* how it looks on the actual projector or room screen; presenter-view behaviour; colours under real colour-blindness simulation (only reasoned from the hue pair); fine detail on most pages (they were inspected at 60 dpi; only p. 12 was checked at 144 dpi).
