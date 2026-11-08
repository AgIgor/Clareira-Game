// Interface: painel, barra de ferramentas, ficha do ladrilho e controles de mouse, toque e teclado.
import { clamp, fmt } from './util.js';
import { N, W, G, near, ix, CY, CX, MAXL, CAP, BNAME, landValue, season, SEASONS } from './world.js';
import { TREE, isRock } from './sprites/nature.js';
import { TOOLS, toolById, quote } from './tools.js';
import { cv, cam, pick, view, clampCam, screen, ZMIN, ZMAX } from './render.js';
import { weatherName } from './sim.js';

const $ = id => document.getElementById(id);
let onAction = () => {};
export function setActionHandler(fn) { onAction = fn; }

/* ---------- painel superior ---------- */
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export function refreshHUD() {
  $('money').textContent = 'R$ ' + fmt(G.money);
  $('money').style.color = G.money < 200 ? 'var(--danger)' : '';
  const d = $('delta');
  d.textContent = G.month ? (G.last >= 0 ? '+' : '−') + 'R$ ' + fmt(Math.abs(G.last)) + '/mês' : 'saldo no fim do mês';
  d.className = 'sub ' + (G.month ? (G.last >= 0 ? 'pos' : 'neg') : '');
  $('pop').textContent = fmt(G.pop);
  $('jobs').textContent = fmt(G.jC + G.jI);
  $('date').textContent = MESES[G.month % 12] + ' · Ano ' + (1 + Math.floor(G.month / 12));
  const mins = Math.floor(G.tod * 24 * 60);
  $('clock').textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60 - (mins % 10)).padStart(2, '0');
  $('weather').textContent = SEASONS[season()] + ' · ' + weatherName();
  for (const [z, v] of [['r', G.dR], ['c', G.dC], ['i', G.dI]]) {
    const i = document.querySelector(`.bar[data-z="${z}"] i`), h = Math.abs(v) * 50;
    i.style.height = h + '%'; i.style.top = v >= 0 ? (50 - h) + '%' : '50%'; i.style.opacity = v >= 0 ? 1 : 0.45;
  }
}

/* ---------- velocidade ---------- */
const speedEl = $('speed');
export function setSpeed(s) { G.speed = s; speedEl.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.speed === s)); }
speedEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setSpeed(+b.dataset.speed); });

/* ---------- ficha do ladrilho ---------- */
const infoEl = $('info');
let actsEl = null;
export function setInfo(t, d) {
  infoEl.innerHTML = '';
  const a = document.createElement('span'); a.className = 't'; a.textContent = t;
  const b = document.createElement('span'); b.className = 'd'; b.textContent = d;
  infoEl.append(a, b);
  if (actsEl) infoEl.append(actsEl);
}
export function describe(p) {
  if (!p) return;
  const [i, j] = p, k = ix(i, j), z = W.zone[k], l = W.bl[k];
  if (W.road[k]) return setInfo(j === CY && i > CX ? 'Rodovia' : 'Rua', 'Liga os lotes da cidade. Manutenção: R$ 0,60 por mês.');
  if (W.ter[k] === 1) return setInfo('Rio', 'Água corrente. Não dá para construir aqui, mas valoriza a vizinhança.');
  if (z === 4) return setInfo('Praça', 'Valoriza os lotes num raio de 3 quadras e aumenta a vontade de morar por perto.');
  if (l) {
    const n = BNAME[z][l];
    if (W.cons[k]) return setInfo('Em obra', `Vai virar: ${n}.`);
    const cap = CAP[z][l];
    return setInfo(n, z === 1 ? `${cap} moradores · valor do terreno ${landValue(i, j, z).toFixed(1)}` : `${cap} empregos` + (l < MAXL[z] ? ' · pode crescer com demanda' : ''));
  }
  if (z) {
    const nm = { 1: 'Lote residencial', 2: 'Lote comercial', 3: 'Lote industrial' }[z];
    if (!near[k]) return setInfo(nm, 'Sem acesso: precisa de uma rua a até 2 quadras.');
    const d = { 1: G.dR, 2: G.dC, 3: G.dI }[z];
    return setInfo(nm, d > 0 ? (W.tree[k] ? 'A mata será derrubada quando a obra começar.' : 'Aguardando interessados.') : 'Sem procura no momento. Veja as barras R C I.');
  }
  if (W.tree[k]) {
    const t = TREE[W.tree[k]];
    return setInfo(t.name, isRock(W.tree[k]) ? 'Afloramento de pedra. Limpar custa R$ 8.'
      : t.bloomImg ? 'Floresce de julho a setembro. Limpar custa R$ 3.'
      : 'Vegetação nativa. Limpar custa R$ 3 e a mata volta a crescer em terreno vazio.');
  }
  return setInfo(W.ter[k] === 2 ? 'Areal' : 'Campo aberto', 'Terreno livre para ruas e lotes.');
}
export function setInfoActions(el) { actsEl = el; }

let toastT = 0;
export function toast(m) { const e = $('toast'); e.textContent = m; e.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (e.hidden = true), 2600); }

/* ---------- ferramentas ---------- */
let tool = 'mover', drag = null;
const toolsEl = $('tools');
TOOLS.forEach((t, n) => {
  const b = document.createElement('button');
  b.className = 'tool'; b.dataset.tool = t.id;
  if (t.col) b.style.setProperty('--tc', t.col);
  b.innerHTML = `<span class="k">${n + 1}</span>${t.zone ? '<span class="dot"></span>' : ''}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${t.icon}"/></svg><span class="n">${t.name}</span><span class="c">${t.cost ? 'R$ ' + t.cost : '—'}</span>`;
  b.addEventListener('click', () => setTool(t.id));
  toolsEl.appendChild(b);
});
export function setTool(id) {
  tool = id; drag = null; view.preview = [];
  view.toolCol = toolById(id).col || '#e2a73f';
  toolsEl.querySelectorAll('.tool').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === id));
  cv.classList.toggle('pan', id === 'mover');
}
function updatePreview() {
  if (!drag) { view.preview = []; return; }
  const q = quote(tool, drag.a, drag.b);
  view.preview = q.tiles; drag.total = q.total;
  setInfo(q.tool.name, q.total > 0 ? `Custo da obra: R$ ${fmt(q.total)}` + (q.total > G.money ? ' · falta dinheiro' : '') : 'Nada a fazer aqui.');
}
function commit() {
  if (!drag) return;
  onAction({ type: 'build', tool, a: drag.a, b: drag.b });
  drag = null; view.preview = [];
}

/* ---------- mouse e toque ---------- */
const ptrs = new Map();
let gest = null;
const same = (p, q) => String(p) === String(q);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    gest = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), z0: cam.z, wx: cam.x + (mx - screen.w / 2) / cam.z, wy: cam.y + (my - screen.h / 2) / cam.z };
    drag = null; view.preview = []; return;
  }
  if (ptrs.size > 2) return;
  if (e.button === 1 || e.button === 2 || tool === 'mover') gest = { type: 'pan', sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false };
  else { const t = pick(e.clientX, e.clientY); if (t) { gest = { type: 'tool' }; drag = { a: t, b: t }; updatePreview(); } }
});
cv.addEventListener('pointermove', e => {
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (e.pointerType === 'mouse') { const p = pick(e.clientX, e.clientY); if (!same(p, view.hover)) { view.hover = p; if (!drag) describe(p); } }
  if (!gest) return;
  if (gest.type === 'pinch' && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    cam.z = clamp(gest.z0 * Math.hypot(a.x - b.x, a.y - b.y) / gest.d0, ZMIN, ZMAX);
    cam.x = gest.wx - (mx - screen.w / 2) / cam.z; cam.y = gest.wy - (my - screen.h / 2) / cam.z; clampCam();
  } else if (gest.type === 'pan') {
    const dx = e.clientX - gest.sx, dy = e.clientY - gest.sy;
    if (Math.abs(dx) + Math.abs(dy) > 5) gest.moved = true;
    cam.x = gest.cx - dx / cam.z; cam.y = gest.cy - dy / cam.z; clampCam();
  } else if (gest.type === 'tool' && drag) {
    const p = pick(e.clientX, e.clientY);
    if (p && !same(p, drag.b)) { drag.b = p; updatePreview(); }
  }
});
function endPtr(e) {
  ptrs.delete(e.pointerId);
  if (!gest) return;
  if (gest.type === 'tool' && e.type === 'pointerup') commit();
  else if (gest.type === 'pan' && !gest.moved && e.type === 'pointerup') { view.sel = pick(e.clientX, e.clientY); describe(view.sel); }
  if (gest.type === 'pinch') { if (ptrs.size === 0) gest = null; return; }
  gest = null; drag = null; view.preview = [];
}
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !gest) view.hover = null; });
cv.addEventListener('wheel', e => {
  e.preventDefault();
  const wx = cam.x + (e.clientX - screen.w / 2) / cam.z, wy = cam.y + (e.clientY - screen.h / 2) / cam.z;
  cam.z = clamp(cam.z * Math.exp(-e.deltaY * 0.0015), ZMIN, ZMAX);
  cam.x = wx - (e.clientX - screen.w / 2) / cam.z; cam.y = wy - (e.clientY - screen.h / 2) / cam.z; clampCam();
}, { passive: false });

/* ---------- teclado ---------- */
export const keys = new Set();
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,textarea')) return;
  if (/^[1-8]$/.test(e.key)) setTool(TOOLS[+e.key - 1].id);
  else if (e.key === ' ') { e.preventDefault(); setSpeed(G.speed ? 0 : 1); }
  else if (e.key === 'Escape') { drag = null; view.preview = []; gest = null; setTool('mover'); }
  else if (e.key === '+' || e.key === '=') cam.z = clamp(cam.z * 1.2, ZMIN, ZMAX);
  else if (e.key === '-') cam.z = clamp(cam.z / 1.2, ZMIN, ZMAX);
  else keys.add(e.key.toLowerCase());
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
export function keyPan(dt) {
  const pan = 420 * dt / cam.z;
  if (keys.has('w') || keys.has('arrowup')) cam.y -= pan;
  if (keys.has('s') || keys.has('arrowdown')) cam.y += pan;
  if (keys.has('a') || keys.has('arrowleft')) cam.x -= pan;
  if (keys.has('d') || keys.has('arrowright')) cam.x += pan;
  clampCam();
}
