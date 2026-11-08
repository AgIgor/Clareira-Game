// Ladrilhos do chão (grama, água, areia, ruas, lotes), em cache por combinação.
import { rng, shade } from './util.js';
import { P, fillP, path, ell } from './iso.js';
import { SS } from './sprites/canvas.js';

const DIA = [[0, -16.7], [32.9, 0], [0, 16.7], [-32.9, 0]];
// Grama por estação: verão, outono, inverno (seco), primavera.
const GRASS = [
  ['#7a9149', '#6c8749', '#5f7f49', '#537649'],
  ['#86904a', '#7a8649', '#6d7f49', '#607648'],
  ['#9b9457', '#8d8a52', '#7e824e', '#6f7a4c'],
  ['#83914c', '#76884a', '#69814a', '#5c784a'],
];
export const ZCOL = { 1: '#86c463', 2: '#62a6dc', 3: '#e3b540', 4: '#86c463' };

const TC = new Map();
function tileImg(key, fn) {
  let im = TC.get(key);
  if (!im) {
    im = document.createElement('canvas'); im.width = 68 * SS; im.height = 36 * SS;
    const c = im.getContext('2d'); c.scale(SS, SS); c.translate(34, 18); fn(c);
    TC.set(key, im);
  }
  return im;
}

function speckle(c, r, cols, n) {
  for (let k = 0; k < n; k++) {
    const [x, y] = P((r() - 0.5) * 0.9, (r() - 0.5) * 0.9);
    c.strokeStyle = cols[k % cols.length]; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1.2, y - 1.6); c.stroke();
  }
}
function ground(c, t, g, s, season) {
  const r = rng(s * 31 + g * 7 + t * 101 + 1);
  if (t === 1) {
    fillP(c, DIA, '#3f6b74'); c.strokeStyle = '#5f8d94'; c.lineWidth = 0.8;
    for (let k = 0; k < 3; k++) { const [x, y] = P(r() - 0.5, r() - 0.5); c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.stroke(); }
    return;
  }
  if (t === 2) { fillP(c, DIA, '#b2a27a'); speckle(c, r, ['#9c8c66', '#c6b890'], 14); return; }
  const base = GRASS[season][g];
  fillP(c, DIA, base);
  speckle(c, r, [shade(base, -0.18), shade(base, 0.14), shade(base, -0.1)], 26);
  if (season === 3 && r() < 0.5) { c.fillStyle = r() < 0.5 ? '#e8d27a' : '#e9a6c2'; for (let k = 0; k < 4; k++) { const [x, y] = P(r() - 0.5, r() - 0.5); ell(c, x * 0.9, y * 0.9, 0.9, 0.7); } }
}

function road(c, mask, col) {
  const arms = [
    [1, w => [P(0, -w), P(0.52, -w), P(0.52, w), P(0, w)]],
    [2, w => [P(-0.52, -w), P(0, -w), P(0, w), P(-0.52, w)]],
    [4, w => [P(-w, 0), P(w, 0), P(w, 0.52), P(-w, 0.52)]],
    [8, w => [P(-w, -0.52), P(w, -0.52), P(w, 0), P(-w, 0)]],
  ];
  for (const [w, cl] of [[0.47, col], [0.36, '#47484a']]) {
    fillP(c, [P(-w, -w), P(w, -w), P(w, w), P(-w, w)], cl);
    for (const [b, f] of arms) if (mask & b) fillP(c, f(w), cl);
  }
  const n = (mask & 1) + ((mask >> 1) & 1) + ((mask >> 2) & 1) + ((mask >> 3) & 1);
  c.strokeStyle = 'rgba(222,196,110,.75)'; c.lineWidth = 0.9; c.setLineDash([3, 3]);
  if (n <= 2) {
    const ends = { 1: P(0.5, 0), 2: P(-0.5, 0), 4: P(0, 0.5), 8: P(0, -0.5) };
    for (const b of [1, 2, 4, 8]) if (mask & b) { c.beginPath(); c.moveTo(0, 0); c.lineTo(ends[b][0], ends[b][1]); c.stroke(); }
  } else {
    c.setLineDash([]); c.strokeStyle = 'rgba(235,230,215,.5)'; c.lineWidth = 1.4;
    const zeb = (a, b) => { for (let k = -2; k <= 2; k++) { const p = a(k * 0.06), q = b(k * 0.06); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); } };
    if (mask & 1) zeb(t => P(0.4, t - 0.02), t => P(0.4, t + 0.02));
    if (mask & 4) zeb(t => P(t - 0.02, 0.4), t => P(t + 0.02, 0.4));
  }
  c.setLineDash([]);
}

function lot(c, z, built) {
  if (!built) {
    fillP(c, DIA, ZCOL[z] + '33');
    c.strokeStyle = ZCOL[z]; c.globalAlpha = 0.85; c.lineWidth = 1; c.setLineDash([3, 2]);
    path(c, [P(-0.4, -0.4), P(0.4, -0.4), P(0.4, 0.4), P(-0.4, 0.4)]); c.stroke();
    c.setLineDash([]); c.globalAlpha = 1; return;
  }
  const sq = k => [P(-k, -k), P(k, -k), P(k, k), P(-k, k)];
  if (z === 1) { fillP(c, sq(0.46), '#7d9552'); fillP(c, [P(0.05, 0.3), P(0.15, 0.3), P(0.15, 0.5), P(0.05, 0.5)], '#b4a888'); }
  else if (z === 2) {
    fillP(c, sq(0.47), '#9d998e'); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 0.6;
    for (let k = -3; k <= 3; k++) { const a = P(k * 0.13, -0.47), b = P(k * 0.13, 0.47); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  } else if (z === 3) { fillP(c, sq(0.47), '#8d8676'); c.fillStyle = 'rgba(40,35,25,.18)'; const [x, y] = P(0.2, 0.1); ell(c, x, y, 7, 3); }
  else {
    fillP(c, sq(0.47), '#6f9a4e'); c.strokeStyle = '#c4b48c'; c.lineWidth = 2.4;
    for (const [a, b] of [[P(-0.47, 0), P(0.47, 0)], [P(0, -0.47), P(0, 0.47)]]) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  }
}

// desc: ['r', mask, gs, season] para rua; ['g', ter, gs, sv, zone, built, season] para o resto.
export function groundTile(desc) {
  const key = desc.join('.');
  return tileImg(key, c => {
    if (desc[0] === 'r') { ground(c, 0, desc[2], 0, desc[3]); road(c, desc[1], '#a5a092'); }
    else { ground(c, desc[1], desc[2], desc[3], desc[6]); if (desc[4]) lot(c, desc[4], desc[5]); }
  });
}
