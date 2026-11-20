// Leonida Legend — offline tracker for the 55 GTA VI PS5 trophies (round 3).
// Loads data/trophies.json (this app's own file), keeps earned ticks,
// per-trophy counter progress and per-trophy notes in localStorage, and
// renders the 5-stage roadmap with trophy chips, stage missable warnings
// and tracked-item totals, a Next Up strip, a Closest Counters planner
// strip, a Missable Watch panel, a Sources panel aggregating every cited
// source, kind/grade filters, sorting, search, spoiler-safe mode, keyboard
// shortcuts, and one cited guide per trophy (Where line, prose, numbered
// steps, sources with notes, a note field, an honesty line).
// No network requests: the only fetch is the app's own data file.

const STORAGE_KEY = "leonida-legend-progress-v2";
const LEGACY_KEY = "leonida-legend-progress-v1";
const KINDS = ["story", "missable", "collectibles", "activities", "meta"];
const GRADES = ["platinum", "gold", "silver", "bronze"];
const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const SORTS = ["roadmap", "grade", "count", "name"];
const STAGES = [
  { n: 1, title: "Story chapters & missions", text: "Gone Fishing, Chapters 1-4, the named missions (Breakfast Run, The Cartel Heist, Child's Play, Headliners, VCIA Takedown, Operation Savage Glory) and the final mission." },
  { n: 2, title: "Stranger strands", text: "Andy, Kenton, Billy, Randy and Tyrone plus Bret's hunt — 8 strands total. Do them as they appear; givers can move on." },
  { n: 3, title: "Activities & counts", text: "250 stunts, 42 Shooting Range golds, 20 race wins, 14 drone races, 50 challenges, robberies, partner trophies, money counters." },
  { n: 4, title: "Collectibles & exploration", text: "3 card sets, 100 WAiNK It locations, 18 meditation spots, 100 vehicles, all 52 areas, 8 garage properties." },
  { n: 5, title: "Endgame: 100% & platinum", text: "A Long Road (100% completion, gold) once everything above is done — then the platinum pops on its own." },
];

const state = {
  trophies: [],
  earned: new Set(),
  counters: {}, // trophy id -> progress number (counted trophies only)
  notes: {}, // trophy id -> the player's own note text
  kind: "all",
  grade: "all",
  sort: "roadmap",
  query: "",
  spoiler: false,
  hideEarned: false,
  open: new Set(),
};

const el = (id) => document.getElementById(id);
const byId = (id) => state.trophies.find((t) => t.id === id);
const fmt = (n) => n.toLocaleString("en-US");

// Roadmap position of each trophy (stage, then id): "step N of 55".
let stepOf = new Map();
function computeSteps() {
  stepOf = new Map(roadmapOrder(state.trophies).map((t, i) => [t.id, i + 1]));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.earned)) state.earned = new Set(data.earned.filter((x) => Number.isInteger(x)));
      if (data.counters && typeof data.counters === "object") {
        for (const [k, v] of Object.entries(data.counters)) {
          const id = Number(k);
          if (Number.isInteger(id) && Number.isFinite(v) && v > 0) state.counters[id] = Math.floor(v);
        }
      }
      if (data.notes && typeof data.notes === "object") {
        for (const [k, v] of Object.entries(data.notes)) {
          const id = Number(k);
          if (Number.isInteger(id) && typeof v === "string" && v.trim()) state.notes[id] = v;
        }
      }
      return;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const ids = JSON.parse(legacy);
      if (Array.isArray(ids)) state.earned = new Set(ids.filter((x) => Number.isInteger(x)));
    }
  } catch { /* corrupted storage: start fresh */ }
}

function saveProgress() {
  const payload = {
    earned: [...state.earned].sort((a, b) => a - b),
    counters: state.counters,
    notes: state.notes,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function applyUrlPreset() {
  const q = new URLSearchParams(location.search);
  if (q.get("spoiler") === "1") state.spoiler = true;
  const kind = q.get("kind");
  if (kind && (kind === "all" || KINDS.includes(kind))) state.kind = kind;
  const grade = q.get("grade");
  if (grade && (grade === "all" || GRADES.includes(grade))) state.grade = grade;
  const sort = q.get("sort");
  if (sort && SORTS.includes(sort)) state.sort = sort;
  const earned = q.get("earned");
  if (earned) {
    for (const part of earned.split(",")) {
      const id = Number(part);
      if (Number.isInteger(id) && id > 0) state.earned.add(id);
    }
  }
  const count = q.get("count");
  if (count) {
    for (const part of count.split(",")) {
      const [idRaw, valRaw] = part.split(":");
      const id = Number(idRaw);
      const val = Number(valRaw);
      if (Number.isInteger(id) && id > 0 && Number.isFinite(val) && val >= 0) {
        state.counters[id] = Math.floor(val);
      }
    }
  }
  const open = q.get("open");
  if (open) {
    for (const part of open.split(",")) {
      const id = Number(part);
      if (Number.isInteger(id) && id > 0) state.open.add(id);
    }
  }
  const focus = q.get("focus");
  if (focus) {
    const id = Number(focus);
    if (Number.isInteger(id) && id > 0) state.open.add(id);
  }
  const note = q.get("note");
  if (note) {
    for (const part of note.split(";")) {
      const cut = part.indexOf(":");
      if (cut < 1) continue;
      const id = Number(part.slice(0, cut));
      const text = part.slice(cut + 1).trim();
      if (Number.isInteger(id) && id > 0 && text) state.notes[id] = text;
    }
  }
  const query = q.get("q");
  if (query) state.query = query.trim().toLowerCase();
  if (q.get("hide") === "roadmap") document.body.classList.add("hide-roadmap");
  if (q.get("compact") === "1") document.body.classList.add("hide-panels");
}

function roadmapOrder(list) {
  return [...list].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
}

function sorted(list) {
  const arr = [...list];
  if (state.sort === "grade") {
    arr.sort((a, b) => (GRADE_RANK[a.grade] - GRADE_RANK[b.grade]) || (a.stage - b.stage) || (a.id - b.id));
  } else if (state.sort === "count") {
    arr.sort((a, b) => ((b.count ?? -1) - (a.count ?? -1)) || (a.stage - b.stage) || (a.id - b.id));
  } else if (state.sort === "name") {
    arr.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    arr.sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  }
  return arr;
}

function kindOf(t) {
  if (state.kind === "missable") return t.missable === true;
  return state.kind === "all" || t.kind === state.kind;
}

function visible(t) {
  if (!kindOf(t)) return false;
  if (state.grade !== "all" && t.grade !== state.grade) return false;
  if (state.hideEarned && state.earned.has(t.id)) return false;
  if (state.query) {
    const hay = `${t.name} ${t.description}`.toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function isHiddenBySpoiler(t) {
  return state.spoiler && t.kind === "story" && !state.earned.has(t.id);
}

function displayName(t) {
  return isHiddenBySpoiler(t) ? "Hidden story trophy" : t.name;
}

function jumpTo(id) {
  // Make sure the target card is visible, open its guide, and scroll to it.
  state.kind = "all";
  state.grade = "all";
  state.query = "";
  state.hideEarned = false;
  el("search").value = "";
  el("hide-earned").checked = false;
  state.open.add(id);
  render();
  const card = el(`trophy-${id}`);
  if (card) card.scrollIntoView({ block: "center" });
}

function renderHeader() {
  const total = state.trophies.length;
  const done = state.trophies.filter((t) => state.earned.has(t.id)).length;
  el("progress-count").textContent = `${done} / ${total} earned`;
  el("progress-pct").textContent = total ? `${Math.round((done / total) * 100)}%` : "0%";
  el("progress-fill").style.width = total ? `${(done / total) * 100}%` : "0";
  el("grade-line").innerHTML = GRADES.map((g) => {
    const all = state.trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => state.earned.has(t.id)).length;
    return `<span>${g[0].toUpperCase() + g.slice(1)} <b>${got}/${all.length}</b></span>`;
  }).join("");
  const missables = state.trophies.filter((t) => t.missable).length;
  const counted = state.trophies.filter((t) => t.count);
  const tracked = counted.reduce((sum, t) => sum + t.count, 0);
  el("stats-strip").innerHTML =
    `<span><b>${total}</b> trophies</span>` +
    `<span><b>${missables}</b> missable</span>` +
    `<span><b>${counted.length}</b> counters</span>` +
    `<span><b>${fmt(tracked)}</b> tracked items &amp; dollars</span>` +
    `<span><b>28</b> hidden on PlayStation</span>`;
}

function stageChip(t) {
  const earned = state.earned.has(t.id);
  const hidden = isHiddenBySpoiler(t);
  return `<button type="button" class="trophy-chip${earned ? " earned" : ""}" data-jump="${t.id}" title="${hidden ? "Hidden story trophy" : t.name}">${earned ? "✓ " : ""}${hidden ? "Hidden" : t.name}</button>`;
}

function renderStages() {
  el("stages").innerHTML = STAGES.map((s) => {
    const all = roadmapOrder(state.trophies.filter((t) => t.stage === s.n));
    const got = all.filter((t) => state.earned.has(t.id)).length;
    const pct = all.length ? Math.round((got / all.length) * 100) : 0;
    const miss = all.filter((t) => t.missable).length;
    const tracked = all.reduce((sum, t) => sum + (t.count || 0), 0);
    return `<li class="stage">
      <div class="stage-num">Stage ${s.n}</div>
      <h3>${s.title}</h3>
      <p>${s.text}</p>
      <div class="stage-bar"><div class="stage-fill" style="width:${pct}%"></div></div>
      <div class="stage-count">${got} / ${all.length} trophies earned</div>
      ${miss ? `<div class="stage-warn">⚠ ${miss} missable in this stage</div>` : ""}
      ${tracked ? `<div class="stage-tracked">tracks ${fmt(tracked)} items &amp; dollars</div>` : ""}
      <div class="stage-chips">${all.map(stageChip).join("")}</div>
    </li>`;
  }).join("");
  const next = roadmapOrder(state.trophies).filter((t) => !state.earned.has(t.id)).slice(0, 5);
  el("next-up").innerHTML =
    `<span class="next-label">Next up</span>` +
    (next.length
      ? next.map((t) => `<button type="button" class="next-chip" data-jump="${t.id}">${displayName(t)} <span class="next-meta">stage ${t.stage} · ${t.grade}${t.missable ? " · missable" : ""}</span></button>`).join("")
      : `<span class="next-done">All 55 earned — platinum unlocked. 🏆</span>`);
}

function renderClosest() {
  const started = state.trophies
    .filter((t) => t.count && !state.earned.has(t.id) && (state.counters[t.id] ?? 0) > 0)
    .map((t) => ({ t, value: Math.min(state.counters[t.id], t.count) }))
    .sort((a, b) => (b.value / b.t.count) - (a.value / a.t.count))
    .slice(0, 4);
  el("closest-counters").innerHTML =
    `<span class="next-label">Closest counters</span>` +
    (started.length
      ? started.map(({ t, value }) => {
          const pct = Math.round((value / t.count) * 100);
          return `<button type="button" class="closest-chip" data-jump="${t.id}">
            <span class="closest-name">${displayName(t)}</span>
            <span class="closest-num">${fmt(value)} / ${fmt(t.count)} · ${pct}%</span>
            <span class="closest-bar"><span class="closest-fill" style="width:${pct}%"></span></span>
          </button>`;
        }).join("")
      : `<span class="closest-empty">No counter started yet — open a counted trophy below and set your progress.</span>`);
}

function renderSources() {
  const bySite = new Map();
  let distinct = 0;
  const seenNames = new Set();
  for (const t of state.trophies) {
    for (const s of t.sources || []) {
      if (!seenNames.has(s.name)) { seenNames.add(s.name); distinct += 1; }
      const site = s.name.split(" — ")[0];
      if (!bySite.has(site)) bySite.set(site, { url: s.url, trophies: new Set(), pages: new Set() });
      const row = bySite.get(site);
      row.trophies.add(t.id);
      row.pages.add(s.name);
    }
  }
  el("source-count").textContent = `${distinct} cited pages across ${bySite.size} sites`;
  el("source-list").innerHTML = [...bySite.entries()]
    .sort((a, b) => b[1].trophies.size - a[1].trophies.size)
    .map(([site, row]) => `<li class="source-row">
      <a href="${row.url}" target="_blank" rel="noopener noreferrer">${site}</a>
      <span class="source-meta">cited by ${row.trophies.size} of ${state.trophies.length} guides · ${row.pages.size} page${row.pages.size === 1 ? "" : "s"}</span>
    </li>`)
    .join("");
}

function renderMissableWatch() {
  const list = roadmapOrder(state.trophies.filter((t) => t.missable));
  const left = list.filter((t) => !state.earned.has(t.id)).length;
  el("missable-count").textContent = `${list.length - left} / ${list.length} earned · ${left} still at risk`;
  el("missable-list").innerHTML = list.map((t) => {
    const earned = state.earned.has(t.id);
    return `<li class="watch-row${earned ? " earned" : ""}">
      <span class="watch-state" aria-hidden="true">${earned ? "✓" : "!"}</span>
      <button type="button" class="watch-name" data-jump="${t.id}">${displayName(t)}</button>
      <span class="badge grade-${t.grade}">${t.grade}</span>
      <span class="badge">stage ${t.stage}</span>
      <span class="watch-reason">${t.missable_reason}</span>
    </li>`;
  }).join("");
}

function chipRow(containerId, values, current, labelFor, countFor, onPick) {
  const box = el(containerId);
  box.innerHTML = "";
  for (const v of values) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (v === current ? " active" : "");
    b.innerHTML = `${labelFor(v)} <span class="n">${countFor(v)}</span>`;
    b.addEventListener("click", () => onPick(v));
    box.appendChild(b);
  }
}

function renderChips() {
  chipRow("kind-chips", ["all", ...KINDS], state.kind,
    (v) => (v === "all" ? "All kinds" : v[0].toUpperCase() + v.slice(1)),
    (v) => v === "all" ? state.trophies.length : v === "missable" ? state.trophies.filter((t) => t.missable).length : state.trophies.filter((t) => t.kind === v).length,
    (v) => { state.kind = v; render(); });
  chipRow("grade-chips", ["all", ...GRADES], state.grade,
    (v) => (v === "all" ? "All grades" : v[0].toUpperCase() + v.slice(1)),
    (v) => v === "all" ? state.trophies.length : state.trophies.filter((t) => t.grade === v).length,
    (v) => { state.grade = v; render(); });
}

function sourceLine(t) {
  const links = (t.sources || []).map((s) =>
    `<span class="source"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>${s.backs ? ` <span class="backs">(backs ${s.backs})</span>` : ""}</span>`
  ).join(" &middot; ");
  return `<p class="sources">Sources: ${links}</p>`;
}

function stepperButtons(t) {
  const steps = [-1, 1];
  if (t.count >= 50) steps.push(10);
  if (t.count >= 1000) steps.push(100);
  return steps.map((d) =>
    `<button type="button" class="stepper" data-step="${t.id}:${d}" aria-label="Adjust progress for ${t.name} by ${d}">${d > 0 ? "+" + d : d}</button>`
  ).join("");
}

function counterHtml(t) {
  if (!t.count) return "";
  const value = Math.min(state.counters[t.id] ?? 0, t.count);
  const pct = Math.round((value / t.count) * 100);
  const done = value >= t.count;
  return `<div class="counter${done ? " done" : ""}">
    <label class="counter-label" for="count-${t.id}">Progress</label>
    <input id="count-${t.id}" class="counter-input" type="number" min="0" max="${t.count}" step="1" value="${value}" data-count="${t.id}" aria-label="Your progress toward ${t.name}">
    <span class="counter-of">/ ${fmt(t.count)}</span>
    <span class="steppers">${stepperButtons(t)}</span>
    <span class="counter-bar"><span class="counter-fill" style="width:${pct}%"></span></span>
    <span class="counter-pct">${pct}%${done ? " ✓" : ""}</span>
  </div>`;
}

function setCounter(id, value) {
  const t = byId(id);
  if (!t || !t.count) return;
  const prev = state.counters[id] ?? 0;
  let v = Math.floor(Number(value));
  if (!Number.isFinite(v) || v < 0) v = 0;
  if (v > t.count) v = t.count;
  if (v > 0) state.counters[id] = v; else delete state.counters[id];
  if (v >= t.count) state.earned.add(id);
  else if (prev >= t.count) state.earned.delete(id);
  saveProgress();
  render();
}

function noteHtml(t) {
  const text = state.notes[t.id] ?? "";
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<div class="note-box">
    <label class="note-label" for="note-${t.id}">Your note</label>
    <textarea id="note-${t.id}" class="note-input" rows="2" data-note="${t.id}" placeholder="e.g. last race saved for the end…" aria-label="Your note for ${t.name}">${safe}</textarea>
  </div>`;
}

function guideHtml(t) {
  const steps = (t.steps || []).map((s) => `<li>${s}</li>`).join("");
  return `<div class="guide-body">
    ${t.missable && t.missable_reason ? `<p class="missable-note"><strong>Why it can be missed:</strong> ${t.missable_reason}</p>` : ""}
    ${t.where ? `<p class="where-line"><strong>Where:</strong> ${t.where}</p>` : ""}
    <p>${t.guide}</p>
    ${steps ? `<ol class="steps">${steps}</ol>` : ""}
    ${sourceLine(t)}
    <p class="honesty">Written from the official description and the sources above — not yet verified in-game.</p>
    ${noteHtml(t)}
  </div>`;
}

function cardHtml(t) {
  const earned = state.earned.has(t.id);
  const hidden = isHiddenBySpoiler(t);
  const name = hidden ? "Hidden story trophy" : t.name;
  const desc = hidden ? "Name and description hidden until earned (spoiler-safe mode)." : t.description;
  const open = state.open.has(t.id);
  const badges = [
    `<span class="badge grade-${t.grade}">${t.grade}</span>`,
    `<span class="badge">${t.kind}</span>`,
    `<span class="badge">stage ${t.stage}</span>`,
    `<span class="badge step">step ${stepOf.get(t.id) ?? "–"} of ${state.trophies.length}</span>`,
    t.missable ? `<span class="badge missable">missable</span>` : "",
    t.count ? `<span class="badge count">count: ${fmt(t.count)}</span>` : "",
    state.notes[t.id] ? `<span class="badge note">✎ note</span>` : "",
  ].join("");
  return `<article class="card${earned ? " earned" : ""}" id="trophy-${t.id}">
    <div class="card-head">
      <input type="checkbox" data-id="${t.id}" ${earned ? "checked" : ""} aria-label="Mark ${hidden ? "hidden trophy" : t.name} as earned">
      <div class="card-main">
        <p class="card-name${hidden ? " hidden-name" : ""}">${name}</p>
        <p class="card-desc">${desc}</p>
        <div class="badges">${badges}</div>
        ${counterHtml(t)}
        <button type="button" class="guide-toggle" data-open="${t.id}">${open ? "Hide guide" : "Show guide & sources"}</button>
        ${open ? guideHtml(t) : ""}
      </div>
    </div>
  </article>`;
}

function renderList() {
  const shown = sorted(state.trophies.filter(visible));
  el("list").innerHTML = shown.map(cardHtml).join("");
  el("empty").hidden = shown.length > 0;
  el("result-line").textContent = `Showing ${shown.length} of ${state.trophies.length} trophies` +
    (state.kind === "missable" ? " — missable only" : "") +
    (state.spoiler ? " — spoiler-safe on" : "") +
    ` — sorted by ${state.sort}`;
  for (const box of el("list").querySelectorAll('input[type="checkbox"]')) {
    box.addEventListener("change", () => {
      const id = Number(box.dataset.id);
      if (box.checked) state.earned.add(id); else state.earned.delete(id);
      saveProgress();
      render();
    });
  }
  for (const btn of el("list").querySelectorAll("[data-open]")) {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.open);
      if (state.open.has(id)) state.open.delete(id); else state.open.add(id);
      render();
    });
  }
  for (const input of el("list").querySelectorAll("[data-count]")) {
    input.addEventListener("change", () => setCounter(Number(input.dataset.count), input.value));
  }
  for (const btn of el("list").querySelectorAll("[data-step]")) {
    btn.addEventListener("click", () => {
      const [idRaw, deltaRaw] = btn.dataset.step.split(":");
      const id = Number(idRaw);
      setCounter(id, (state.counters[id] ?? 0) + Number(deltaRaw));
    });
  }
  for (const area of el("list").querySelectorAll("[data-note]")) {
    area.addEventListener("change", () => {
      const id = Number(area.dataset.note);
      const text = area.value.trim();
      if (text) state.notes[id] = text; else delete state.notes[id];
      saveProgress();
      render();
    });
  }
}

function render() {
  renderHeader();
  renderStages();
  renderClosest();
  renderMissableWatch();
  renderSources();
  renderChips();
  renderList();
  for (const btn of document.querySelectorAll("[data-jump]")) {
    btn.addEventListener("click", () => jumpTo(Number(btn.dataset.jump)));
  }
}

function exportProgress() {
  const payload = {
    app: "leonida-legend",
    version: 3,
    exported: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    counters: state.counters,
    notes: state.notes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "gta6-trophy-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  file.text().then((text) => {
    try {
      const data = JSON.parse(text);
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error("bad file");
      state.earned = new Set(ids.filter((x) => Number.isInteger(x)));
      state.counters = {};
      if (data && !Array.isArray(data) && data.counters && typeof data.counters === "object") {
        for (const [k, v] of Object.entries(data.counters)) {
          const id = Number(k);
          const t = byId(id);
          if (t && t.count && Number.isFinite(v) && v > 0) {
            state.counters[id] = Math.min(Math.floor(v), t.count);
          }
        }
      }
      state.notes = {};
      if (data && !Array.isArray(data) && data.notes && typeof data.notes === "object") {
        for (const [k, v] of Object.entries(data.notes)) {
          const id = Number(k);
          if (byId(id) && typeof v === "string" && v.trim()) state.notes[id] = v;
        }
      }
      saveProgress();
      render();
      el("save-note").textContent = `Imported ${state.earned.size} earned trophies, ${Object.keys(state.counters).length} counters and ${Object.keys(state.notes).length} notes.`;
    } catch {
      el("save-note").textContent = "Import failed: not a progress file from this tracker.";
    }
  });
}

function wireControls() {
  el("search").addEventListener("input", (e) => { state.query = e.target.value.trim().toLowerCase(); renderList(); });
  el("spoiler").addEventListener("change", (e) => { state.spoiler = e.target.checked; render(); });
  el("hide-earned").addEventListener("change", (e) => { state.hideEarned = e.target.checked; renderList(); });
  el("sort").addEventListener("change", (e) => { state.sort = e.target.value; renderList(); });
  el("export").addEventListener("click", exportProgress);
  el("import-btn").addEventListener("click", () => el("import-file").click());
  el("import-file").addEventListener("change", (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); });
  el("reset").addEventListener("click", () => {
    state.earned.clear();
    state.counters = {};
    state.notes = {};
    saveProgress();
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (e.key === "/") {
      e.preventDefault();
      el("search").focus();
    } else if (e.key === "s") {
      state.spoiler = !state.spoiler;
      el("spoiler").checked = state.spoiler;
      render();
    } else if (e.key === "m") {
      state.kind = state.kind === "missable" ? "all" : "missable";
      render();
    } else if (e.key === "a") {
      state.kind = "all";
      state.grade = "all";
      render();
    }
  });
  el("spoiler").checked = state.spoiler;
  el("sort").value = state.sort;
  if (state.query) el("search").value = state.query;
}

async function boot() {
  loadProgress();
  applyUrlPreset();
  const res = await fetch("data/trophies.json");
  const data = await res.json();
  state.trophies = Array.isArray(data) ? data : data.trophies;
  computeSteps();
  // Counters that already reach their target count as earned.
  for (const t of state.trophies) {
    if (t.count && (state.counters[t.id] ?? 0) >= t.count) state.earned.add(t.id);
  }
  wireControls();
  render();
  const focus = new URLSearchParams(location.search).get("focus");
  if (focus) {
    const card = el(`trophy-${Number(focus)}`);
    if (card) card.scrollIntoView({ block: "center" });
  }
}

boot();
