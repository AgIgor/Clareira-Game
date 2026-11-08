// Utilidades gerais: números aleatórios com semente, ruído, cores.
export const TAU = Math.PI * 2;

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const h2 = (i, j, s) => {
  const x = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453;
  return x - Math.floor(x);
};

export const sm = t => t * t * (3 - 2 * t);

export function vnoise(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy);
  const a = h2(ix, iy, s), b = h2(ix + 1, iy, s), c = h2(ix, iy + 1, s), d = h2(ix + 1, iy + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export function fbm(x, y, s) {
  let a = 0, amp = 0.5, f = 1;
  for (let k = 0; k < 4; k++) { a += amp * vnoise(x * f, y * f, s + k * 13.1); amp *= 0.5; f *= 2; }
  return a / 0.9375;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const fmt = n => Math.round(n).toLocaleString('pt-BR');

export function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

// Clareia (a>0) ou escurece (a<0) uma cor hex.
export function shade(h, a) {
  const [r, g, b] = hexRgb(h), t = a < 0 ? 0 : 255, p = Math.abs(a);
  return `rgb(${Math.round(r + (t - r) * p)},${Math.round(g + (t - g) * p)},${Math.round(b + (t - b) * p)})`;
}
