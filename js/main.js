// Ponto de entrada: inicia o mundo e roda o laço do jogo.
import { G, W, S, CX, CY, generate, load, save } from './world.js';
import { growthTick, monthTick, weatherStep, rollWeather, GROW_STEP, MONTH_LEN } from './sim.js';
import { perform } from './tools.js';
import { cars, smoke, updCars, updSmoke, updRain } from './agents.js';
import { resize, draw, cam, centerOn } from './render.js';
import { refreshHUD, setSpeed, setTool, setInfo, setInfoActions, describe, toast, setActionHandler, keyPan } from './ui.js';

addEventListener('resize', resize); resize();

// Por enquanto as ações são aplicadas aqui mesmo; no multiplayer passam pela rede antes.
setActionHandler(action => {
  const r = perform(action);
  if (r.msg) toast(r.msg);
  refreshHUD();
});

function newMap() {
  generate((Math.random() * 1e9) | 0);
  cars.length = 0; smoke.length = 0;
  centerOn(CX, CY); refreshHUD(); save();
}
function infoActions() {
  const w = document.createElement('div'); w.className = 'acts';
  const b = document.createElement('button'); b.textContent = 'Novo mapa';
  b.addEventListener('click', () => {
    if (b.dataset.armed) { newMap(); setInfo('Novo mapa', 'Mata virgem e uma rodovia. Boa sorte, prefeito.'); return; }
    b.dataset.armed = 1; b.textContent = 'Confirmar? Apaga a cidade'; b.classList.add('warn');
    setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = 'Novo mapa'; b.classList.remove('warn'); } }, 3500);
  });
  w.append(b);
  return w;
}

if (!load()) generate(20261108);
rollWeather();
centerOn(CX, CY);
cam.z = Math.min(1.3, Math.max(0.75, innerWidth / 1100));
setTool('mover'); setSpeed(1); refreshHUD();
setInfoActions(infoActions());
setInfo('Clareira', 'Passe o mouse ou toque no mapa para ver detalhes.');

const hint = document.getElementById('hint');
let seen = false; try { seen = !!localStorage.getItem('clareira-hint'); } catch (e) { /* sem armazenamento */ }
if (!seen) hint.hidden = false;
document.getElementById('hintOk').addEventListener('click', () => {
  hint.hidden = true; setTool('rua');
  try { localStorage.setItem('clareira-hint', '1'); } catch (e) { /* sem armazenamento */ }
});

let lastT = performance.now(), gAcc = 0, mAcc = 0, hudAcc = 0;
const SPEEDS = [0, 1, 2.2, 4];
function frame(t) {
  const real = Math.max(0, Math.min(0.1, (t - lastT) / 1000)); lastT = t;
  const dt = real * SPEEDS[G.speed];
  if (dt) {
    gAcc += dt; mAcc += dt;
    while (gAcc >= GROW_STEP) { gAcc -= GROW_STEP; growthTick(); }
    if (mAcc >= MONTH_LEN) { mAcc -= MONTH_LEN; monthTick(); }
    weatherStep(dt);
    updCars(dt * 1.1);
    updSmoke(dt);
  }
  updRain(dt, G.speed ? real : 0);
  keyPan(real);
  hudAcc += real; if (hudAcc > 0.25) { hudAcc = 0; refreshHUD(); }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Atalho de depuração no console: window.clareira
window.clareira = { G, W, S, perform, describe };
