// Ferramentas do prefeito. Toda mudança no mapa vira uma "ação" serializável:
// { type: 'build', tool, a: [i, j], b: [i, j] }. No multiplayer, as ações viajam pela rede
// e o anfitrião aplica com a mesma função perform().
import { N, W, G, ix, afterRoads, stats, save } from './world.js';
import { isRock } from './sprites/nature.js';
import { fmt } from './util.js';

export const TOOLS = [
  { id: 'mover', name: 'Mover', cost: 0, icon: 'M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3' },
  { id: 'limpar', name: 'Limpar', cost: 3, col: '#c9a36a', icon: 'M13 4l7 7-4 4-7-7zM10 9L3 20M15 6l3-3' },
  { id: 'rua', name: 'Rua', cost: 10, col: '#b8b6ae', icon: 'M8 3L5 21M16 3l3 18M12 4v3M12 10.5v3M12 17v3' },
  { id: 'res', name: 'Residencial', cost: 2, zone: 1, col: '#86c463', icon: 'M4 11l8-7 8 7v9H4zM10 20v-5h4v5' },
  { id: 'com', name: 'Comercial', cost: 2, zone: 2, col: '#62a6dc', icon: 'M4 9h16l-1.5-4h-13zM5 9v11h14V9M9 20v-6h6v6' },
  { id: 'ind', name: 'Industrial', cost: 2, zone: 3, col: '#e3b540', icon: 'M3 20V11l5 3v-3l5 3V5h3V3h3v17z' },
  { id: 'praca', name: 'Praça', cost: 40, zone: 4, col: '#86c463', icon: 'M12 21v-6M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM6 21h12' },
  { id: 'demolir', name: 'Demolir', cost: 5, col: '#de6a4c', icon: 'M6 6l12 12M18 6L6 18' },
];
export const toolById = id => TOOLS.find(t => t.id === id);

// Custo de aplicar a ferramenta num ladrilho: >0 custa, 0 nada a fazer, -1 inválido.
export function evalTile(k, t) {
  const ter = W.ter[k], tr = W.tree[k];
  if (t.id === 'limpar') return tr ? (isRock(tr) ? 8 : 3) : 0;
  if (t.id === 'rua') { if (ter === 1 || W.bl[k]) return -1; if (W.road[k]) return 0; return 10 + (tr ? 3 : 0); }
  if (t.zone) {
    if (ter === 1 || W.road[k]) return -1;
    if (W.zone[k] === t.zone) return 0;
    if (W.bl[k]) return -1;
    return t.cost + (t.zone === 4 && tr ? 3 : 0);
  }
  if (t.id === 'demolir') { if (W.bl[k] || W.road[k]) return 5; if (W.zone[k]) return 0.001; return 0; }
  return 0;
}

function applyTile(k, t) {
  const i = (k / N) | 0, j = k % N;
  if (t.id === 'limpar') W.tree[k] = 0;
  else if (t.id === 'rua') { W.road[k] = 1; W.tree[k] = 0; W.zone[k] = 0; W.bl[k] = 0; W.cons[k] = 0; if (W.ter[k] !== 2) W.ter[k] = 0; }
  else if (t.zone === 4) { W.zone[k] = 4; W.bl[k] = 1; W.bv[k] = (i * 7 + j * 3) % 6; W.cons[k] = 0; W.tree[k] = 0; }
  else if (t.zone) { W.zone[k] = t.zone; W.bl[k] = 0; W.cons[k] = 0; }
  else if (t.id === 'demolir') { W.bl[k] = 0; W.zone[k] = 0; W.road[k] = 0; W.cons[k] = 0; }
}

// Ladrilhos afetados: rua segue um caminho em L, o resto preenche um retângulo.
export function tilesFor(toolId, a, b) {
  const out = [];
  if (toolId === 'rua') {
    let i = a[0], j = a[1];
    const si = Math.sign(b[0] - i), sj = Math.sign(b[1] - j);
    out.push(ix(i, j));
    while (i !== b[0]) { i += si; out.push(ix(i, j)); }
    while (j !== b[1]) { j += sj; out.push(ix(i, j)); }
    return out;
  }
  const i0 = Math.min(a[0], b[0]), i1 = Math.max(a[0], b[0]), j0 = Math.min(a[1], b[1]), j1 = Math.max(a[1], b[1]);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) out.push(ix(i, j));
  return out;
}

export function quote(toolId, a, b) {
  const t = toolById(toolId), tiles = [];
  let total = 0;
  for (const k of tilesFor(toolId, a, b)) { const c = evalTile(k, t); tiles.push([k, c]); if (c > 0) total += c; }
  return { tool: t, tiles, total: Math.round(total) };
}

// Aplica uma ação. Devolve { ok, msg }.
export function perform(action) {
  if (action.type !== 'build') return { ok: false };
  const q = quote(action.tool, action.a, action.b), t = q.tool;
  if (q.total > G.money) return { ok: false, msg: `Dinheiro insuficiente: a obra custa R$ ${fmt(q.total)}` };
  let n = 0, roads = false;
  for (const [k, c] of q.tiles) if (c > 0) { applyTile(k, t); n++; if (t.id === 'rua' || t.id === 'demolir') roads = true; }
  G.money -= q.total;
  if (roads) afterRoads();
  stats(); save();
  if (!n && q.tiles.some(p => p[1] < 0)) return { ok: false, msg: t.id === 'rua' ? 'Rua não passa por água nem por cima de prédios' : 'Não dá para marcar lote sobre água ou rua' };
  return { ok: true };
}
