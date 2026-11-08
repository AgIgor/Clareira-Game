// Simulação: crescimento dos lotes, regeneração da mata, finanças e clima.
import { clamp } from './util.js';
import { N, S, W, G, near, ix, inb, MAXL, stats, landValue, save, season } from './world.js';
import { T_SINGLE, isRock } from './sprites/nature.js';

export const GROW_STEP = 0.5;   // segundos de jogo entre ciclos de crescimento
export const MONTH_LEN = 5;     // segundos de jogo por mês
export const DAY_LEN = 60;      // segundos de jogo por dia (ciclo de luz)

export function growthTick() {
  stats();
  const D = { 1: G.dR, 2: G.dC, 3: G.dI };
  let changed = false;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const k = ix(i, j), z = W.zone[k];
    if (!z || z === 4) continue;
    if (W.cons[k]) { W.cons[k]--; changed = true; continue; }
    const d = D[z];
    if (!W.bl[k]) {
      if (near[k] && d > 0 && Math.random() < 0.07 * d) {
        W.tree[k] = 0; W.bl[k] = 1; W.bv[k] = (Math.random() * 6) | 0; W.cons[k] = 4 + ((Math.random() * 4) | 0); changed = true;
      }
    } else if (W.bl[k] < MAXL[z] && near[k] && d > 0.12 && G.pop >= (W.bl[k] === 1 ? (z === 1 ? 60 : 120) : 450) && Math.random() < 0.0022 * d) {
      if (W.bl[k] === 1 || landValue(i, j, z) >= 1) { W.bl[k]++; W.cons[k] = 8 + ((Math.random() * 6) | 0); changed = true; }
    }
  }
  // a mata volta a ocupar terreno vazio; mais rápido com chuva
  const tries = 6 + Math.round(G.rain * 10);
  for (let n = 0; n < tries; n++) {
    const i = (Math.random() * N) | 0, j = (Math.random() * N) | 0, k = ix(i, j);
    if (W.ter[k] !== 0 || W.tree[k] || W.road[k] || W.zone[k]) continue;
    let adj = 0;
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inb(i + a, j + b)) { const t = W.tree[ix(i + a, j + b)]; if (t && !isRock(t)) adj++; }
    if (adj && Math.random() < 0.25 * adj) W.tree[k] = T_SINGLE[(Math.random() * T_SINGLE.length) | 0];
  }
  if (changed) stats();
}

export function monthTick() {
  stats();
  const inc = G.pop * 0.7 + (G.jC + G.jI) * 0.5, exp = G.roads * 0.6 + G.parks * 3;
  G.last = Math.round(inc - exp); G.money += G.last; G.month++;
  rollWeather();
  save();
}

// Chuva por estação: verão chuvoso com temporais, inverno seco.
const RAIN_CHANCE = [0.55, 0.3, 0.12, 0.35];
export function rollWeather() {
  const s = season();
  if (Math.random() < RAIN_CHANCE[s]) {
    G.rainTarget = 0.4 + Math.random() * 0.6;
    G.storm = s === 0 && G.rainTarget > 0.75;
  } else { G.rainTarget = 0; G.storm = false; }
}

export function weatherStep(dt) {
  G.tod = (G.tod + dt / DAY_LEN) % 1;
  G.rain += clamp(G.rainTarget - G.rain, -dt * 0.15, dt * 0.15);
}

export const weatherName = () =>
  G.rain > 0.05 ? (G.storm && G.rain > 0.5 ? 'Temporal' : G.rain > 0.5 ? 'Chuva' : 'Garoa') : G.rainTarget > 0 ? 'Nublado' : 'Céu limpo';
