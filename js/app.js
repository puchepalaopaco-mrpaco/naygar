import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildTruck, SIDE_TEX, REAR_TEX, BOX } from './truck.js';
import {
  drawSide, drawRear, drawSymbol, SIDE_DESIGNS, REAR_DESIGNS, PALETTES, SWATCHES,
  setCustomLogo, setLogoTint, FONT_WORD, FONT_MONO,
} from './brand.js';

const $ = (s) => document.querySelector(s);
const STORE = 'naygar-lonas-versiones';

// ---------- Estado ----------
const state = {
  palette: 0,
  bg: PALETTES[0].bg, symbol: PALETTES[0].symbol, text: PALETTES[0].text,
  side: 1, rear: 1, logo: null, tint: true,
};
const colors = () => ({ bg: state.bg, symbol: state.symbol, text: state.text });

// ---------- Texturas de lona ----------
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const cvRight = makeCanvas(SIDE_TEX.w, SIDE_TEX.h);
const cvLeft = makeCanvas(SIDE_TEX.w, SIDE_TEX.h);
const cvRear = makeCanvas(REAR_TEX.w, REAR_TEX.h);
const texOf = (cv) => {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const texRight = texOf(cvRight), texLeft = texOf(cvLeft), texRear = texOf(cvRear);

function paintTextures() {
  const c = colors();
  drawSide(cvRight.getContext('2d'), cvRight.width, cvRight.height, state.side, c, false);
  drawSide(cvLeft.getContext('2d'), cvLeft.width, cvLeft.height, state.side, c, true);
  drawRear(cvRear.getContext('2d'), cvRear.width, cvRear.height, state.rear, c);
  texRight.needsUpdate = texLeft.needsUpdate = texRear.needsUpdate = true;
}

// ---------- Escena 3D ----------
const host = $('#viewer');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe6e6e6);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environmentIntensity = 0.25;

scene.add(new THREE.HemisphereLight(0xffffff, 0xbdbdbd, 0.85));
const sun = new THREE.DirectionalLight(0xffffff, 0.95);
sun.position.set(6, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
sun.shadow.bias = -0.0005;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.45);
fill.position.set(-10, 6, -8);
scene.add(fill);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.16 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const { truck } = buildTruck(texLeft, texRight, texRear);
scene.add(truck);
const maxAniso = renderer.capabilities.getMaxAnisotropy();
[texLeft, texRight, texRear].forEach((t) => (t.anisotropy = maxAniso));

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 4;
controls.maxDistance = 40;

// ---------- Vistas ----------
const VIEWS = {
  front34: { dir: [1, 0.3, 1.1], target: [-0.6, 1.9, 0], r: 4.9 },
  rear34: { dir: [-1, 0.3, 0.95], target: [-0.9, 2.0, 0], r: 4.9 },
  right: { dir: [0, 0.04, 1], target: [-0.75, 2.0, 0], r: 5.0 },
  left: { dir: [0, 0.04, -1], target: [-0.75, 2.0, 0], r: 5.0 },
  rear: { dir: [-1, 0.03, 0], target: [BOX.x0, 2.1, 0], r: 2.4 },
};
function viewPose(name, aspect) {
  const v = VIEWS[name];
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
  const dist = v.r / Math.sin(Math.min(vfov, hfov) / 2);
  const target = new THREE.Vector3(...v.target);
  const pos = new THREE.Vector3(...v.dir).normalize().multiplyScalar(dist).add(target);
  return { pos, target };
}
let anim = null;
function goView(name, instant = false) {
  const { pos, target } = viewPose(name, camera.aspect);
  document.querySelectorAll('.views button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  if (instant) {
    camera.position.copy(pos); controls.target.copy(target); controls.update(); anim = null; return;
  }
  anim = { from: camera.position.clone(), fromT: controls.target.clone(), pos, target, t0: performance.now(), dur: 650 };
}
document.querySelectorAll('.views button').forEach((b) => b.addEventListener('click', () => goView(b.dataset.view)));
controls.addEventListener('start', () => {
  anim = null;
  document.querySelectorAll('.views button').forEach((b) => b.classList.remove('active'));
});

function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(host);
resize();
goView('front34', true);

renderer.setAnimationLoop((now) => {
  if (anim) {
    const k = Math.min(1, (now - anim.t0) / anim.dur);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(anim.from, anim.pos, e);
    controls.target.lerpVectors(anim.fromT, anim.target, e);
    if (k >= 1) anim = null;
  }
  controls.update();
  renderer.render(scene, camera);
});

// Captura una vista a tamaño fijo (para PDF y miniaturas)
function capture(name, w, h, quality = 0.9) {
  const prev = { pos: camera.position.clone(), target: controls.target.clone(), aspect: camera.aspect, pr: renderer.getPixelRatio() };
  const size = renderer.getSize(new THREE.Vector2());
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const { pos, target } = viewPose(name, camera.aspect);
  camera.position.copy(pos); camera.lookAt(target);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/jpeg', quality);
  renderer.setPixelRatio(prev.pr);
  renderer.setSize(size.x, size.y, false);
  camera.aspect = prev.aspect; camera.updateProjectionMatrix();
  camera.position.copy(prev.pos); controls.target.copy(prev.target); camera.lookAt(prev.target);
  return url;
}

// ---------- Interfaz ----------
function paletteChip(p) {
  const cv = makeCanvas(108, 80);
  const x = cv.getContext('2d');
  x.fillStyle = p.bg; x.fillRect(0, 0, 108, 80);
  drawSymbol(x, 22, 22, 26, p.symbol);
  x.fillStyle = p.text; x.fillRect(22, 56, 64, 6);
  return cv;
}

function buildPalettes() {
  const wrap = $('#palettes');
  wrap.innerHTML = '';
  PALETTES.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'pal' + (state.palette === i ? ' active' : '');
    b.title = p.name; b.setAttribute('aria-label', 'Paleta ' + p.name);
    b.appendChild(paletteChip(p));
    b.onclick = () => {
      Object.assign(state, { palette: i, bg: p.bg, symbol: p.symbol, text: p.text });
      refresh();
    };
    wrap.appendChild(b);
  });
}

function buildColorRows() {
  document.querySelectorAll('.color-row').forEach((row) => {
    const key = row.dataset.key;
    const sw = row.querySelector('.sw');
    const input = row.querySelector('input');
    sw.innerHTML = '';
    SWATCHES.forEach((hex) => {
      const b = document.createElement('button');
      b.style.background = hex; b.title = hex; b.dataset.hex = hex;
      b.onclick = () => { state[key] = hex; state.palette = -1; refresh(); };
      sw.appendChild(b);
    });
    input.oninput = () => { state[key] = input.value.toUpperCase(); state.palette = -1; refresh(false); };
    input.onchange = () => refresh();
  });
}
function syncColorRows() {
  document.querySelectorAll('.color-row').forEach((row) => {
    const v = state[row.dataset.key].toUpperCase();
    row.querySelector('input').value = v.length === 7 ? v.toLowerCase() : '#000000';
    row.querySelectorAll('.sw button').forEach((b) => b.classList.toggle('active', b.dataset.hex.toUpperCase() === v));
  });
}

const sideThumbs = [], rearThumbs = [];
function buildDesigns() {
  const side = $('#sideDesigns'), rear = $('#rearDesigns');
  SIDE_DESIGNS.forEach((d) => {
    const b = document.createElement('button');
    b.className = 'design';
    const cv = makeCanvas(300, Math.round(300 * SIDE_TEX.h / SIDE_TEX.w));
    b.append(cv, Object.assign(document.createElement('span'), { textContent: d.name }));
    b.onclick = () => { state.side = d.id; refresh(); };
    side.appendChild(b);
    sideThumbs.push({ b, cv, d });
  });
  REAR_DESIGNS.forEach((d) => {
    const b = document.createElement('button');
    b.className = 'design';
    const cv = makeCanvas(150, Math.round(150 * REAR_TEX.h / REAR_TEX.w));
    b.append(cv, Object.assign(document.createElement('span'), { textContent: d.name }));
    b.onclick = () => { state.rear = d.id; refresh(); };
    rear.appendChild(b);
    rearThumbs.push({ b, cv, d });
  });
}
function paintThumbs() {
  const c = colors();
  sideThumbs.forEach(({ b, cv, d }) => {
    drawSide(cv.getContext('2d'), cv.width, cv.height, d.id, c, false);
    b.classList.toggle('active', d.id === state.side);
  });
  rearThumbs.forEach(({ b, cv, d }) => {
    const x = cv.getContext('2d');
    drawRear(x, cv.width, cv.height, d.id, c);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(cv.width / 2 - 0.5, 0, 1, cv.height); // junta de puertas
    b.classList.toggle('active', d.id === state.rear);
  });
}

function refresh(full = true) {
  paintTextures();
  if (full) {
    paintThumbs();
    document.querySelectorAll('.pal').forEach((b, i) => b.classList.toggle('active', i === state.palette));
  }
  syncColorRows();
}

// ---------- Logo propio ----------
function loadImage(src) {
  return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
}
async function applyLogo(dataUrl) {
  if (!dataUrl) { setCustomLogo(null); state.logo = null; $('#logoReset').hidden = true; return; }
  const img = await loadImage(dataUrl);
  setCustomLogo(img);
  state.logo = dataUrl;
  $('#logoReset').hidden = false;
}
$('#logoInput').addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try { await applyLogo(r.result); refresh(); buildPalettes(); toast('Logo cargado'); } catch { toast('No se pudo leer el archivo'); }
  };
  r.readAsDataURL(f);
  e.target.value = '';
});
$('#logoReset').onclick = async () => { await applyLogo(null); refresh(); buildPalettes(); };
$('#logoTint').onchange = (e) => { state.tint = e.target.checked; setLogoTint(state.tint); refresh(); };

// ---------- Versiones ----------
function loadVersions() { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; } }
function saveVersions(list) {
  try { localStorage.setItem(STORE, JSON.stringify(list)); return true; }
  catch { toast('No hay espacio para guardar (prueba con un logo más ligero)'); return false; }
}
let versions = loadVersions();

function snapshot() { return { ...state }; }
async function applyState(s) {
  Object.assign(state, s);
  setLogoTint(state.tint !== false);
  $('#logoTint').checked = state.tint !== false;
  await applyLogo(state.logo);
  refresh();
}

function renderVersions() {
  const wrap = $('#versions');
  wrap.innerHTML = '';
  $('#vcount').textContent = versions.length ? `(${versions.length})` : '';
  $('#pdfAllBtn').hidden = versions.length < 2;
  versions.forEach((v, i) => {
    const el = document.createElement('div');
    el.className = 'ver';
    el.innerHTML = `
      <img alt="" title="Cargar esta versión">
      <div class="meta"><input aria-label="Nombre de la versión"><small></small></div>
      <div class="ops">
        <button data-op="load" title="Cargar">↺</button>
        <button data-op="pdf" title="Descargar PDF">⤓</button>
        <button data-op="del" title="Borrar">✕</button>
      </div>`;
    el.querySelector('img').src = v.thumb;
    const inp = el.querySelector('input');
    inp.value = v.name;
    inp.onchange = () => { v.name = inp.value.trim() || v.name; saveVersions(versions); };
    el.querySelector('small').textContent = `Caja ${v.state.side} · Trasera ${v.state.rear} · ${new Date(v.date).toLocaleDateString('es-ES')}`;
    const load = async () => { await applyState(v.state); toast(`Cargada «${v.name}»`); };
    el.querySelector('img').onclick = load;
    el.querySelector('[data-op=load]').onclick = load;
    el.querySelector('[data-op=pdf]').onclick = () => exportPdf([v]);
    el.querySelector('[data-op=del]').onclick = () => {
      if (!confirm(`¿Borrar «${v.name}»?`)) return;
      versions.splice(i, 1); saveVersions(versions); renderVersions();
    };
    wrap.appendChild(el);
  });
}

$('#saveBtn').onclick = () => {
  const name = `Versión ${versions.length + 1}`;
  const v = { id: Date.now(), name, date: Date.now(), state: snapshot(), thumb: capture('front34', 360, 240, 0.8) };
  versions.unshift(v);
  if (!saveVersions(versions)) { versions.shift(); return; }
  renderVersions();
  toast(`Guardada «${name}»`);
  const first = $('#versions input');
  if (first) { first.focus(); first.select(); }
};

// ---------- PDF ----------
function hexLabel(h) { return h.toUpperCase(); }
function addVersionPage(doc, title) {
  const W = 297, H = 210, m = 12;
  const ink = [20, 20, 20], muted = [110, 110, 110];
  doc.setFillColor(230, 230, 230); doc.rect(0, 0, W, H, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...ink);
  doc.text('NAYGAR', m, 15);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...muted);
  doc.text('SIMULADOR DE LONAS', m + 30, 15);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...ink);
  doc.text(title, W - m, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...muted);
  doc.text(new Date().toLocaleString('es-ES'), W - m, 20, { align: 'right' });

  // Vistas 3D
  const mainW = 180, mainH = 108;
  doc.addImage(capture('front34', 1800, 1080), 'JPEG', m, 25, mainW, mainH);
  const colX = m + mainW + 6, colW = W - m - colX;
  doc.addImage(capture('rear34', 1000, 640), 'JPEG', colX, 25, colW, colW * 0.64);
  const rearH = mainH - colW * 0.64 - 4;
  doc.addImage(capture('rear', Math.round(1000 * colW / rearH), 1000), 'JPEG', colX, 25 + colW * 0.64 + 4, colW, rearH);

  // Artes planos
  const y2 = 25 + mainH + 8;
  doc.setFontSize(8); doc.setTextColor(...muted);
  doc.text(`LONA LATERAL · CAJA ${state.side}`, m, y2 - 2);
  const sideH = mainW * SIDE_TEX.h / SIDE_TEX.w;
  doc.addImage(cvRight.toDataURL('image/jpeg', 0.92), 'JPEG', m, y2, mainW, sideH);
  doc.setDrawColor(200); doc.rect(m, y2, mainW, sideH);

  doc.text(`PUERTA TRASERA · ${state.rear}`, colX, y2 - 2);
  const rw = 40, rh = rw * REAR_TEX.h / REAR_TEX.w;
  doc.addImage(cvRear.toDataURL('image/jpeg', 0.92), 'JPEG', colX, y2, rw, rh);
  doc.rect(colX, y2, rw, rh);
  doc.line(colX + rw / 2, y2, colX + rw / 2, y2 + rh);

  // Colores
  let cy = y2 + 4;
  const cx = colX + rw + 6;
  [['Fondo lona', state.bg], ['Símbolo', state.symbol], ['Texto', state.text]].forEach(([k, v]) => {
    const rgb = new THREE.Color(v);
    doc.setFillColor(Math.round(rgb.r * 255), Math.round(rgb.g * 255), Math.round(rgb.b * 255));
    doc.setDrawColor(180);
    doc.roundedRect(cx, cy - 3.5, 6, 6, 1, 1, 'FD');
    doc.setTextColor(...ink); doc.setFontSize(8); doc.text(k, cx + 8, cy);
    doc.setTextColor(...muted); doc.text(hexLabel(v), cx + 8, cy + 3.5);
    cy += 12;
  });
}

async function exportPdf(list) {
  if (!window.jspdf) { toast('Cargando generador de PDF…'); return; }
  const btns = [$('#pdfBtn'), $('#pdfAllBtn')];
  btns.forEach((b) => (b.disabled = true));
  toast('Generando PDF…');
  await new Promise((r) => setTimeout(r, 30));
  const saved = snapshot();
  try {
    const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
    for (let i = 0; i < list.length; i++) {
      if (i) doc.addPage();
      if (list[i].state) await applyState(list[i].state);
      addVersionPage(doc, list[i].name);
    }
    const name = list.length === 1 ? list[0].name : 'comparativa';
    doc.save(`NAYGAR-lonas-${name.replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]+/g, '').replace(/\s+/g, '-')}.pdf`);
    toast('PDF descargado');
  } catch (e) {
    console.error(e); toast('Error al generar el PDF');
  } finally {
    await applyState(saved);
    btns.forEach((b) => (b.disabled = false));
  }
}
$('#pdfBtn').onclick = () => exportPdf([{ name: 'Versión actual' }]);
$('#pdfAllBtn').onclick = () => exportPdf([...versions].reverse());

// ---------- Aviso ----------
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- Arranque ----------
buildPalettes();
buildColorRows();
buildDesigns();
refresh();
renderVersions();
// Redibuja cuando las tipografías de marca estén cargadas
Promise.all([
  document.fonts.load(`700 100px ${FONT_WORD}`),
  document.fonts.load(`600 40px ${FONT_MONO}`),
]).then(() => refresh()).catch(() => {});
document.fonts.ready.then(() => refresh());
window.__naygar = { state, refresh, goView }; // útil para depurar
