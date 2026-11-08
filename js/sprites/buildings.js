// Edificações desenhadas por código. Cada uma tem a versão de dia e a camada noturna (janelas acesas).
import { rng, shade } from '../util.js';
import { P, EDGE, GLASS, box, shadowFoot, wL, wR, roofGable, roofHip, cyl, fillP, circ, ell } from '../iso.js';
import { sprite, glowSprite } from './canvas.js';
import { treeBroad, treeArauc, LEAF } from './nature.js';

const WALLS = ['#cdbb9c', '#a3b4b6', '#aeb68f', '#d8d0bf', '#b98a6a', '#c4a98a'];
const ROOFS = ['#57514e', '#6e4b3b', '#7d4436', '#4f5e66', '#6a6458'];
const SHOPLIGHT = '#ffe2a2';

function house1(c, v) {
  const w = WALLS[v % 6], rf = ROOFS[(v * 3) % 5];
  shadowFoot(c, -0.3, 0.3, -0.27, 0.27, 0.28);
  box(c, -0.3, 0.3, -0.27, 0.27, 0, 16, w, null);
  wL(c, -0.2, -0.06, 0.27, 6, 11); wL(c, 0.06, 0.18, 0.27, 0, 11, '#5b4030'); wR(c, 0.3, -0.16, -0.02, 6, 11);
  roofGable(c, -0.3, 0.3, -0.27, 0.27, 16, 12, v % 2 ? 'u' : 'v', rf, w);
  if (v % 3 === 0) box(c, 0.1, 0.17, -0.18, -0.11, 22, 30, '#8a5a48');
}
function house2(c, v) {
  const w = WALLS[(v + 2) % 6], rf = ROOFS[(v + 1) % 5];
  shadowFoot(c, -0.34, 0.34, -0.32, 0.32, 0.5);
  box(c, -0.34, 0.34, -0.32, 0.32, 0, 30, w, null);
  for (const z of [5, 19]) {
    wL(c, -0.24, -0.12, 0.32, z, z + 7); wL(c, 0.02, 0.14, 0.32, z, z + 7);
    wR(c, 0.34, -0.2, -0.08, z, z + 7); wR(c, 0.34, 0.04, 0.16, z, z + 7);
  }
  wL(c, -0.24, 0.24, 0.32, 15, 16.5, shade(w, -0.25));
  roofHip(c, -0.34, 0.34, -0.32, 0.32, 30, 13, rf);
}
function house3(c, v) {
  const w = WALLS[(v + 4) % 6];
  shadowFoot(c, -0.4, 0.4, -0.38, 0.38, 1.1);
  box(c, -0.4, 0.4, -0.38, 0.38, 0, 74, w, '#7d7a72');
  for (let z = 6; z < 68; z += 10) {
    for (const u of [-0.3, -0.08, 0.14]) wL(c, u, u + 0.13, 0.38, z, z + 6);
    for (const vv of [-0.28, -0.06, 0.16]) wR(c, 0.4, vv, vv + 0.13, z, z + 6);
  }
  wL(c, -0.06, 0.08, 0.38, 0, 6, '#4a3a2c');
  box(c, -0.4, 0.4, 0.34, 0.38, 74, 77, shade(w, -0.1), null); box(c, 0.36, 0.4, -0.38, 0.34, 74, 77, shade(w, -0.1), null);
  box(c, -0.24, -0.02, -0.26, -0.06, 77, 80, '#8c8a84');
  { const [x, y] = P(-0.13, -0.16, 80); cyl(c, x, y, 5, 9, '#a09e96'); }
  box(c, 0.12, 0.26, -0.1, 0.04, 77, 84, '#7a7872');
}
const AWN = [['#b84a3a', '#e4dccb'], ['#3f7a6a', '#e4dccb'], ['#d0a040', '#3d3a33'], ['#4a6aa0', '#e4dccb']];
function shop1(c, v) {
  const w = WALLS[(v + 1) % 6], [a1, a2] = AWN[v % 4];
  shadowFoot(c, -0.34, 0.34, -0.3, 0.3, 0.32);
  box(c, -0.34, 0.34, -0.3, 0.3, 0, 20, w, '#7e7b73');
  fillP(c, [P(-0.26, 0.3, 2), P(0.14, 0.3, 2), P(0.14, 0.3, 14), P(-0.26, 0.3, 14)], '#4f6c78', null, SHOPLIGHT);
  fillP(c, [P(-0.2, 0.3, 13), P(-0.12, 0.3, 13), P(-0.2, 0.3, 5)], '#7d98a2');
  wL(c, 0.18, 0.28, 0.3, 0, 13, '#5b4030'); wR(c, 0.34, -0.2, 0, 5, 13);
  for (let k = 0; k < 6; k++) { const u0 = -0.3 + k * 0.1; fillP(c, [P(u0, 0.3, 16), P(u0 + 0.1, 0.3, 16), P(u0 + 0.1, 0.48, 11), P(u0, 0.48, 11)], k % 2 ? a2 : a1, EDGE); }
  fillP(c, [P(-0.22, 0.3, 20), P(0.2, 0.3, 20), P(0.2, 0.3, 27), P(-0.22, 0.3, 27)], a1, EDGE, shade(a1, 0.35));
  c.strokeStyle = '#efe6d2'; c.lineWidth = 1; c.beginPath();
  const [sx, sy] = P(-0.14, 0.3, 23.5), [ex, ey] = P(0.12, 0.3, 23.5); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
}
function shop2(c, v) {
  const w = WALLS[(v + 3) % 6], [a1] = AWN[v % 4];
  shadowFoot(c, -0.38, 0.38, -0.36, 0.36, 0.6);
  box(c, -0.38, 0.38, -0.36, 0.36, 0, 42, w, '#77746d');
  fillP(c, [P(-0.3, 0.36, 2), P(0.3, 0.36, 2), P(0.3, 0.36, 13), P(-0.3, 0.36, 13)], '#4f6c78', null, SHOPLIGHT);
  fillP(c, [P(0.38, -0.28, 2), P(0.38, 0.28, 2), P(0.38, 0.28, 13), P(0.38, -0.28, 13)], '#46606a', null, SHOPLIGHT);
  for (const z of [18, 30]) {
    fillP(c, [P(-0.3, 0.36, z), P(0.3, 0.36, z), P(0.3, 0.36, z + 7), P(-0.3, 0.36, z + 7)], '#3d5560', null, 'win');
    fillP(c, [P(0.38, -0.28, z), P(0.38, 0.28, z), P(0.38, 0.28, z + 7), P(0.38, -0.28, z + 7)], '#33484f', null, 'win');
  }
  fillP(c, [P(-0.38, 0.36, 14), P(0.38, 0.36, 14), P(0.38, 0.36, 17), P(-0.38, 0.36, 17)], a1, EDGE);
  box(c, -0.2, -0.04, -0.22, -0.06, 42, 47, '#a8a69e'); box(c, 0.06, 0.2, -0.24, -0.1, 42, 46, '#a8a69e');
  box(c, 0.38, 0.42, 0.18, 0.3, 24, 40, a1);
  fillP(c, [P(0.42, 0.18, 26), P(0.42, 0.3, 26), P(0.42, 0.3, 38), P(0.42, 0.18, 38)], 'rgba(0,0,0,0)', null, shade(a1, 0.4));
}
function shop3(c) {
  shadowFoot(c, -0.36, 0.36, -0.34, 0.34, 1.6);
  box(c, -0.36, 0.36, -0.34, 0.34, 0, 118, '#5d7d8c', '#6f8a96');
  c.strokeStyle = 'rgba(220,235,240,.18)'; c.lineWidth = 0.7;
  for (let k = 1; k < 6; k++) {
    const u = -0.36 + k * 0.12, [a, b] = P(u, 0.34, 2), [d, e] = P(u, 0.34, 116);
    c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke();
    const vv = -0.34 + k * 0.113, [f, g] = P(0.36, vv, 2), [h, i] = P(0.36, vv, 116);
    c.beginPath(); c.moveTo(f, g); c.lineTo(h, i); c.stroke();
  }
  for (let z = 8; z < 118; z += 8) {
    const [a, b] = P(-0.36, 0.34, z), [d, e] = P(0.36, 0.34, z), [f, g] = P(0.36, -0.34, z);
    c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineTo(f, g); c.stroke();
    // faixas de escritório que acendem à noite
    for (let k = 0; k < 6; k++) {
      const u0 = -0.36 + k * 0.12, v0 = -0.34 + k * 0.113;
      fillP(c, [P(u0 + 0.01, 0.34, z + 1.5), P(u0 + 0.11, 0.34, z + 1.5), P(u0 + 0.11, 0.34, z + 6.5), P(u0 + 0.01, 0.34, z + 6.5)], 'rgba(0,0,0,0)', null, 'win');
      fillP(c, [P(0.36, v0 + 0.01, z + 1.5), P(0.36, v0 + 0.1, z + 1.5), P(0.36, v0 + 0.1, z + 6.5), P(0.36, v0 + 0.01, z + 6.5)], 'rgba(0,0,0,0)', null, 'win');
    }
  }
  wL(c, -0.36, 0.36, 0.34, 0, 6, '#2e3a40');
  box(c, -0.24, 0.24, -0.22, 0.22, 118, 128, '#4d6774');
  box(c, -0.04, 0.02, -0.06, 0, 128, 146, '#8e8e88');
  fillP(c, [P(-0.36, 0.34, 60), P(-0.1, 0.34, 60), P(-0.1, 0.34, 96), P(-0.36, 0.34, 40)], 'rgba(255,255,255,.07)');
  fillP(c, [P(-0.03, -0.05, 144), P(0.01, -0.05, 144), P(0.01, -0.05, 147), P(-0.03, -0.05, 147)], '#c33', null, '#ff4a3a');
}
function ind1(c, v) {
  const w = ['#a29a8a', '#9a8c74', '#8f9a92'][v % 3];
  shadowFoot(c, -0.42, 0.42, -0.3, 0.3, 0.3);
  const [cx, cy] = P(-0.26, -0.16, 0); cyl(c, cx, cy, 3.2, 44, '#8a5a48');
  box(c, -0.42, 0.42, -0.3, 0.3, 0, 18, w, null);
  roofGable(c, -0.42, 0.42, -0.3, 0.3, 18, 8, 'u', '#7d868a', w);
  wL(c, -0.12, 0.16, 0.3, 0, 13, '#55524b');
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.6;
  for (let z = 2; z < 13; z += 2.2) { const [a, b] = P(-0.12, 0.3, z), [d, e] = P(0.16, 0.3, z); c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); }
  wL(c, -0.34, -0.2, 0.3, 7, 11); wR(c, 0.42, -0.2, 0, 7, 11);
  box(c, 0.26, 0.38, 0.32, 0.44, 0, 5, '#9a7a4a');
}
function ind2(c, v) {
  const w = ['#9e8a72', '#8f9488', '#a48b78'][v % 3];
  shadowFoot(c, -0.44, 0.44, -0.38, 0.38, 0.5);
  let [cx, cy] = P(-0.3, -0.24, 0); cyl(c, cx, cy, 3.6, 72, '#7d4a3c');
  [cx, cy] = P(-0.06, -0.3, 0); cyl(c, cx, cy, 3, 64, '#8a5a48');
  box(c, -0.44, 0.44, -0.38, 0.38, 0, 24, w, null);
  for (let k = 0; k < 3; k++) { const u0 = -0.44 + k * 0.293; roofGable(c, u0, u0 + 0.293, -0.38, 0.38, 24, 9, 'v', '#7a8286', w); }
  for (const u of [-0.36, -0.1, 0.16]) wL(c, u, u + 0.16, 0.38, 8, 15);
  wR(c, 0.44, -0.1, 0.18, 0, 16, '#4e4b45');
  const [tx, ty] = P(0.3, 0.47, 0); cyl(c, tx, ty, 6, 16, '#b3aea2');
}
export const IND_CHIM = { 1: [P(-0.26, -0.16, 44)], 2: [P(-0.3, -0.24, 72), P(-0.06, -0.3, 64)] };

function park(c, v) {
  const r = rng(900 + v);
  if (v % 2) {
    box(c, 0.08, 0.3, 0.16, 0.22, 0, 3, '#7a5a3a'); box(c, -0.06, 0.06, -0.06, 0.06, 0, 4, '#a9a69b');
    c.fillStyle = '#6fa4b5'; const [x, y] = P(0, 0, 4); ell(c, x, y, 3, 1.5);
  } else {
    box(c, -0.3, -0.08, 0.16, 0.22, 0, 3, '#7a5a3a');
    const [x, y] = P(0.24, 0.24, 0); c.fillStyle = '#3a3a36'; c.fillRect(x - 0.6, y - 18, 1.2, 18); c.fillStyle = '#f0d890'; circ(c, x, y - 19, 1.8);
  }
  const pts = [P(-0.25, -0.25), P(0.22, -0.2), P(-0.22, 0.12)].sort((a, b) => a[1] - b[1]);
  pts.forEach((p, k) => { if (k === 2 && v % 3 === 0) treeArauc(c, p[0], p[1], 0.75); else treeBroad(c, p[0], p[1], 0.8, LEAF[(v + k) % 6], r); });
}
export const PARK_LAMP = P(0.24, 0.24, 19);

function cons(c, lvl) {
  const h = [0, 16, 30, 64][lvl] || 20;
  shadowFoot(c, -0.36, 0.36, -0.3, 0.3, 0.2);
  const pole = (u, v) => { const [a, b] = P(u, v, 0), [d, e] = P(u, v, h); c.strokeStyle = '#8a6a42'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); };
  const bar = (p, q) => { c.strokeStyle = '#9c7a4c'; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); };
  pole(-0.36, -0.3);
  box(c, -0.32, 0.32, -0.26, 0.26, 0, Math.max(6, h * 0.38), '#9c9488', '#8a847a');
  pole(0.36, -0.3); pole(-0.36, 0.3); pole(0.36, 0.3);
  for (const z of [h * 0.5, h]) { bar(P(-0.36, 0.3, z), P(0.36, 0.3, z)); bar(P(0.36, -0.3, z), P(0.36, 0.3, z)); }
  bar(P(-0.36, 0.3, 0), P(0.36, 0.3, h * 0.5));
  box(c, 0.18, 0.32, 0.34, 0.44, 0, 5, '#a0573f'); box(c, -0.34, -0.2, 0.36, 0.44, 0, 4, '#c9b98f');
}

function drawFor(z, l, v) {
  if (z === 1) return c => (l === 1 ? house1 : l === 2 ? house2 : house3)(c, v);
  if (z === 2) return c => (l === 1 ? shop1(c, v) : l === 2 ? shop2(c, v) : shop3(c));
  if (z === 3) return c => (l === 1 ? ind1(c, v) : ind2(c, v));
  return c => park(c, v);
}
const LIT = { 1: 0.5, 2: 0.65, 3: 0.35, 4: 0 };
const BS = {};
// Variantes por zona/nível (torre de escritórios tem uma só).
export const VARIANTS = (z, l) => (z === 2 && l === 3 ? 1 : z === 3 ? 3 : 6);
export function building(z, l, v) {
  v %= VARIANTS(z, l);
  const k = z + '.' + l + '.' + v;
  let b = BS[k];
  if (!b) {
    const fn = drawFor(z, l, v), img = sprite(fn);
    let glow = null;
    b = BS[k] = { img, get glow() { return glow || (glow = glowSprite(img, fn, 31 * l + 7 * v + z, LIT[z])); } };
  }
  return b;
}
const CS = {};
export function construction(l) {
  return CS[l] || (CS[l] = { img: sprite(c => cons(c, l)) });
}
