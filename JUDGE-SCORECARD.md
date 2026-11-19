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
