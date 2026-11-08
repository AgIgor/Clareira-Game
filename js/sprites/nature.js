// Vegetação nativa e pedras.
import { TAU, rng, shade } from '../util.js';
import { P, EDGE, circ, ell, fillP } from '../iso.js';
import { sprite } from './canvas.js';

const LEAF = ['#5b7a3a', '#6a8a40', '#4d6c38', '#78904a', '#56733f', '#668443'];

export function treeBroad(c, x, y, s, col, r, flower) {
  c.fillStyle = 'rgba(16,24,10,.3)'; ell(c, x + 8 * s, y + 2 * s, 13 * s, 5.5 * s);
  c.fillStyle = '#4e3a29'; c.fillRect(x - 1.4 * s, y - 13 * s, 2.8 * s, 13 * s);
  const cy = y - 21 * s, bl = [];
  for (let k = 0; k < 7; k++) {
    const a = r() * TAU, d = r() * 6 * s;
    bl.push([x + Math.cos(a) * d * 1.3, cy + Math.sin(a) * d * 0.75, (5 + r() * 3.5) * s]);
  }
  bl.sort((a, b) => a[1] - b[1]);
  c.fillStyle = shade(col, -0.38); bl.forEach(b => circ(c, b[0] + 1.3 * s, b[1] + 2 * s, b[2]));
  c.fillStyle = col; bl.forEach(b => circ(c, b[0], b[1], b[2] * 0.9));
  c.fillStyle = shade(col, 0.16); bl.forEach((b, k) => { if (k % 2 === 0) circ(c, b[0] - 1.7 * s, b[1] - 1.9 * s, b[2] * 0.5); });
  c.fillStyle = shade(col, 0.34); for (let k = 0; k < 6; k++) circ(c, x - 6 * s + r() * 9 * s, cy - 7 * s + r() * 7 * s, 0.9 * s);
  if (flower) {
    c.fillStyle = shade(flower, 0.25); for (let k = 0; k < 14; k++) circ(c, x - 9 * s + r() * 18 * s, cy - 8 * s + r() * 12 * s, 1.1 * s);
  }
}

export function treeArauc(c, x, y, s) {
  c.fillStyle = 'rgba(16,24,10,.28)'; ell(c, x + 12 * s, y + 3 * s, 17 * s, 5 * s);
  c.fillStyle = '#4a3626'; c.fillRect(x - 1.2 * s, y - 40 * s, 2.4 * s, 40 * s);
  c.strokeStyle = '#4a3626'; c.lineWidth = 1.1 * s;
  for (let t = 0; t < 3; t++) {
    const ty = y - (34 + t * 6) * s, rx = (16 - t * 4.5) * s;
    c.beginPath(); c.moveTo(x, ty + 5 * s); c.lineTo(x - rx * 0.8, ty + s); c.moveTo(x, ty + 5 * s); c.lineTo(x + rx * 0.8, ty + s); c.stroke();
    c.fillStyle = '#283e25'; ell(c, x, ty + 1.8 * s, rx, (4.4 - t) * s);
    c.fillStyle = '#3e5d37'; ell(c, x, ty, rx * 0.96, (3.8 - t) * s);
    c.fillStyle = '#5a7c4a'; ell(c, x - rx * 0.25, ty - 1.2 * s, rx * 0.55, (1.6 - t * 0.3) * s);
  }
}

function treePalm(c, x, y, s, r) {
  c.fillStyle = 'rgba(16,24,10,.26)'; ell(c, x + 9 * s, y + 2 * s, 11 * s, 4 * s);
  const tx = x + (r() * 6 - 3) * s, ty = y - 31 * s;
  c.strokeStyle = '#7a6a52'; c.lineWidth = 2.4 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s, y - 16 * s, tx, ty); c.stroke();
  c.strokeStyle = '#5f5240'; c.lineWidth = 0.8 * s;
  for (let k = 4; k < 30; k += 4) {
    c.beginPath(); c.moveTo(x - 1.1 * s + (tx - x) * k / 31, y - k * s); c.lineTo(x + 1.1 * s + (tx - x) * k / 31, y - k * s); c.stroke();
  }
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * TAU + r() * 0.3, dx = Math.cos(a) * 15 * s, dy = Math.sin(a) * 6 * s;
    c.strokeStyle = k % 2 ? '#5c7d3c' : '#7a9a4c'; c.lineWidth = 2.2 * s;
    c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + dx * 0.6, ty + dy * 0.6 - 7 * s, tx + dx, ty + dy + 3 * s); c.stroke();
  }
  c.lineCap = 'butt';
}

function treeBush(c, x, y, s, col, r) {
  c.fillStyle = 'rgba(16,24,10,.26)'; ell(c, x + 4 * s, y + 2 * s, 10 * s, 4 * s);
  const bl = []; for (let k = 0; k < 5; k++) bl.push([x + (r() * 12 - 6) * s, y - (3 + r() * 4) * s, (3.5 + r() * 2.5) * s]);
  c.fillStyle = shade(col, -0.35); bl.forEach(b => circ(c, b[0] + s, b[1] + 1.5 * s, b[2]));
  c.fillStyle = col; bl.forEach(b => circ(c, b[0], b[1], b[2] * 0.9));
  c.fillStyle = shade(col, 0.2); bl.forEach(b => circ(c, b[0] - s, b[1] - 1.3 * s, b[2] * 0.45));
  if (r() < 0.5) { c.fillStyle = r() < 0.5 ? '#e3c25a' : '#d98aa0'; for (let k = 0; k < 5; k++) circ(c, x + (r() * 12 - 6) * s, y - (3 + r() * 6) * s, 0.9 * s); }
}

function rock(c, x, y, s, r) {
  c.fillStyle = 'rgba(16,20,10,.3)'; ell(c, x + 3 * s, y + 1.5 * s, 10 * s, 4 * s);
  for (let n = 0; n < 2; n++) {
    const ox = x + (n ? 7 : -2) * s, oy = y - (n ? 0 : 1) * s, ss = s * (n ? 0.6 : 1), pts = [];
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, rr = (6 + r() * 2.5) * ss; pts.push([ox + Math.cos(a) * rr, oy - 4 * ss + Math.sin(a) * rr * 0.62]); }
    fillP(c, pts, '#868379', EDGE);
    c.fillStyle = '#a29f94'; c.beginPath(); c.ellipse(ox - 1.5 * ss, oy - 6.5 * ss, 4 * ss, 2.2 * ss, 0, 0, TAU); c.fill();
  }
}

// Ipê: verde o ano todo, explode em flores no fim do inverno.
const IPE = [['#e8c02e', 'Ipê-amarelo'], ['#c46aa8', 'Ipê-roxo'], ['#f0ece0', 'Ipê-branco']];
function treeIpe(c, x, y, s, r, kind, bloom) {
  if (bloom) treeBroad(c, x, y, s * 1.05, IPE[kind][0], r, IPE[kind][0]);
  else treeBroad(c, x, y, s * 1.05, '#5d7a3c', r);
}

function oneTree(c, x, y, r, kind) {
  const s = 0.82 + r() * 0.3;
  if (kind === 'arauc') treeArauc(c, x, y, s);
  else if (kind === 'palm') treePalm(c, x, y, s, r);
  else if (kind === 'bush') treeBush(c, x, y, s * 0.9, LEAF[(r() * LEAF.length) | 0], r);
  else treeBroad(c, x, y, s, LEAF[(r() * LEAF.length) | 0], r);
}
function pickKind(r) { const q = r(); return q < 0.7 ? 'broad' : q < 0.84 ? 'bush' : q < 0.93 ? 'arauc' : 'palm'; }
const KNAME = { broad: 'Mata nativa', bush: 'Capoeira', arauc: 'Araucária', palm: 'Jerivá' };

// TREE[idx] = { img, name, bloom? } — idx 0 é "sem árvore" (cabe num Uint8Array).
export const TREE = [null];
export const T_SINGLE = [], T_DOUBLE = [], T_TRIPLE = [], T_ROCK = [], T_IPE = [];
function add(fn, name, extra = {}) { TREE.push({ img: sprite(fn), name, ...extra }); return TREE.length - 1; }

for (let k = 0; k < 10; k++) {
  const seed = 100 + k, kind = k < 5 ? 'broad' : k < 7 ? 'bush' : k < 9 ? 'arauc' : 'palm';
  T_SINGLE.push(add(c => oneTree(c, 0, 0, rng(seed), kind), KNAME[kind]));
}
for (let n = 2; n <= 3; n++) for (let k = 0; k < 6; k++) {
  const r = rng(n * 1000 + k), pts = [];
  for (let q = 0; q < n; q++) { const p = P(r() * 0.56 - 0.28, r() * 0.56 - 0.28); pts.push({ x: p[0], y: p[1], k: pickKind(r) }); }
  pts.sort((a, b) => a.y - b.y);
  const seed = n * 77 + k;
  (n === 2 ? T_DOUBLE : T_TRIPLE).push(add(c => { const rr = rng(seed); pts.forEach(p => oneTree(c, p.x, p.y, rr, p.k)); }, 'Mata fechada'));
}
for (let k = 0; k < 3; k++) T_ROCK.push(add(c => rock(c, 0, 0, 1, rng(500 + k)), 'Pedras', { rock: true }));
for (let k = 0; k < 3; k++) {
  const seed = 700 + k;
  const bloomImg = sprite(c => treeIpe(c, 0, 0, 0.95, rng(seed), k, true));
  T_IPE.push(add(c => treeIpe(c, 0, 0, 0.95, rng(seed), k, false), IPE[k][1], { bloomImg }));
}

export const isRock = t => !!(TREE[t] && TREE[t].rock);
export { LEAF };
