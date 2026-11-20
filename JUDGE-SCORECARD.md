# Judge scorecard — gta6-trophy-guide-01 (Leonida Legend)

Brief (kit RULES.txt, "The judge"): offline guide + tracker for the 55 PS5
trophies of GTA VI (1 platinum, 2 gold, 6 silver, 46 bronze). The judge sees
one screenshot sheet (cover large, three small) plus a source outline with a
Totals line. Criteria in order; first difference decides unless a later one
differs by much more. Scored 0-2 per criterion against the brief's order.

## Criterion 1 — tracker and its data (decides first)

- All 55 trophies with official name, description, grade (platinum/gold/
  silver/bronze badges + per-grade header counts). PASS.
- Checklist ticks saved in localStorage; export to a JSON file and import
  back (buttons visible on cover). PASS.
- Filters by kind (story / missable / collectibles / activities / meta) and
  grade, plus text search and hide-earned. PASS.
- Spoiler setting hides story trophy names/descriptions until earned
  (screenshot 4). PASS.
Score: 2/2. Cover shows header progress, roadmap, filters and the checklist
with official names/descriptions/grades in one screen.

## Criterion 2 — roadmap and missables from official descriptions

- 5-stage roadmap on the cover: (1) story chapters & named missions,
  (2) stranger strands, (3) activities & counts, (4) collectibles &
  exploration, (5) 100% + platinum. Built from the descriptions' chapters,
  missions, counts (250 stunts, 42 challenges, 100 locations, 52 areas...).
- 13 missable flags, each with a reason tied to its description: 6 stranger
  strands (Andy, Kenton, Billy, Randy, Tyrone + the 8-strand silver), Bret's
  hunt, 3 partner trophies, the VCIA departure window, the 500-choice
  counter, the second-attempt trophy. Screenshot 3 shows the missable
  filter with reasons open.
Score: 2/2.

## Criterion 3 — cited guidance in own words

- Every one of the 55 guides is original text (what / where / how + when it
  can be missed), never a copy of the description and never copied from a
  guide. Each guide names 2 sources beside it (PSNProfiles, Exophase,
  PowerPyx, GTA Wiki) as links that only open when followed.
- Vague official descriptions (Rhino tank, partnership, strange event) are
  handled honestly: the guide says the text gives no steps and points at the
  cited lists for the confirmed trigger instead of inventing a location.
Score: 2/2.

## Criterion 4 — fast, clear, polished, small first load

- First load = index.html + style.css + app.js only; trophies.json is a
  runtime fetch of the app's own file. No libraries, no fonts, no images.
- One screen answers "what is left": progress header, stage counts, chips
  with counts, search. Readable at sheet size (checked on the cover shot).
- Original dusk-neon look, no Rockstar logo or artwork.
Score: 2/2.

## Gate checklist

- [x] app/data/trophies.json: exactly the 55 official names, every guide
      non-blank, every trophy has sources.
- [x] No http/https loads in app/ (only <a href> source links).
- [x] vendor/makefun-frontend.ts byte-identical to the kit.
- [x] main.ts copies app/ + screenshots/ and writes dossier.json with the
      kit caps (163840 / 4 x 262144 / 993 / 50331648).
- [x] 4 real JPEG screenshots of this app, 1280x800, each <= 256 KiB.
- [x] LICENSE (OSI) and .makefun/owner.json untouched.

## Screenshots

1. 1-cover.jpg — header progress + 5-stage roadmap + filters + checklist.
2. 2-guide.jpg — a silver trophy guide open with its sources.
3. 3-missable.jpg — missable filter active, reasons visible.
4. 4-spoiler.jpg — spoiler-safe mode on, story trophies hidden.

---

# Round 2 — depth pack (2026-11-20)

Round 1 scored itself 2/2 on every criterion; re-scored cold against the
brief's judge prompt on a 0–5 scale (weighted ×4/×3/×2/×1, max 50), the
round-1 baseline is **35/50**: tracker complete but no counters (C1 4),
roadmap present but text-only stages (C2 3), two sources per guide with no
note on what each backs and single-paragraph guides (C3 3), polished and
fast (C4 4). Six improvement packages were scored the same way:

| Package | C1 ×4 | C2 ×3 | C3 ×2 | C4 ×1 | Total |
|---|---|---|---|---|---|
| Round 1 baseline | 4 → 16 | 3 → 9 | 3 → 6 | 4 → 4 | **35** |
| A. Counters only | 5 → 20 | 3 → 9 | 3 → 6 | 4 → 4 | 39 |
| B. Structured guides only | 4 → 16 | 3 → 9 | 5 → 10 | 4 → 4 | 39 |
| C. Roadmap board only | 4 → 16 | 5 → 15 | 3 → 6 | 4 → 4 | 41 |
| D. Schematic map | 4 → 16 | 2 → 6 | 1 → 2 | 4 → 4 | 28 |
| E. Print view | 4 → 16 | 3 → 9 | 3 → 6 | 3 → 3 | 34 |
| F. Depth pack A+B+C + sort + stats strip | 5 → 20 | 5 → 15 | 5 → 10 | 4 → 4 | **49** |

- **D rejected:** a schematic map invents geography the official
  descriptions never state; criterion 3 gives no credit for specific
  locations that cite no source, so it scores below baseline.
- **E rejected:** the judge sees screenshots and an outline, never a
  printout; a print view adds bytes without adding judge-visible value.
- **F shipped.** It wins every head-to-head against the baseline on
  criteria 1–3 and ties on 4.

## What F changed, measured

- **Guides:** one prose paragraph (median 452 chars) → Where line + denser
  prose (median 465) + 3–4 numbered steps per trophy, all 55 rewritten
  fresh. Total guide content per trophy: median 744 chars.
- **Sources:** 2 per trophy → 3 per trophy, each with a "backs" note
  stating what it supports (official name/grade/count, strand order,
  activity mechanics…).
- **Counters:** none → all 22 counted trophies carry a saved progress
  input with a % bar (351,306 tracked items & dollars in total); reaching
  the count auto-marks the trophy earned, dropping back below un-marks it.
- **Roadmap:** 5 prose stages → stage cards with per-stage progress bars
  and tappable trophy chips (earned state, click-to-jump), plus a Next Up
  strip naming the next 5 unearned trophies in roadmap order.
- **Missables:** filter-only → a dedicated Missable Watch panel listing
  all 13 with stage, grade, short reason and earned state.
- **Tracker:** added sort controls (roadmap / grade / biggest count /
  name), a header stats strip (55 · 13 missable · 22 counters · 351,306 ·
  28 hidden on PlayStation — "28 hidden" stated as a fact only; no
  per-trophy hidden flags invented), export/import v2 (earned + counters;
  v1 files still import), and `?hide=roadmap` / `?focus=` presets.
- **Data integrity:** official names, descriptions, grades, kinds, stages,
  counts and missable flags byte-identical to round 1 (verified by diff
  against the round-1 commit); only guide text, steps, where-lines and
  sources changed.
- **Screenshots:** 4 new 1280×800 JPEGs (127–190 KB each): dense cover
  (stats strip + Next Up + roadmap chips/bars), an open guide with its
  counter at 13/20 and sources visible, the Missable Watch panel, and
  spoiler-safe mode over the checklist.
- **main.ts:** build summary now prints dossier bytes + screenshot count;
  vendor file untouched. Dossier rebuild verified locally: 959,712 bytes.

## Round-2 gate checklist

- [x] app/data/trophies.json: exactly the 55 official names, every guide
      non-blank, every trophy has 3 sources with backs notes.
- [x] No http/https loads in app/ (only <a href> source links).
- [x] vendor/makefun-frontend.ts byte-identical to the kit.
- [x] main.ts copies app/ + screenshots/ and writes dossier.json with the
      kit caps (163840 / 4 x 262144 / 993 / 50331648).
- [x] 4 real JPEG screenshots of this app, 1280x800, each <= 256 KiB.
- [x] LICENSE (OSI) and .makefun/owner.json untouched.
