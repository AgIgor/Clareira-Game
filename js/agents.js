// Coisas que se mexem: carros, fumaça das fábricas, chuva e relâmpagos.
import { N, S, W, G, ix, inb } from './world.js';
import { IND_CHIM } from './sprites/buildings.js';

export const cars = [];
const CARC = ['#b8463a', '#3f6e9a', '#d9cfb8', '#4b5a3c', '#c49a3a', '#5e5a62'];

const roadN = k => {
  const i = (k / N) | 0, j = k % N, o = [];
  for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inb(i + a, j + b) && W.road[ix(i + a, j + b)]) o.push(ix(i + a, j + b));
  return o;
};
function spawnCar() {
  const rs = []; for (let k = 0; k < S; k++) if (W.road[k]) rs.push(k);
  if (rs.length < 2) return;
  const a = rs[(Math.random() * rs.length) | 0], n = roadN(a);
  if (!n.length) return;
  cars.push({ a, b: n[(Math.random() * n.length) | 0], t: Math.random(), sp: 0.9 + Math.random() * 0.6, col: CARC[(Math.random() * CARC.length) | 0] });
}
export function updCars(dt) {
  const want = G.roads >= 2 ? Math.min(70, 2 + Math.floor((G.pop + G.jC + G.jI) / 14)) : 0;
  if (cars.length < want && Math.random() < 0.1) spawnCar();
  if (cars.length > want) cars.pop();
  for (let n = cars.length - 1; n >= 0; n--) {
    const c = cars[n];
    if (!W.road[c.a] || !W.road[c.b]) { cars.splice(n, 1); continue; }
    c.t += dt * c.sp * (G.rain > 0.5 ? 0.75 : 1);
    if (c.t >= 1) {
      const nb = roadN(c.b), opts = nb.length > 1 ? nb.filter(x => x !== c.a) : nb;
      if (!opts.length) { cars.splice(n, 1); continue; }
      c.a = c.b; c.b = opts[(Math.random() * opts.length) | 0]; c.t -= 1;
    }
  }
}
// Posição em coordenadas de ladrilho, já na faixa da direita.
export function carPos(c) {
  const ai = (c.a / N) | 0, aj = c.a % N, bi = (c.b / N) | 0, bj = c.b % N, di = bi - ai, dj = bj - aj;
  return { fi: ai + di * c.t + (dj ? dj * -0.14 : 0), fj: aj + dj * c.t + (di ? di * 0.14 : 0), di, dj };
}

export const smoke = [];
export function updSmoke(dt) {
  for (let k = 0; k < S; k++) if (W.zone[k] === 3 && W.bl[k] && !W.cons[k] && Math.random() < dt * 1.6) {
    const i = (k / N) | 0, j = k % N, X = (i - j) * 32, Y = (i + j) * 16;
    for (const [cx, cy] of IND_CHIM[W.bl[k]]) if (smoke.length < 400) smoke.push({ x: X + cx, y: Y + cy - 2, vx: 6 + Math.random() * 4, vy: -9 - Math.random() * 5, r: 2.5, life: 2.6 });
  }
  for (let n = smoke.length - 1; n >= 0; n--) {
    const p = smoke[n]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 3.2;
    if (p.life <= 0) smoke.splice(n, 1);
  }
}

// Chuva em coordenadas de tela (0..1), redesenhada por cima de tudo.
export const drops = [];
export const flash = { a: 0 };
export function updRain(dt, realDt) {
  const want = Math.max(0, Math.round(380 * G.rain)) || 0;
  while (drops.length < want) drops.push({ x: Math.random(), y: Math.random(), s: 0.7 + Math.random() * 0.6 });
  if (drops.length > want) drops.length = want;
  for (const d of drops) { d.y += realDt * 1.6 * d.s; d.x -= realDt * 0.25 * d.s; if (d.y > 1) { d.y -= 1; d.x = Math.random() * 1.2; } if (d.x < 0) d.x += 1.2; }
  flash.a = Math.max(0, flash.a - realDt * 2.5);
  if (G.storm && G.rain > 0.5 && dt > 0 && Math.random() < dt * 0.12) flash.a = 0.55 + Math.random() * 0.3;
}
