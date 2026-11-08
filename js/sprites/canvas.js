// Fábrica de sprites: cada sprite é desenhado por código num canvas em cache.
import { GL } from '../iso.js';
import { rng } from '../util.js';

export const SW = 112, SH = 210, AX = 56, AY = 186, SS = 2;

export function sprite(fn) {
  const c = document.createElement('canvas');
  c.width = SW * SS; c.height = SH * SS;
  const x = c.getContext('2d');
  x.scale(SS, SS); x.translate(AX, AY); x.lineJoin = 'round';
  fn(x);
  return c;
}

// Silhueta preta do sprite: tampa as luzes que ficam atrás dele na camada noturna.
const SIL = new WeakMap();
export function silhouette(img) {
  let s = SIL.get(img);
  if (!s) {
    s = document.createElement('canvas'); s.width = img.width; s.height = img.height;
    const x = s.getContext('2d');
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#000'; x.fillRect(0, 0, s.width, s.height);
    SIL.set(img, s);
  }
  return s;
}

// Camada noturna: silhueta + só as janelas e letreiros acesos.
export function glowSprite(img, fn, seed, lit = 0.55) {
  const out = document.createElement('canvas'); out.width = img.width; out.height = img.height;
  const x = out.getContext('2d');
  x.drawImage(silhouette(img), 0, 0);
  x.save(); x.scale(SS, SS); x.translate(AX, AY); x.globalAlpha = 0;
  GL.on = true; GL.r = rng(seed); GL.lit = lit;
  try { fn(x); } finally { GL.on = false; x.restore(); }
  return out;
}
