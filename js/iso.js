// Geometria isométrica e primitivas de desenho.
// u = eixo i do mapa (desce para a direita), v = eixo j (desce para a esquerda), z = altura em px.
import { TAU, shade } from './util.js';

export const P = (u, v, z = 0) => [(u - v) * 32, (u + v) * 16 - z];
export const EDGE = 'rgba(24,20,16,.5)';
export const GLASS = '#34444c';

// Modo "brilho": usado para gerar a camada noturna de um sprite.
// Com GL.on, tudo é desenhado com alpha 0, exceto janelas e letreiros (emissores).
export const GL = { on: false, r: Math.random, lit: 0.55 };
const WARM = ['#ffd27a', '#ffc860', '#ffe0a0', '#f6b85a'];

export function path(c, pts) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
  c.closePath();
}

// emit: 'win' para janela (acende ao acaso à noite) ou uma cor para letreiro/neon.
export function fillP(c, pts, col, edge, emit) {
  if (GL.on) {
    if (!emit) return;
    let ec = emit;
    if (emit === 'win') { if (GL.r() > GL.lit) return; ec = WARM[(GL.r() * WARM.length) | 0]; }
    const a = c.globalAlpha; c.globalAlpha = 1;
    path(c, pts); c.fillStyle = ec; c.fill();
    c.globalAlpha = a;
    return;
  }
  path(c, pts); c.fillStyle = col; c.fill();
  if (edge) { c.strokeStyle = edge; c.lineWidth = 0.6; c.stroke(); }
}

export function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
export function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }

export function box(c, u0, u1, v0, v1, z0, z1, col, top) {
  fillP(c, [P(u0, v1, z0), P(u1, v1, z0), P(u1, v1, z1), P(u0, v1, z1)], col, EDGE);
  fillP(c, [P(u1, v0, z0), P(u1, v1, z0), P(u1, v1, z1), P(u1, v0, z1)], shade(col, -0.24), EDGE);
  if (top !== null) fillP(c, [P(u0, v0, z1), P(u1, v0, z1), P(u1, v1, z1), P(u0, v1, z1)], top || shade(col, 0.14), EDGE);
}

export function shadowFoot(c, u0, u1, v0, v1, k) {
  fillP(c, [P(u0, v0), P(u1 + k, v0 - k * 0.3), P(u1 + k, v1), P(u0, v1)], 'rgba(14,18,10,.3)');
}

// Janela na face esquerda (plano v) e na face direita (plano u).
export const wL = (c, u0, u1, v, za, zb, col = GLASS) =>
  fillP(c, [P(u0, v, za), P(u1, v, za), P(u1, v, zb), P(u0, v, zb)], col, null, col === GLASS ? 'win' : null);
export const wR = (c, u, v0, v1, za, zb, col = GLASS) =>
  fillP(c, [P(u, v0, za), P(u, v1, za), P(u, v1, zb), P(u, v0, zb)], col, null, col === GLASS ? 'win' : null);

export function roofGable(c, u0, u1, v0, v1, z, r, axis, col, wall) {
  const e = 0.05;
  if (axis === 'u') {
    const vm = (v0 + v1) / 2;
    fillP(c, [P(u0 - e, v0 - e, z), P(u1 + e, v0 - e, z), P(u1 + e, vm, z + r), P(u0 - e, vm, z + r)], shade(col, -0.14), EDGE);
    fillP(c, [P(u1, v0, z), P(u1, v1, z), P(u1, vm, z + r)], shade(wall, -0.24), EDGE);
    fillP(c, [P(u0 - e, v1 + e, z), P(u1 + e, v1 + e, z), P(u1 + e, vm, z + r), P(u0 - e, vm, z + r)], shade(col, 0.06), EDGE);
  } else {
    const um = (u0 + u1) / 2;
    fillP(c, [P(u0 - e, v0 - e, z), P(u0 - e, v1 + e, z), P(um, v1 + e, z + r), P(um, v0 - e, z + r)], shade(col, 0.1), EDGE);
    fillP(c, [P(u0, v1, z), P(u1, v1, z), P(um, v1, z + r)], wall, EDGE);
    fillP(c, [P(um, v0 - e, z + r), P(um, v1 + e, z + r), P(u1 + e, v1 + e, z), P(u1 + e, v0 - e, z)], shade(col, -0.16), EDGE);
  }
}

export function roofHip(c, u0, u1, v0, v1, z, r, col) {
  const e = 0.05, A = P((u0 + u1) / 2, (v0 + v1) / 2, z + r);
  u0 -= e; u1 += e; v0 -= e; v1 += e;
  fillP(c, [P(u0, v0, z), P(u0, v1, z), A], shade(col, 0.12), EDGE);
  fillP(c, [P(u0, v0, z), P(u1, v0, z), A], shade(col, 0.02), EDGE);
  fillP(c, [P(u0, v1, z), P(u1, v1, z), A], col, EDGE);
  fillP(c, [P(u1, v0, z), P(u1, v1, z), A], shade(col, -0.2), EDGE);
}

export function cyl(c, x, y, r, h, col) {
  const g = c.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, shade(col, 0.18)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.32));
  c.fillStyle = g; c.fillRect(x - r, y - h, r * 2, h);
  c.beginPath(); c.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI); c.fill();
  c.fillStyle = shade(col, 0.22); ell(c, x, y - h, r, r * 0.5);
  c.strokeStyle = EDGE; c.lineWidth = 0.6; c.stroke();
}
