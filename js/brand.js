// Dibujo de la marca NAYGAR sobre canvas 2D (lonas laterales y puertas traseras).
// Todos los diseños replican las propuestas del PDF "Diseño de caja" (Caja 1–9)
// y "Diseño puerta trasera" (Trasera 1–4).

import { SVG_DESIGNS, SYMBOL_PATHS, WORD_PATHS } from './designs.js';

export const FONT_WORD = '"Archivo", "Arial Black", sans-serif';
export const FONT_MONO = '"Overpass Mono", ui-monospace, monospace';
export const WEB = 'naygarlogistica.com';

// ---------- Símbolo (isotipo "//") ----------
// Trazados originales (Recurso 1 / Recurso 2). La caja envolvente se mide en el navegador.
const bboxCache = new Map();
export function pathsBBox(ds) {
  const key = ds.join('|').length + ':' + ds[0].slice(0, 40);
  if (bboxCache.has(key)) return bboxCache.get(key);
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden');
  const g = document.createElementNS(NS, 'g');
  ds.forEach((d) => { const el = document.createElementNS(NS, 'path'); el.setAttribute('d', d); g.appendChild(el); });
  svg.appendChild(g);
  document.body.appendChild(svg);
  const b = g.getBBox();
  svg.remove();
  const r = { x: b.x, y: b.y, w: b.width, h: b.height };
  bboxCache.set(key, r);
  return r;
}
const p2dCache = new Map();
const path2d = (d) => { if (!p2dCache.has(d)) p2dCache.set(d, new Path2D(d)); return p2dCache.get(d); };
const symBox = () => pathsBBox(SYMBOL_PATHS);
const wordBox = () => pathsBBox(WORD_PATHS);

let customLogo = null; // HTMLImageElement
export function setCustomLogo(img) { customLogo = img; }
export function hasCustomLogo() { return !!customLogo; }
let tintLogo = true;
export function setLogoTint(v) { tintLogo = v; }

function symbolRatio() {
  if (customLogo) {
    const w = customLogo.naturalWidth || customLogo.width, h = customLogo.naturalHeight || customLogo.height;
    return w && h ? w / h : symBox().w / symBox().h;
  }
  return symBox().w / symBox().h;
}

const tintCache = new Map();
function tintedLogo(color) {
  const key = color + '|' + customLogo.src.length;
  if (tintCache.has(key)) return tintCache.get(key);
  const w = Math.min(1600, customLogo.naturalWidth || 800);
  const h = Math.round(w / symbolRatio());
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.drawImage(customLogo, 0, 0, w, h);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, w, h);
  tintCache.clear();
  tintCache.set(key, c);
  return c;
}

// ---------- Caja envolvente del logo (para poder arrastrarlo) ----------
let BB = null;
function ext(x, y, w, h) {
  if (!BB) { BB = { x0: x, y0: y, x1: x + w, y1: y + h }; return; }
  BB.x0 = Math.min(BB.x0, x); BB.y0 = Math.min(BB.y0, y);
  BB.x1 = Math.max(BB.x1, x + w); BB.y1 = Math.max(BB.y1, y + h);
}

// Dibuja el símbolo con su esquina superior izquierda en (x, y) y alto h. Devuelve el ancho.
export function drawSymbol(ctx, x, y, h, color, mode = 'fill', tint = tintLogo) {
  const w = h * symbolRatio();
  ext(x, y, w, h);
  if (customLogo) {
    ctx.save();
    if (mode === 'stroke') ctx.globalAlpha = 0.28;
    ctx.drawImage(tint ? tintedLogo(color) : customLogo, x, y, w, h);
    ctx.restore();
    return w;
  }
  const b = symBox(), k = h / b.h;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(-b.x, -b.y);
  for (const d of SYMBOL_PATHS) {
    if (mode === 'stroke') {
      ctx.lineWidth = Math.max(0.012 * b.h, 1 / k);
      ctx.strokeStyle = color;
      ctx.stroke(path2d(d));
    } else {
      ctx.fillStyle = color;
      ctx.fill(path2d(d));
    }
  }
  ctx.restore();
  return w;
}
export function symbolWidth(h) { return h * symbolRatio(); }

// ---------- Logotipo NAYGAR + LOGISTICA ----------
const CAP = 0.72; // altura de mayúscula / tamaño de fuente (aprox. Archivo)

function setWordFont(ctx, size) {
  ctx.font = `700 ${size}px ${FONT_WORD}`;
  if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${-0.02 * size}px`;
}
function resetSpacing(ctx) { if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'; }

export function wordWidth(ctx, cap) { const b = wordBox(); return (b.w * cap) / b.h; }

// Dibuja "NAYGAR" con la línea base en y, empezando en x. cap = altura de mayúsculas.
// sub: muestra "LOGISTICA" debajo alineado a la derecha.
export function drawWordmark(ctx, x, y, cap, color, sub = true, subColor = color) {
  ctx.save();
  const b = wordBox(), k = cap / b.h;
  ctx.save();
  ctx.translate(x, y - cap);
  ctx.scale(k, k);
  ctx.translate(-b.x, -b.y);
  ctx.fillStyle = color;
  for (const d of WORD_PATHS) ctx.fill(path2d(d));
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  const w = b.w * k;
  ext(x, y - cap, w, sub ? cap * 1.45 : cap);
  if (sub) {
    const s = cap * 0.2;
    ctx.font = `700 ${s / CAP}px ${FONT_WORD}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.06 * s / CAP}px`;
    ctx.textAlign = 'right';
    ctx.fillStyle = subColor;
    ctx.fillText('LOGISTICA', x + w - cap * 0.02, y + s * 1.9);
  }
  resetSpacing(ctx);
  ctx.restore();
  return w;
}

function drawWeb(ctx, x, y, size, color, align = 'left') {
  ctx.save();
  ctx.font = `600 ${size}px ${FONT_MONO}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(WEB, x, y);
  const w = ctx.measureText(WEB).width;
  ext(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y - size * 0.8, w, size);
  ctx.restore();
}

// Bloque símbolo + NAYGAR en horizontal. Devuelve ancho total.
function lockupWidth(ctx, symH, cap, gap) { return symbolWidth(symH) + gap + wordWidth(ctx, cap); }
function drawLockup(ctx, x, cy, symH, cap, gap, c, symMode = 'fill') {
  drawSymbol(ctx, x, cy - symH / 2, symH, c.symbol, symMode);
  drawWordmark(ctx, x + symbolWidth(symH) + gap, cy + cap / 2, cap, c.text);
}

// ---------- Fondo de lona ----------
function paintBackground(ctx, W, H, c) {
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);
}

// ---------- Diseños laterales (Caja 1–9) ----------
// mirror = true para el lado en que la cabina queda a la izquierda.
export const SIDE_DESIGNS = Object.keys(SVG_DESIGNS).map((n) => ({ id: +n, name: 'Caja ' + n }));

// Margen para que el logo respire: el diseño ocupa como máximo este ancho/alto del lienzo.
const FIT = { w: 0.6, h: 0.46 };

// Texto "LOGISTICA." de los SVG: se ajusta al ancho que tiene en el diseño original.
function drawFittedText(ctx, t, color) {
  ctx.save();
  ctx.font = `700 ${t.size}px ${FONT_WORD}`;
  if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  const m = ctx.measureText(t.str).width || 1;
  ctx.translate(t.x, t.y);
  ctx.scale(t.width / m, 1);
  ctx.fillText(t.str, 0, 0);
  ctx.restore();
}

// Dibuja un diseño SVG centrado en el lienzo.
function drawSvgDesign(ctx, W, H, d, c) {
  const [, , vw, vh] = d.vb;
  const k = Math.min((W * FIT.w) / vw, (H * FIT.h) / vh);
  const x0 = (W - vw * k) / 2, y0 = (H - vh * k) / 2;
  ext(x0, y0, vw * k, vh * k);
  ctx.save();
  ctx.translate(x0, y0);
  ctx.scale(k, k);
  const symItems = d.items.filter((i) => i.role === 'symbol');
  if (customLogo && symItems.length) {
    // Logo subido por el usuario: ocupa el sitio del símbolo
    const b = pathsBBox(symItems.map((i) => i.d));
    const h = b.h, w = h * symbolRatio();
    ctx.save();
    ctx.translate(b.x + (b.w - w) / 2, b.y);
    ctx.scale(1 / k, 1 / k);
    const keep = BB;
    drawSymbol(ctx, 0, 0, h * k, c.symbol, symItems[0].stroke ? 'stroke' : 'fill');
    BB = keep;
    ctx.restore();
  }
  // El símbolo siempre debajo; el texto NAYGAR siempre por encima.
  const ordered = [...symItems, ...d.items.filter((i) => i.role !== 'symbol')];
  for (const it of ordered) {
    if (it.role === 'symbol' && customLogo) continue;
    const color = it.role === 'symbol' ? c.symbol : c.text;
    if (it.stroke) {
      ctx.lineWidth = Math.max(1, 1 / k);
      ctx.strokeStyle = color;
      ctx.stroke(path2d(it.d));
    } else {
      ctx.fillStyle = color;
      ctx.fill(path2d(it.d));
    }
  }
  for (const t of d.texts) drawFittedText(ctx, t, c.text);
  ctx.restore();
}

// Posición/tamaño del logo elegidos por el usuario: dx, dy en fracción del lienzo, s = escala.
export const DEFAULT_T = { dx: 0, dy: 0, s: 1 };

function withTransform(ctx, W, H, c, t, mirror, body) {
  ctx.clearRect(0, 0, W, H);
  paintBackground(ctx, W, H, c);
  const { dx = 0, dy = 0, s = 1 } = t || DEFAULT_T;
  const DX = (mirror ? -dx : dx) * W, DY = dy * H;
  ctx.save();
  ctx.translate(W / 2 + DX, H / 2 + DY);
  ctx.scale(s, s);
  ctx.translate(-W / 2, -H / 2);
  BB = null;
  body();
  ctx.restore();
  if (!BB) return null;
  const tx = (x) => (x - W / 2) * s + W / 2 + DX, ty = (y) => (y - H / 2) * s + H / 2 + DY;
  return { x0: tx(BB.x0), y0: ty(BB.y0), x1: tx(BB.x1), y1: ty(BB.y1) };
}

// Devuelve la caja del logo en píxeles del lienzo.
export function drawSide(ctx, W, H, design, c, mirror = false, t = null) {
  return withTransform(ctx, W, H, c, t, mirror, () => sideBody(ctx, W, H, design, c, mirror));
}

function sideBody(ctx, W, H, design, c) {
  const d = SVG_DESIGNS[design] || SVG_DESIGNS[1];
  drawSvgDesign(ctx, W, H, d, c);
}

// ---------- Diseños puerta trasera (Trasera 1–4) ----------
export const REAR_DESIGNS = [
  { id: 1, name: 'Trasera 1' }, { id: 2, name: 'Trasera 2' },
  { id: 3, name: 'Trasera 3' }, { id: 4, name: 'Trasera 4' },
];

export function drawRear(ctx, W, H, design, c, t = null) {
  return withTransform(ctx, W, H, c, t, false, () => rearBody(ctx, W, H, design, c));
}

function rearBody(ctx, W, H, design, c) {
  const half = W / 2;
  const webSize = H * 0.022;
  switch (design) {
    case 1: {
      const symH = H * 0.045, cap = H * 0.04, gap = H * 0.012;
      const w = lockupWidth(ctx, symH, cap, gap);
      drawLockup(ctx, half / 2 - w / 2, H * 0.31, symH, cap, gap, c);
      drawWeb(ctx, half + half / 2, H * 0.32, webSize, c.symbol, 'center');
      break;
    }
    case 2: {
      const symH = H * 0.1, cap = H * 0.085, gap = H * 0.02;
      const w = lockupWidth(ctx, symH, cap, gap);
      drawLockup(ctx, W / 2 - w / 2, H * 0.29, symH, cap, gap, c);
      drawWeb(ctx, half * 0.45, H * 0.47, webSize, c.symbol, 'center');
      break;
    }
    case 3: {
      const symH = H * 0.14, cap = H * 0.06;
      const sw = symbolWidth(symH), ww = wordWidth(ctx, cap);
      drawSymbol(ctx, half / 2 - sw / 2, H * 0.2, symH, c.symbol);
      drawWordmark(ctx, half / 2 - ww / 2, H * 0.27 + cap / 2, cap, c.text, false);
      drawWeb(ctx, half + half / 2, H * 0.24, webSize * 0.8, c.symbol, 'center');
      ctx.save();
      ctx.font = `700 ${(H * 0.022) / CAP}px ${FONT_WORD}`;
      ctx.fillStyle = c.text; ctx.textAlign = 'center';
      ctx.fillText('LOGISTICA', half + half / 2, H * 0.28);
      ext(half + half * 0.3, H * 0.26, half * 0.4, H * 0.025);
      ctx.restore();
      break;
    }
    case 4: default: {
      const symH = H * 0.035, cap = H * 0.05;
      const sw = symbolWidth(symH), ww = wordWidth(ctx, cap);
      drawSymbol(ctx, half / 2 - sw / 2, H * 0.21, symH, c.symbol);
      drawWordmark(ctx, half / 2 - ww / 2, H * 0.3, cap, c.text);
      drawWeb(ctx, half + half / 2, H * 0.6, webSize, c.symbol, 'center');
      break;
    }
  }
}

// ---------- Paletas del sistema de marca ----------
export const PALETTES = [
  { name: 'Rojo · blanco', bg: '#F2F2F2', symbol: '#EA1C0D', text: '#111111' },
  { name: 'Rojo pleno', bg: '#EA1C0D', symbol: '#E6E6E6', text: '#E6E6E6' },
  { name: 'Verde · rojo', bg: '#004D00', symbol: '#EA1C0D', text: '#E6E6E6' },
  { name: 'Granate', bg: '#550000', symbol: '#EA1C0D', text: '#E6E6E6' },
  { name: 'Naranja · blanco', bg: '#F2F2F2', symbol: '#FF6500', text: '#111111' },
  { name: 'Naranja pleno', bg: '#FF6500', symbol: '#1F3A52', text: '#F2F2F2' },
  { name: 'Azul · naranja', bg: '#1F3A52', symbol: '#FF6500', text: '#E6E6E6' },
  { name: 'Negro', bg: '#141414', symbol: '#EA1C0D', text: '#F2F2F2' },
];

export const SWATCHES = ['#F2F2F2', '#E6E6E6', '#111111', '#EA1C0D', '#550000', '#004D00', '#FF6500', '#1F3A52'];

// ---------- Diseño libre ("Constrúyelo tú mismo") ----------
// Cada elemento: { type: 'naygar' | 'logistica' | 'symbol', x, y (centro, fracción del lienzo),
//                  size (alto en fracción del alto del lienzo), color, outline (solo símbolo) }
export const CUSTOM_STEPS = [
  { type: 'naygar', label: 'Logotipo NAYGAR' },
  { type: 'logistica', label: 'Palabra LOGISTICA' },
  { type: 'symbol', label: 'Símbolo' },
];

function drawLogisticaWord(ctx, cx, cy, cap, color) {
  ctx.save();
  ctx.font = `700 ${cap / CAP}px ${FONT_WORD}`;
  if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${0.06 * cap / CAP}px`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText('LOGISTICA').width;
  ctx.fillText('LOGISTICA', cx - w / 2, cy + cap / 2);
  ext(cx - w / 2, cy - cap / 2, w, cap);
  resetSpacing(ctx);
  ctx.restore();
}

export const Z = { symbol: 0, logistica: 1, naygar: 2 };

// Dibuja los elementos y devuelve sus cajas (px). selected = índice a resaltar o -1.
export function drawCustom(ctx, W, H, els, c, mirror = false, selected = -1) {
  ctx.clearRect(0, 0, W, H);
  paintBackground(ctx, W, H, c);
  const boxes = new Array(els.length).fill(null);
  // Orden de capas: símbolo, LOGISTICA y NAYGAR siempre arriba.
  const order = els.map((el, i) => i).sort((a, b) => Z[els[a].type] - Z[els[b].type]);
  order.forEach((i) => {
    const el = els[i];
    BB = null;
    const cx = (mirror ? 1 - el.x : el.x) * W, cy = el.y * H, h = el.size * H;
    if (el.type === 'symbol') {
      const w = symbolWidth(h);
      drawSymbol(ctx, cx - w / 2, cy - h / 2, h, el.color, el.outline ? 'stroke' : 'fill');
    } else if (el.type === 'naygar') {
      const w = wordWidth(ctx, h);
      drawWordmark(ctx, cx - w / 2, cy + h / 2, h, el.color, false);
    } else {
      drawLogisticaWord(ctx, cx, cy, h, el.color);
    }
    boxes[i] = BB && { ...BB };
  });
  const b = boxes[selected];
  if (b) {
    const pad = H * 0.025;
    ctx.save();
    ctx.lineWidth = Math.max(2, H * 0.006);
    ctx.setLineDash([H * 0.02, H * 0.014]);
    ctx.strokeStyle = '#1e88ff';
    ctx.strokeRect(b.x0 - pad, b.y0 - pad, b.x1 - b.x0 + pad * 2, b.y1 - b.y0 + pad * 2);
    ctx.restore();
  }
  return boxes;
}
