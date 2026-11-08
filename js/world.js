// Estado do mundo: mapa, cidade, geração e salvamento.
// Todo o estado que precisa ir para outros jogadores fica em W (mapa) e G (cidade).
import { rng, h2, sm, fbm, clamp } from './util.js';
import { T_SINGLE, T_DOUBLE, T_TRIPLE, T_ROCK, T_IPE, isRock } from './sprites/nature.js';

export const N = 64;
export const S = N * N;
export const CX = 29, CY = 32; // centro da clareira inicial; a rodovia entra por (N-1, CY)

export const W = {
  ter: new Uint8Array(S),   // 0 grama, 1 água, 2 areia
  gs: new Uint8Array(S),    // tom da grama
  sv: new Uint8Array(S),    // variação de textura
  tree: new Uint8Array(S),  // índice em TREE (0 = nada)
  zone: new Uint8Array(S),  // 0 nada, 1 R, 2 C, 3 I, 4 praça
  road: new Uint8Array(S),
  bl: new Uint8Array(S),    // nível do prédio (0 = vazio)
  bv: new Uint8Array(S),    // variante visual
  cons: new Uint8Array(S),  // ticks de obra restantes
};
export const near = new Uint8Array(S); // há rua a até 2 quadras

export const G = {
  seed: 1, money: 20000, month: 0, last: 0, speed: 1,
  tod: 0.35,                   // hora do dia (0 = meia-noite, 0.5 = meio-dia)
  rain: 0, rainTarget: 0, storm: false,
  pop: 0, jC: 0, jI: 0, roads: 0, parks: 0, dR: 0.8, dC: 0.2, dI: 0.3,
};

export const ix = (i, j) => i * N + j;
export const inb = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
export const CAP = { 1: [0, 5, 16, 48], 2: [0, 6, 18, 50], 3: [0, 12, 30], 4: [0, 0] };
export const MAXL = { 1: 3, 2: 3, 3: 2, 4: 1 };
export const BNAME = { 1: ['', 'Casa', 'Sobrado', 'Prédio'], 2: ['', 'Mercadinho', 'Loja', 'Escritórios'], 3: ['', 'Galpão', 'Fábrica'], 4: ['', 'Praça'] };

// Estações no hemisfério sul.
export const SEASONS = ['Verão', 'Outono', 'Inverno', 'Primavera'];
export const season = (m = G.month) => [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][m % 12];
export const ipeBloom = (m = G.month) => { const k = m % 12; return k === 6 || k === 7 || k === 8; }; // jul–set

export function generate(seed) {
  for (const k in W) W[k].fill(0);
  const r = rng(seed);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const k = ix(i, j);
    const h = fbm(i / 16, j / 16, seed), m = fbm(i / 10 + 40, j / 10 + 40, seed + 50), rv = Math.abs(fbm(i / 24 + 9, j / 24 + 3, seed + 99) - 0.5);
    const dc = Math.hypot(i - CX, j - CY);
    let t = 0;
    if ((h < 0.3 || rv < 0.024) && dc > 7) t = 1;
    else if ((h < 0.34 || rv < 0.042) && dc > 6) t = 2;
    W.ter[k] = t; W.gs[k] = clamp(Math.floor(m * 5 - 0.6), 0, 3); W.sv[k] = (h2(i, j, seed + 3) * 6) | 0;
    if (t === 1) continue;
    let dens = sm(clamp((m - 0.3) / 0.4, 0, 1)) * 0.85 + 0.22;
    if (t === 2) dens *= 0.25;
    if (dc < 6) dens *= 0.08 + dc / 30;
    const q = h2(i, j, seed + 7);
    if (h > 0.7 && q < 0.1) { W.tree[k] = T_ROCK[(r() * 3) | 0]; continue; }
    if (q < dens) {
      if (r() < 0.04) { W.tree[k] = T_IPE[(r() * T_IPE.length) | 0]; continue; }
      const p = r(), grp = dens > 0.75 && p < 0.55 ? T_TRIPLE : dens > 0.5 && p < 0.6 ? T_DOUBLE : T_SINGLE;
      W.tree[k] = grp[(r() * grp.length) | 0];
    }
  }
  for (let i = CX + 1; i < N; i++) { const k = ix(i, CY); W.road[k] = 1; W.tree[k] = 0; W.ter[k] = 0; }
  Object.assign(G, { seed, money: 20000, month: 0, last: 0, tod: 0.35, rain: 0, rainTarget: 0, storm: false });
  afterRoads(); stats();
}

export function afterRoads() {
  near.fill(0); let n = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (W.road[ix(i, j)]) {
    n++;
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (inb(i + a, j + b)) near[ix(i + a, j + b)] = 1;
  }
  G.roads = n;
}

export function stats() {
  let pop = 0, jC = 0, jI = 0, parks = 0;
  for (let k = 0; k < S; k++) {
    const z = W.zone[k], l = W.bl[k];
    if (!l || W.cons[k]) continue;
    if (z === 1) pop += CAP[1][l]; else if (z === 2) jC += CAP[2][l]; else if (z === 3) jI += CAP[3][l]; else if (z === 4) parks++;
  }
  Object.assign(G, { pop, jC, jI, parks });
  const workers = pop * 0.5, jobs = jC + jI;
  G.dR = clamp((jobs - workers + 24 + parks * 2) / 30, -1, 1);
  G.dC = clamp((pop * 0.22 - jC + 4) / 18, -1, 1);
  G.dI = clamp((workers * 0.65 - jI + 8) / 22, -1, 1);
}

export function landValue(i, j, z) {
  let v = 0.6;
  for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) {
    if (!inb(i + a, j + b)) continue;
    const k = ix(i + a, j + b);
    if (W.zone[k] === 4) v += 0.22;
    else if (W.zone[k] === 3 && W.bl[k] && z !== 3) v -= 0.16;
    if (W.ter[k] === 1) v += 0.03;
    if (W.tree[k] && !isRock(W.tree[k])) v += 0.02;
  }
  return clamp(v, 0.1, 2);
}

/* ---------- salvar e carregar ---------- */
const SKEY = 'clareira-v2', OLD = 'clareira-v1';
const GKEYS = ['seed', 'money', 'month', 'last', 'tod'];
export function snapshot() {
  const o = { v: 2, g: {} };
  for (const k of GKEYS) o.g[k] = G[k];
  for (const k in W) o[k] = Array.from(W[k]);
  return o;
}
export function restore(o) {
  for (const k in W) if (!o[k] || o[k].length !== S) return false;
  for (const k in W) W[k].set(o[k]);
  Object.assign(G, o.g);
  afterRoads(); stats();
  return true;
}
export function save() { try { localStorage.setItem(SKEY, JSON.stringify(snapshot())); } catch (e) { /* armazenamento indisponível */ } }
export function load() {
  try {
    const s = localStorage.getItem(SKEY) || localStorage.getItem(OLD);
    return s ? restore(JSON.parse(s)) : false;
  } catch (e) { return false; }
}
