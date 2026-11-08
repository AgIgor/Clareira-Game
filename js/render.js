// Câmera e desenho do mundo, incluindo a camada de luz noturna.
// A noite funciona em duas etapas: o mundo é multiplicado por uma cor de céu,
// e depois uma "camada de luz" (janelas, postes, faróis) é somada por cima.
// Na camada de luz, cada sprite desenha também a sua silhueta preta, para tampar as luzes atrás dele.
import { TAU, clamp, lerp, h2, sm } from './util.js';
import { N, W, G, ix, inb, CY, season, ipeBloom } from './world.js';
import { P, box, circ, fillP } from './iso.js';
import { TREE } from './sprites/nature.js';
import { building, construction, PARK_LAMP } from './sprites/buildings.js';
import { silhouette, AX, AY, SW, SH } from './sprites/canvas.js';
import { groundTile } from './tiles.js';
import { cars, carPos, smoke, drops, flash } from './agents.js';

export const cv = document.getElementById('map');
const ctx = cv.getContext('2d');
const lc = document.createElement('canvas'), lx = lc.getContext('2d');
export const screen = { dpr: 1, w: 0, h: 0 };
export function resize() {
  const d = screen.dpr = Math.min(2, window.devicePixelRatio || 1);
  screen.w = innerWidth; screen.h = innerHeight;
  cv.width = lc.width = Math.round(screen.w * d); cv.height = lc.height = Math.round(screen.h * d);
  cv.style.width = screen.w + 'px'; cv.style.height = screen.h + 'px';
}

export const cam = { x: 0, y: 0, z: 1 };
export const ZMIN = 0.35, ZMAX = 2.6;
export function clampCam() { cam.x = clamp(cam.x, -N * 32, N * 32); cam.y = clamp(cam.y, 0, N * 32); cam.z = clamp(cam.z, ZMIN, ZMAX); }
export function centerOn(i, j) { cam.x = (i - j) * 32; cam.y = (i + j) * 16; }
export function pick(sx, sy) {
  const wx = cam.x + (sx - screen.w / 2) / cam.z, wy = cam.y + (sy - screen.h / 2) / cam.z, a = wx / 32, b = wy / 16;
  const i = Math.round((a + b) / 2), j = Math.round((b - a) / 2);
  return inb(i, j) ? [i, j] : null;
}

// Estado de interface que o desenho precisa conhecer.
export const view = { hover: null, sel: null, preview: [], toolCol: '#e2a73f' };

function roadMask(i, j) {
  let m = 0;
  if (inb(i + 1, j) && W.road[ix(i + 1, j)]) m |= 1;
  if (inb(i - 1, j) && W.road[ix(i - 1, j)]) m |= 2;
  if (inb(i, j + 1) && W.road[ix(i, j + 1)]) m |= 4;
  if (inb(i, j - 1) && W.road[ix(i, j - 1)]) m |= 8;
  if (i === N - 1 && j === CY) m |= 1; // a rodovia continua para fora do mapa
  return m;
}
function groundFor(i, j, k, se) {
  if (W.road[k]) return groundTile(['r', roadMask(i, j), W.gs[k], se]);
  return groundTile(['g', W.ter[k], W.gs[k], W.sv[k], W.zone[k], W.zone[k] && W.bl[k] ? 1 : 0, se]);
}

// Poste de luz: em parte das ruas, na calçada.
function lampAt(i, j, k) {
  if (h2(i, j, 5) > 0.42) return null;
  const m = roadMask(i, j), alongU = m & 3, alongV = m & 12;
  if (alongU && !alongV) return P(0, 0.42);
  if (alongV && !alongU) return P(0.42, 0);
  return P(0.42, 0.42);
}
function drawLampPost(c, x, y) {
  c.fillStyle = '#34352f'; c.fillRect(x - 0.7, y - 22, 1.4, 22);
  c.fillRect(x - 0.7, y - 22, 5, 1.2);
  c.fillStyle = '#d9cfa8'; c.fillRect(x + 3, y - 21.5, 2.4, 1.6);
}
function glowDot(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function drawCar(c, x, y, axis, col) {
  c.save(); c.translate(x, y);
  const [a, b] = axis === 'u' ? [0.15, 0.08] : [0.08, 0.15];
  box(c, -a, a, -b, b, 1, 5, col); box(c, -a * 0.55, a * 0.55, -b * 0.8, b * 0.8, 5, 8, '#c9d6da');
  c.restore();
}

// Cor do céu ao longo do dia (multiplica o mundo) e força das luzes.
export function skyLight() {
  const sun = Math.sin((G.tod - 0.25) * TAU);
  const d = sm(clamp((sun + 0.12) / 0.34, 0, 1));
  let r = lerp(58, 255, d), g = lerp(72, 255, d), b = lerp(128, 255, d);
  const dusk = Math.max(0, 1 - Math.abs(sun) / 0.3) * 0.6;
  r = lerp(r, 255, dusk * 0.5); g = lerp(g, 160, dusk); b = lerp(b, 120, dusk);
  const wet = 1 - 0.24 * G.rain;
  return { mul: [r * wet, g * wet, b * (1 - 0.14 * G.rain)], glow: clamp(1 - d + G.rain * 0.25, 0, 1) };
}

export function draw() {
  const { dpr, w: vw, h: vh } = screen, z = cam.z;
  const se = season(), bloom = ipeBloom(), sky = skyLight(), night = sky.glow > 0.03;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#141915'; ctx.fillRect(0, 0, vw, vh);
  const T = [dpr * z, 0, 0, dpr * z, dpr * (vw / 2 - cam.x * z), dpr * (vh / 2 - cam.y * z)];
  ctx.setTransform(...T);
  if (night) { lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, lc.width, lc.height); lx.setTransform(...T); }
  const x0 = cam.x - vw / 2 / z - 40, x1 = cam.x + vw / 2 / z + 40, y0 = cam.y - vh / 2 / z - 24, y1 = cam.y + vh / 2 / z + 200;

  // laje de terra sob o mapa
  const L = [-N * 32, (N - 1) * 16], B = [0, (2 * N - 1) * 16], R = [N * 32, (N - 1) * 16], d = 22;
  fillP(ctx, [L, B, [B[0], B[1] + d], [L[0], L[1] + d]], '#4c3b2b');
  fillP(ctx, [B, R, [R[0], R[1] + d], [B[0], B[1] + d]], '#3a2d21');

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const X = (i - j) * 32, Y = (i + j) * 16;
    if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
    ctx.drawImage(groundFor(i, j, ix(i, j), se), X - 34, Y - 18, 68, 36);
  }

  const bucket = new Map();
  for (const c of cars) {
    const p = carPos(c), k = ix(clamp(Math.round(p.fi), 0, N - 1), clamp(Math.round(p.fj), 0, N - 1));
    (bucket.get(k) || bucket.set(k, []).get(k)).push([p, c]);
  }

  // passe em profundidade: diagonais de trás para frente
  for (let s = 0; s < 2 * N - 1; s++) for (let i = Math.max(0, s - N + 1); i <= Math.min(N - 1, s); i++) {
    const j = s - i, X = (i - j) * 32, Y = (i + j) * 16;
    if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
    const k = ix(i, j);
    if (W.road[k]) {
      const lp = lampAt(i, j, k);
      if (lp) {
        drawLampPost(ctx, X + lp[0], Y + lp[1]);
        if (night) {
          lx.globalCompositeOperation = 'lighter';
          glowDot(lx, X + lp[0] + 4, Y + lp[1] - 20, 9, 'rgba(255,214,140,A)', 0.9);
          lx.save(); lx.translate(X + lp[0] + 3, Y + lp[1] + 1); lx.scale(1, 0.5);
          glowDot(lx, 0, 0, 30, 'rgba(255,200,120,A)', 0.32); lx.restore();
          lx.globalCompositeOperation = 'source-over';
        }
      }
    }
    const cb = bucket.get(k);
    if (cb) for (const [p, c] of cb) {
      const cx = (p.fi - p.fj) * 32, cy = (p.fi + p.fj) * 16;
      drawCar(ctx, cx, cy, p.di ? 'u' : 'v', c.col);
      if (night) {
        const hx = (p.di - p.dj) * 9, hy = (p.di + p.dj) * 4.5;
        lx.globalCompositeOperation = 'lighter';
        glowDot(lx, cx + hx, cy + hy - 3, 13, 'rgba(255,236,190,A)', 0.55);
        glowDot(lx, cx - hx * 0.9, cy - hy * 0.9 - 3, 4, 'rgba(255,60,40,A)', 0.7);
        lx.globalCompositeOperation = 'source-over';
      }
    }
    if (W.tree[k]) {
      const t = TREE[W.tree[k]], img = bloom && t.bloomImg ? t.bloomImg : t.img;
      const jx = (h2(i, j, 9) - 0.5) * 10, jy = (h2(i, j, 11) - 0.5) * 5;
      ctx.drawImage(img, X + jx - AX, Y + jy - AY, SW, SH);
      if (night) lx.drawImage(silhouette(img), X + jx - AX, Y + jy - AY, SW, SH);
    }
    if (W.bl[k]) {
      const zz = W.zone[k], b = W.cons[k] ? construction(W.bl[k]) : building(zz, W.bl[k], W.bv[k]);
      ctx.drawImage(b.img, X - AX, Y - AY, SW, SH);
      if (night) {
        lx.drawImage(b.glow || silhouette(b.img), X - AX, Y - AY, SW, SH);
        if (zz === 4 && W.bv[k] % 2 === 0) { lx.globalCompositeOperation = 'lighter'; glowDot(lx, X + PARK_LAMP[0], Y + PARK_LAMP[1], 16, 'rgba(255,220,150,A)', 0.6); lx.globalCompositeOperation = 'source-over'; }
      }
    }
  }

  for (const p of smoke) { ctx.fillStyle = `rgba(200,196,186,${Math.min(0.45, p.life * 0.18)})`; circ(ctx, p.x, p.y, p.r); }

  // céu e luzes
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const [mr, mg, mb] = sky.mul;
  if (mr < 254 || mg < 254 || mb < 254) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${mr | 0},${mg | 0},${mb | 0})`; ctx.fillRect(0, 0, cv.width, cv.height);
  }
  if (night) {
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = sky.glow;
    ctx.drawImage(lc, 0, 0); ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';

  // chuva
  if (drops.length) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = 'rgba(200,214,228,.5)'; ctx.lineWidth = 1.1; ctx.beginPath();
    for (const dr of drops) { const x = dr.x * vw, y = dr.y * vh; ctx.moveTo(x, y); ctx.lineTo(x - 3 * dr.s, y + 13 * dr.s); }
    ctx.stroke();
  }
  if (flash.a > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(235,240,255,${flash.a})`; ctx.fillRect(0, 0, cv.width, cv.height); }

  // prévia da ferramenta e destaque (por cima da luz, para ficarem legíveis à noite)
  ctx.setTransform(...T);
  if (view.preview.length) {
    for (const [k, c] of view.preview) {
      const i = (k / N) | 0, j = k % N;
      diamond(ctx, (i - j) * 32, (i + j) * 16, 0.04);
      ctx.fillStyle = c < 0 ? 'rgba(222,106,76,.45)' : c > 0 ? view.toolCol + '66' : 'rgba(255,255,255,.12)'; ctx.fill();
      ctx.strokeStyle = c < 0 ? '#de6a4c' : view.toolCol; ctx.lineWidth = 1 / z + 0.4; ctx.stroke();
    }
  } else {
    const hl = view.hover || view.sel;
    if (hl) { diamond(ctx, (hl[0] - hl[1]) * 32, (hl[0] + hl[1]) * 16, 0); ctx.strokeStyle = 'rgba(235,226,203,.85)'; ctx.lineWidth = 1.2 / z + 0.3; ctx.stroke(); }
  }
}
function diamond(c, X, Y, ins) {
  const s = 1 - ins; c.beginPath(); c.moveTo(X, Y - 16 * s); c.lineTo(X + 32 * s, Y); c.lineTo(X, Y + 16 * s); c.lineTo(X - 32 * s, Y); c.closePath();
}
