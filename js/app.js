/* DataDisha 3D — a 3D explorer over the Census of India 2011.
   One InstancedMesh of blocks on a tile grid. Height = one indicator,
   colour = another. Every figure comes from data/states.js, which is
   generated from the downloaded census file — nothing is typed by hand. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DATA = window.DATADISHA_DATA;
const METRICS = DATA.metrics;
const METRIC_ORDER = ['population', 'literacy', 'female_literacy', 'gender_gap',
  'sex_ratio', 'workforce', 'sc_share', 'st_share', 'child_share'];
const states = DATA.states;
const byCode = Object.fromEntries(states.map(s => [s.code, s]));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- formatting ---------------- */
function fmt(key, v) {
  const m = METRICS[key];
  if (key === 'population') return v.toLocaleString('en-IN');
  if (m.decimals === 0) return Math.round(v).toLocaleString('en-IN');
  return v.toFixed(m.decimals);
}
function fmtSigned(key, v) {
  const s = fmt(key, Math.abs(v));
  return (v > 0 ? '+' : v < 0 ? '−' : '') + s;
}
function fmtWithUnit(key, v) {
  const m = METRICS[key];
  if (key === 'population') return fmt(key, v);
  if (m.unit === '%') return fmt(key, v) + '%';
  if (m.unit === 'points') return fmt(key, v) + ' pts';
  return fmt(key, v) + ' ' + m.unit.replace('women per 1,000 men', 'per 1,000 men');
}

/* ---------------- page facts + findings (all computed) ---------------- */
document.getElementById('fact-districts').textContent = DATA.meta.district_rows.toLocaleString('en-IN');
document.getElementById('fact-states').textContent = states.length;
document.getElementById('fact-people').textContent = DATA.meta.national.population.toLocaleString('en-IN');

function computeFindings() {
  const by = key => [...states].sort((a, b) => b.metrics[key] - a.metrics[key]);
  const lit = by('literacy');
  const gap = by('gender_gap');
  const pop = by('population');
  const nat = DATA.meta.national;
  const top5 = pop.slice(0, 5);
  const top5share = top5.reduce((a, s) => a + s.metrics.population, 0) / nat.population * 100;
  const belowNat = top5.filter(s => s.metrics.literacy < nat.literacy).length;
  const f1 = `<b>${lit[0].name}</b> has the highest literacy rate at <b>${fmt('literacy', lit[0].metrics.literacy)}%</b>. ` +
    `<b>${lit[lit.length - 1].name}</b> has the lowest at <b>${fmt('literacy', lit[lit.length - 1].metrics.literacy)}%</b>. ` +
    `That is a gap of <b>${(lit[0].metrics.literacy - lit[lit.length - 1].metrics.literacy).toFixed(1)} points</b> inside one country — set the block height to literacy and the two blocks barely look like neighbours.`;
  const f2 = `The literacy gender gap is widest in <b>${gap[0].name}</b> at <b>${fmt('gender_gap', gap[0].metrics.gender_gap)} points</b> ` +
    `and narrowest in <b>${gap[gap.length - 1].name}</b> at <b>${fmt('gender_gap', gap[gap.length - 1].metrics.gender_gap)} points</b>. ` +
    `Across India it is <b>${fmt('gender_gap', nat.gender_gap)} points</b>: in 2011, a boy was still much more likely to learn to read than a girl.`;
  const f3 = `The five most populous states — ${top5.map(s => s.name).join(', ')} — hold <b>${top5share.toFixed(1)}%</b> of everyone counted, ` +
    `yet <b>${belowNat} of the 5</b> sit below the national literacy rate of <b>${fmt('literacy', nat.literacy)}%</b>. ` +
    `Where India is biggest, it is not where India reads best. That is the whole argument for looking at data as a place, not a list.`;
  document.getElementById('finding-1').innerHTML = f1;
  document.getElementById('finding-2').innerHTML = f2;
  document.getElementById('finding-3').innerHTML = f3;
}
computeFindings();

/* ---------------- state ---------------- */
let heightMetric = 'literacy';
let colorMetric = 'population';
let compareMode = false;
let selected = null;        // state object, normal mode
let compare = [];           // up to 2 state objects, compare mode

/* ---------------- controls ---------------- */
const heightSel = document.getElementById('height-metric');
const colorSel = document.getElementById('color-metric');
const jumpSel = document.getElementById('state-jump');
for (const key of METRIC_ORDER) {
  heightSel.add(new Option(METRICS[key].label, key));
  colorSel.add(new Option(METRICS[key].label, key));
}
heightSel.value = heightMetric;
colorSel.value = colorMetric;
for (const s of [...states].sort((a, b) => a.name.localeCompare(b.name))) {
  jumpSel.add(new Option(s.name, s.code));
}

const compareBtn = document.getElementById('compare-toggle');
const spinBtn = document.getElementById('spin-toggle');
const resetBtn = document.getElementById('reset-view');
const clearBtn = document.getElementById('clear-selection');

heightSel.addEventListener('change', () => { heightMetric = heightSel.value; retarget(); renderRankings(); });
colorSel.addEventListener('change', () => { colorMetric = colorSel.value; retarget(); renderLegend(); });
jumpSel.addEventListener('change', () => {
  if (jumpSel.value) { pick(byCode[jumpSel.value]); jumpSel.value = ''; }
});
compareBtn.addEventListener('click', () => {
  compareMode = !compareMode;
  compareBtn.setAttribute('aria-pressed', String(compareMode));
  compareBtn.textContent = compareMode ? 'Comparing… click two blocks' : 'Compare two states';
  selected = null; compare = [];
  renderPanel(); updateOutlines();
});
spinBtn.addEventListener('click', () => {
  spinOn = !spinOn;
  spinBtn.setAttribute('aria-pressed', String(spinOn));
  if (controls) controls.autoRotate = spinOn;
});
resetBtn.addEventListener('click', resetView);
clearBtn.addEventListener('click', () => {
  selected = null; compare = []; renderPanel(); updateOutlines();
});

function pick(state) {
  if (compareMode) {
    const i = compare.indexOf(state);
    if (i >= 0) compare.splice(i, 1);
    else { compare.push(state); if (compare.length > 2) compare.shift(); }
  } else {
    selected = state;
  }
  renderPanel(); updateOutlines();
}

/* ---------------- panels ---------------- */
const detailTitle = document.getElementById('detail-title');
const detailEmpty = document.getElementById('detail-empty');
const detailTable = document.getElementById('detail-table');
const compareTable = document.getElementById('compare-table');

function metricRows(build) {
  return METRIC_ORDER.map(key => build(key)).join('');
}
function renderPanel() {
  const nat = DATA.meta.national;
  detailTable.hidden = true; compareTable.hidden = true;
  detailEmpty.hidden = true; clearBtn.hidden = true;
  if (compareMode && compare.length === 2) {
    const [a, b] = compare;
    detailTitle.textContent = `${a.name} vs ${b.name}`;
    document.getElementById('compare-col-a').textContent = a.name;
    document.getElementById('compare-col-b').textContent = b.name;
    compareTable.querySelector('tbody').innerHTML = metricRows(key =>
      `<tr><td>${METRICS[key].label}</td><td>${fmtWithUnit(key, a.metrics[key])}</td>` +
      `<td>${fmtWithUnit(key, b.metrics[key])}</td><td>${fmtSigned(key, b.metrics[key] - a.metrics[key])}</td></tr>`);
    compareTable.hidden = false; clearBtn.hidden = false;
  } else if (compareMode && compare.length === 1) {
    detailTitle.textContent = `${compare[0].name} — pick one more`;
    renderDetailRows(compare[0], nat);
    detailTable.hidden = false; clearBtn.hidden = false;
  } else if (!compareMode && selected) {
    detailTitle.textContent = selected.name;
    renderDetailRows(selected, nat);
    detailTable.hidden = false; clearBtn.hidden = false;
  } else {
    detailTitle.textContent = compareMode ? 'Compare is on' : 'No state picked yet';
    detailEmpty.textContent = compareMode
      ? 'Click two blocks and they will be placed side by side here. Click a picked block again to unpick it.'
      : 'Click any block and its full numbers land here — every indicator, with the all-India figure beside it.';
    detailEmpty.hidden = false;
  }
}
function renderDetailRows(state, nat) {
  document.getElementById('detail-col-a').textContent = state.name;
  detailTable.querySelector('tbody').innerHTML = metricRows(key =>
    `<tr><td>${METRICS[key].label}</td><td>${fmtWithUnit(key, state.metrics[key])}</td>` +
    `<td>${fmtWithUnit(key, nat[key])}</td></tr>`);
}

/* ---------------- rankings + legend ---------------- */
function renderRankings() {
  const sorted = [...states].sort((a, b) => b.metrics[heightMetric] - a.metrics[heightMetric]);
  document.getElementById('rank-title').textContent =
    `Highest and lowest — ${METRICS[heightMetric].label}`;
  const item = s =>
    `<li><button type="button" data-code="${s.code}"><span>${s.name}</span><span>${fmtWithUnit(heightMetric, s.metrics[heightMetric])}</span></button></li>`;
  document.getElementById('rank-top').innerHTML = sorted.slice(0, 5).map(item).join('');
  document.getElementById('rank-bottom').innerHTML = sorted.slice(-5).reverse().map(item).join('');
  document.querySelectorAll('.rank-cols button').forEach(b =>
    b.addEventListener('click', () => pick(byCode[b.dataset.code])));
}
function rampStops(ramp) {
  return ramp === 'rate'
    ? ['#d9c9a3', '#7ba05b', '#0e6e6b']
    : ['#d9c9a3', '#c96f3b', '#8c3b22'];
}
function renderLegend() {
  const vals = states.map(s => s.metrics[colorMetric]);
  const m = METRICS[colorMetric];
  document.getElementById('legend-label').textContent = 'Colour: ' + m.label;
  document.getElementById('legend-low').textContent = fmtWithUnit(colorMetric, Math.min(...vals));
  document.getElementById('legend-high').textContent = fmtWithUnit(colorMetric, Math.max(...vals));
  const stops = rampStops(m.ramp);
  document.getElementById('legend-bar').style.background =
    `linear-gradient(90deg, ${stops[0]}, ${stops[1]}, ${stops[2]})`;
}

/* ---------------- normalisation ---------------- */
function normalise(key, v) {
  const vals = states.map(s => s.metrics[key]);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (key === 'population') { // sqrt so small states stay visible
    const sv = Math.sqrt(v), smin = Math.sqrt(min), smax = Math.sqrt(max);
    return (sv - smin) / (smax - smin);
  }
  return (v - min) / (max - min);
}
const targetHeight = new Array(states.length).fill(0.3);
const targetColor = states.map(() => new THREE.Color('#d9c9a3'));
function retarget() {
  states.forEach((s, i) => {
    targetHeight[i] = 0.3 + normalise(heightMetric, s.metrics[heightMetric]) * 4.7;
    targetColor[i].copy(rampColor(METRICS[colorMetric].ramp, normalise(colorMetric, s.metrics[colorMetric])));
  });
}
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
function rampColor(ramp, t) {
  const stops = rampStops(ramp);
  if (t < 0.5) return _c1.set(stops[0]).lerp(_c2.set(stops[1]), t * 2).clone();
  return _c1.set(stops[1]).lerp(_c2.set(stops[2]), (t - 0.5) * 2).clone();
}

/* ---------------- the 3D table ---------------- */
const stageEl = document.getElementById('stage');
const labelsEl = document.getElementById('labels');
const tooltip = document.getElementById('tooltip');
let renderer = null, scene, camera, controls, columns, outlines = {};
let spinOn = false;
const SPACING = 1.18;
const curHeight = new Array(states.length).fill(0.3);
const curLift = new Array(states.length).fill(0);
const curColor = states.map(() => new THREE.Color('#d9c9a3'));
const labelDivs = [];
let intro = null;

const HOME = { pos: new THREE.Vector3(0.5, 12.8, 14.8), tgt: new THREE.Vector3(0, 0, 0.4) };
function tilePos(s) { return { x: (s.col - 4) * SPACING, z: (s.row - 4) * SPACING }; }

function initScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stageEl.clientWidth, stageEl.clientHeight);
  renderer.setClearColor(0xefe7d6);
  stageEl.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xefe7d6, 34, 62);
  camera = new THREE.PerspectiveCamera(42, stageEl.clientWidth / stageEl.clientHeight, 0.1, 200);
  camera.position.copy(HOME.pos).multiplyScalar(1.45);
  if (reducedMotion) camera.position.copy(HOME.pos);
  else intro = { t: 0, from: camera.position.clone(), to: HOME.pos.clone() };

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.tgt);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.35;
  controls.minDistance = 7;
  controls.maxDistance = 42;
  controls.autoRotateSpeed = 0.7;

  scene.add(new THREE.HemisphereLight(0xfff6e0, 0xcbb894, 0.95));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(8, 16, 6);
  scene.add(sun);

  // the printed grid on the table
  const gridPts = [];
  for (let i = -1; i <= 9; i++) {
    const a = (i - 4) * SPACING - SPACING / 2;
    gridPts.push(a, 0.01, -5.3, a, 0.01, 5.3, -5.3, 0.01, a, 5.3, 0.01, a);
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
  scene.add(new THREE.LineSegments(gridGeo,
    new THREE.LineBasicMaterial({ color: 0xd8cdb4, transparent: true, opacity: 0.8 })));

  // base plates
  const plateGeo = new THREE.BoxGeometry(1.06, 0.09, 1.06);
  const plates = new THREE.InstancedMesh(plateGeo,
    new THREE.MeshLambertMaterial({ color: 0xe2d5b8 }), states.length);
  const m4 = new THREE.Matrix4();
  states.forEach((s, i) => {
    const p = tilePos(s);
    m4.makeTranslation(p.x, 0.045, p.z);
    plates.setMatrixAt(i, m4);
  });
  scene.add(plates);

  // the blocks — one instanced mesh, colour per instance
  const colGeo = new THREE.BoxGeometry(0.86, 1, 0.86);
  colGeo.translate(0, 0.5, 0); // grow from the base
  columns = new THREE.InstancedMesh(colGeo,
    new THREE.MeshLambertMaterial({ color: 0xffffff }), states.length);
  columns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  states.forEach((s, i) => columns.setColorAt(i, curColor[i]));
  scene.add(columns);

  // selection outlines
  const mkOutline = color => {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.94, 1, 0.94));
    g.translate(0, 0.5, 0);
    const o = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color }));
    o.visible = false; scene.add(o); return o;
  };
  outlines = { sel: mkOutline(0x22303c), a: mkOutline(0x0e6e6b), b: mkOutline(0xe09f1f) };

  // labels
  states.forEach(s => {
    const d = document.createElement('div');
    d.className = 'tile-label';
    d.textContent = s.code;
    labelsEl.appendChild(d);
    labelDivs.push(d);
  });

  retarget();
  if (reducedMotion) { // no animation: snap straight to target
    for (let i = 0; i < states.length; i++) { curHeight[i] = targetHeight[i]; curColor[i].copy(targetColor[i]); }
  }
  bindPointer();
  window.addEventListener('resize', onResize);
  requestAnimationFrame(tick);
}

function resetView() {
  if (!camera) return;
  intro = null;
  camera.position.copy(HOME.pos);
  controls.target.copy(HOME.tgt);
}
function onResize() {
  if (!renderer) return;
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

/* ---------------- picking ---------------- */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoverIdx = -1, downPos = null;

function castAt(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(columns)[0];
  return hit ? hit.instanceId : -1;
}
function bindPointer() {
  const el = renderer.domElement;
  el.addEventListener('pointermove', ev => {
    hoverIdx = castAt(ev);
    if (hoverIdx >= 0) {
      const s = states[hoverIdx];
      tooltip.style.display = 'block';
      const wrap = stageEl.parentElement.getBoundingClientRect();
      tooltip.style.left = (ev.clientX - wrap.left + 14) + 'px';
      tooltip.style.top = (ev.clientY - wrap.top + 12) + 'px';
      tooltip.innerHTML = `<b>${s.name}</b>${METRICS[heightMetric].label}: ${fmtWithUnit(heightMetric, s.metrics[heightMetric])}<br>` +
        `${METRICS[colorMetric].label}: ${fmtWithUnit(colorMetric, s.metrics[colorMetric])}`;
      el.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      el.style.cursor = '';
    }
    labelDivs.forEach((d, i) => d.classList.toggle('is-hover', i === hoverIdx));
  });
  el.addEventListener('pointerdown', ev => { downPos = [ev.clientX, ev.clientY]; intro = null; });
  el.addEventListener('pointerup', ev => {
    if (!downPos) return;
    const moved = Math.hypot(ev.clientX - downPos[0], ev.clientY - downPos[1]);
    downPos = null;
    if (moved > 6) return; // it was a drag, not a click
    const idx = castAt(ev);
    if (idx >= 0) pick(states[idx]);
  });
  el.addEventListener('pointerleave', () => { tooltip.style.display = 'none'; hoverIdx = -1; });
}

function updateOutlines() {
  if (!columns) return;
  const place = (o, s, h) => {
    if (!s) { o.visible = false; return; }
    const p = tilePos(s);
    o.visible = true;
    o.position.set(p.x, 0.1, p.z);
    o.scale.set(1, Math.max(h, 0.05), 1);
  };
  const hOf = s => curHeight[states.indexOf(s)];
  if (compareMode) {
    place(outlines.sel, null);
    place(outlines.a, compare[0], compare[0] ? hOf(compare[0]) : 0);
    place(outlines.b, compare[1], compare[1] ? hOf(compare[1]) : 0);
  } else {
    place(outlines.a, null); place(outlines.b, null);
    place(outlines.sel, selected, selected ? hOf(selected) : 0);
  }
}

/* ---------------- animation ---------------- */
let lastT = performance.now(), running = true;
document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
  if (running) { lastT = performance.now(); requestAnimationFrame(tick); }
});
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(),
      _p = new THREE.Vector3(), _sc = new THREE.Vector3(), _v = new THREE.Vector3();

function tick(now) {
  if (!running) return;
  requestAnimationFrame(tick);
  const dt = Math.min((now - lastT) / 1000, 0.05); lastT = now;
  const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 5.5);

  if (intro) {
    intro.t += dt / 1.5;
    const e = 1 - Math.pow(1 - Math.min(intro.t, 1), 3);
    camera.position.lerpVectors(intro.from, intro.to, e);
    if (intro.t >= 1) intro = null;
  }
  controls.update();

  for (let i = 0; i < states.length; i++) {
    const dh = targetHeight[i] - curHeight[i];
    if (Math.abs(dh) > 0.001 || k === 1) { curHeight[i] += dh * k; }
    const s = states[i];
    const wantLift = (s === selected || compare.includes(s)) ? 0.14 : 0;
    curLift[i] += (wantLift - curLift[i]) * k;
    if (curColor[i].getHex() !== targetColor[i].getHex()) {
      curColor[i].lerp(targetColor[i], k);
      columns.setColorAt(i, curColor[i]);
      columns.instanceColor.needsUpdate = true;
    }
    const p = tilePos(s);
    _p.set(p.x, 0.09 + curLift[i], p.z);
    _sc.set(1, curHeight[i], 1);
    _m4.compose(_p, _q, _sc);
    columns.setMatrixAt(i, _m4);
  }
  columns.instanceMatrix.needsUpdate = true;
  updateOutlines();
  renderer.render(scene, camera);

  // labels follow their blocks
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  states.forEach((s, i) => {
    const p = tilePos(s);
    _v.set(p.x, 0.1 + curLift[i] + curHeight[i] + 0.12, p.z).project(camera);
    const d = labelDivs[i];
    if (_v.z > 1) { d.style.display = 'none'; return; }
    d.style.display = '';
    d.style.left = ((_v.x * 0.5 + 0.5) * w) + 'px';
    d.style.top = ((-_v.y * 0.5 + 0.5) * h) + 'px';
  });
}

/* ---------------- boot ---------------- */
renderRankings();
renderLegend();
renderPanel();
try {
  initScene();
} catch (e) {
  document.getElementById('webgl-note').hidden = false;
  console.error('WebGL unavailable:', e);
}

/* Test/QA handle — used by qa/smoke.mjs, harmless in production. */
window.DataDisha = {
  ready: true,
  stateCount: states.length,
  codes: states.map(s => s.code),
  getHeightMetric: () => heightMetric,
  getColorMetric: () => colorMetric,
  setHeightMetric: k => { heightSel.value = k; heightSel.dispatchEvent(new Event('change')); },
  setColorMetric: k => { colorSel.value = k; colorSel.dispatchEvent(new Event('change')); },
  getTargetHeight: code => targetHeight[states.indexOf(byCode[code])],
  getCurrentHeight: code => curHeight[states.indexOf(byCode[code])],
  select: code => pick(byCode[code]),
  getSelected: () => selected ? selected.code : null,
  setCompareMode: on => { if (on !== compareMode) compareBtn.click(); },
  isCompareMode: () => compareMode,
  getCompare: () => compare.map(s => s.code),
  projectTile: code => {
    const s = byCode[code], p = tilePos(s), i = states.indexOf(s);
    _v.set(p.x, 0.1 + curHeight[i] / 2, p.z).project(camera);
    return { x: (_v.x * 0.5 + 0.5) * stageEl.clientWidth, y: (-_v.y * 0.5 + 0.5) * stageEl.clientHeight };
  },
  hasWebGL: () => !!renderer,
};
