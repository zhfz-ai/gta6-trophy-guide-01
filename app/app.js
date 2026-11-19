// Leonida Legend — offline GTA VI trophy tracker.
// Loads the official 55-trophy list from data/trophies.json, saves ticks in
// localStorage, and renders the roadmap, filters, spoiler mode, and guides.
// No network requests beyond this app's own files.

const PROGRESS_KEY = 'leonida-legend-progress-v1';
const SETTINGS_KEY = 'leonida-legend-settings-v1';

const STAGES = [
  { n: 1, name: 'Story', desc: 'Opening mission, Chapters 1-4, named missions, final mission.' },
  { n: 2, name: 'Strangers', desc: 'Andy, Kenton, Billy, Randy, Tyrone strands, 8-strand silver, Bret hunt.' },
  { n: 3, name: 'Activities', desc: 'Stunts, races, shooting range, fishing, arcade, bowling, challenges.' },
  { n: 4, name: 'Collectibles', desc: 'Card sets, meditation spots, 100 vehicles, all 52 areas.' },
  { n: 5, name: 'Endgame', desc: 'Robberies, partner feats, money, garages, 100%, platinum.' },
];

const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const stagesEl = document.getElementById('stages');
const progressEl = document.getElementById('progress');
const barEl = document.getElementById('barfill');
const gradeCountsEl = document.getElementById('gradecounts');
const shownEl = document.getElementById('shown');
const gradeSel = document.getElementById('grade');
const earnedSel = document.getElementById('earnedfilter');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler');
const chipsEl = document.getElementById('kindchips');

let earned = new Set(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]'));
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
let kindFilter = settings.kind ?? 'all';
let openId = null;

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned]));
}

function saveSettings() {
  settings = { kind: kindFilter, grade: gradeSel.value, earned: earnedSel.value, spoiler: spoilerEl.checked };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function restoreSettings() {
  if (settings.grade) gradeSel.value = settings.grade;
  if (settings.earned) earnedSel.value = settings.earned;
  spoilerEl.checked = Boolean(settings.spoiler);
  for (const chip of chipsEl.querySelectorAll('.chip')) {
    chip.classList.toggle('on', chip.dataset.kind === kindFilter);
  }
}

function isHiddenBySpoiler(t) {
  return spoilerEl.checked && t.kind === 'story' && !earned.has(t.name);
}

function matchesFilters(t) {
  if (kindFilter === 'missable' && !t.missable) return false;
  if (kindFilter === 'online') return false;
  if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
  if (gradeSel.value !== 'all' && t.grade !== gradeSel.value) return false;
  if (earnedSel.value === 'earned' && !earned.has(t.name)) return false;
  if (earnedSel.value === 'remaining' && earned.has(t.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q && !isHiddenBySpoiler(t)) {
    const hay = `${t.name} ${t.description}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderStages() {
  stagesEl.replaceChildren();
  for (const s of STAGES) {
    const inStage = trophies.filter((t) => t.stage === s.n);
    const done = inStage.filter((t) => earned.has(t.name)).length;
    const li = document.createElement('li');
    li.className = 'stage';
    const num = document.createElement('div');
    num.className = 'snum';
    num.textContent = `Stage ${s.n}`;
    const name = document.createElement('div');
    name.className = 'sname';
    name.textContent = s.name;
    const desc = document.createElement('p');
    desc.className = 'sdesc';
    desc.textContent = s.desc;
    const count = document.createElement('div');
    count.className = 'scount';
    count.textContent = `${done} of ${inStage.length} earned`;
    li.append(num, name, desc, count);
    stagesEl.append(li);
  }
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  progressEl.textContent = `${done} of ${total} earned`;
  barEl.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] ?? { done: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.name)) byGrade[t.grade].done += 1;
  }
  gradeCountsEl.textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${g}: ${byGrade[g]?.done ?? 0}/${byGrade[g]?.total ?? 0}`)
    .join('  ·  ');
}

function renderList() {
  listEl.replaceChildren();
  const visible = trophies.filter(matchesFilters);
  for (const t of visible) {
    const li = document.createElement('li');
    li.className = earned.has(t.name) ? 'row done' : 'row';

    const head = document.createElement('div');
    head.className = 'rowhead';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveProgress();
      renderAll();
    });

    const badge = document.createElement('span');
    badge.className = `gradebadge g-${t.grade}`;
    badge.textContent = t.grade;

    const main = document.createElement('div');
    main.className = 'tmain';
    const nameEl = document.createElement('div');
    nameEl.className = 'tname';
    const descEl = document.createElement('div');
    descEl.className = 'tdesc';
    if (isHiddenBySpoiler(t)) {
      nameEl.textContent = 'Hidden story trophy';
      descEl.textContent = 'Earn it to reveal its name and description (spoiler-safe mode is on).';
    } else {
      nameEl.textContent = t.name;
      descEl.textContent = t.description;
    }
    const tags = document.createElement('div');
    tags.className = 'tags';
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = t.kind;
    const stageTag = document.createElement('span');
    stageTag.className = 'tag stage-tag';
    stageTag.textContent = `Stage ${t.stage}`;
    tags.append(kindTag, stageTag);
    if (t.missable) {
      const mTag = document.createElement('span');
      mTag.className = 'tag missable';
      mTag.textContent = 'Missable';
      tags.append(mTag);
    }
    main.append(nameEl, descEl, tags);
    head.append(box, badge, main);
    head.addEventListener('click', () => {
      openId = openId === t.id ? null : t.id;
      renderList();
    });
    li.append(head);

    if (openId === t.id) {
      const detail = document.createElement('div');
      detail.className = 'detail';
      const guideP = document.createElement('p');
      guideP.textContent = isHiddenBySpoiler(t)
        ? 'Guide hidden until earned (spoiler-safe mode is on).'
        : t.guide;
      const noteP = document.createElement('p');
      noteP.className = t.missable ? 'mnote' : 'mnote safe';
      noteP.textContent = t.missable_note;
      const srcP = document.createElement('p');
      srcP.className = 'sources';
      srcP.textContent = `Sources: ${t.sources.join('; ')}`;
      detail.append(guideP, noteP, srcP);
      li.append(detail);
    }
    listEl.append(li);
  }

  if (visible.length === 0) {
    emptyEl.hidden = false;
    emptyEl.textContent = kindFilter === 'online'
      ? 'No online trophies in the official PS5 list: all 55 trophies are single-player per the published list, so this filter is intentionally empty.'
      : 'No trophies match the current filters. Loosen a filter or clear the search.';
  } else {
    emptyEl.hidden = true;
  }
  shownEl.textContent = `Showing ${visible.length} of ${trophies.length}`;
}

function renderAll() {
  renderProgress();
  renderStages();
  renderList();
}

chipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  kindFilter = chip.dataset.kind;
  for (const c of chipsEl.querySelectorAll('.chip')) c.classList.toggle('on', c === chip);
  saveSettings();
  renderList();
});
gradeSel.addEventListener('change', () => { saveSettings(); renderList(); });
earnedSel.addEventListener('change', () => { saveSettings(); renderList(); });
searchEl.addEventListener('input', renderList);
spoilerEl.addEventListener('change', () => { saveSettings(); renderList(); });

document.getElementById('export').addEventListener('click', () => {
  const payload = JSON.stringify({ app: 'leonida-legend', earned: [...earned] }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    earned = new Set(names.filter((n) => trophies.some((t) => t.name === n)));
    saveProgress();
    renderAll();
  } catch {
    emptyEl.hidden = false;
    emptyEl.textContent = 'That file could not be imported. Export a progress file from this page and import that file.';
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  earned = new Set();
  saveProgress();
  renderAll();
});

// Deep links: ?kind=missable&grade=silver&spoiler=1&open=17 opens the
// tracker already filtered, so a view can be shared or bookmarked.
function applyQuery() {
  const q = new URLSearchParams(location.search);
  if (q.get('kind')) {
    kindFilter = q.get('kind');
    for (const c of chipsEl.querySelectorAll('.chip')) c.classList.toggle('on', c.dataset.kind === kindFilter);
  }
  if (q.get('grade')) gradeSel.value = q.get('grade');
  if (q.get('earned')) earnedSel.value = q.get('earned');
  if (q.get('spoiler') === '1') spoilerEl.checked = true;
  if (q.get('open')) openId = Number(q.get('open'));
}

restoreSettings();
applyQuery();
renderAll();
