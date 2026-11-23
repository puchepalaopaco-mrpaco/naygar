// Dibujo de la marca NAYGAR sobre canvas 2D (lonas laterales y puertas traseras).
// Todos los diseños replican las propuestas del PDF "Diseño de caja" (Caja 1–9)
// y "Diseño puerta trasera" (Trasera 1–4).

export const FONT_WORD = '"Archivo", "Arial Black", sans-serif';
export const FONT_MONO = '"Overpass Mono", ui-monospace, monospace';
export const WEB = 'naygarlogistica.com';

// ---------- Símbolo (isotipo "//") ----------
// Provisional hasta tener el Recurso 1. Coordenadas en unidades de altura (alto = 1).
// Si se sube un logo propio, se usa esa imagen en su lugar.
const SYMBOL_RATIO = 1.656; // ancho / alto
// Vértices (antes de redondear) medidos sobre el isotipo del PDF.
const PIECES = [
  [[0.468, -0.132], [0.835, 0.472], [0.544, 0.996], [-0.115, 0.996]],
  [[1.188, 1.132], [0.821, 0.528], [1.111, 0.004], [1.771, 0.004]],
];
const PIECE_RADIUS = 0.17;

let customLogo = null; // HTMLImageElement
export function setCustomLogo(img) { customLogo = img; }
export function hasCustomLogo() { return !!customLogo; }
let tintLogo = true;
export function setLogoTint(v) { tintLogo = v; }

function symbolRatio() {
  if (customLogo) {
    const w = customLogo.naturalWidth || customLogo.width, h = customLogo.naturalHeight || customLogo.height;
    return w && h ? w / h : SYMBOL_RATIO;
  }
  return SYMBOL_RATIO;
}

function roundedPoly(ctx, pts, r) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    ctx.arcTo(p[0], p[1], q[0], q[1], r);
  }
  ctx.closePath();
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

// Dibuja el símbolo con su esquina superior izquierda en (x, y) y alto h. Devuelve el ancho.
export function drawSymbol(ctx, x, y, h, color, mode = 'fill', tint = tintLogo) {
  const w = h * symbolRatio();
  if (customLogo) {
    ctx.save();
    if (mode === 'stroke') ctx.globalAlpha = 0.28;
    ctx.drawImage(tint ? tintedLogo(color) : customLogo, x, y, w, h);
    ctx.restore();
    return w;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(h, h);
  ctx.beginPath();
  for (const p of PIECES) roundedPoly(ctx, p, PIECE_RADIUS);
  if (mode === 'stroke') {
    ctx.lineWidth = Math.max(0.012, 1 / h);
    ctx.strokeStyle = color;
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
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

export function wordWidth(ctx, cap) {
  ctx.save(); setWordFont(ctx, cap / CAP);
  const w = ctx.measureText('NAYGAR').width;
  ctx.restore(); return w;
}

// Dibuja "NAYGAR" con la línea base en y, empezando en x. cap = altura de mayúsculas.
// sub: muestra "LOGISTICA" debajo alineado a la derecha.
export function drawWordmark(ctx, x, y, cap, color, sub = true, subColor = color) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  setWordFont(ctx, cap / CAP);
  ctx.fillStyle = color;
  ctx.fillText('NAYGAR', x, y);
  const w = ctx.measureText('NAYGAR').width;
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
export const SIDE_DESIGNS = [
  { id: 1, name: 'Caja 1' }, { id: 2, name: 'Caja 2' }, { id: 3, name: 'Caja 3' },
  { id: 4, name: 'Caja 4' }, { id: 5, name: 'Caja 5' }, { id: 6, name: 'Caja 6' },
  { id: 7, name: 'Caja 7' }, { id: 8, name: 'Caja 8' }, { id: 9, name: 'Caja 9' },
];

export function drawSide(ctx, W, H, design, c, mirror = false) {
  ctx.clearRect(0, 0, W, H);
  paintBackground(ctx, W, H, c);
  // Posiciona un bloque de ancho w cuyo borde izquierdo (sin espejo) está en x.
  const X = (x, w) => (mirror ? W - x - w : x);

  switch (design) {
    case 1: case 2: { // símbolo pequeño + NAYGAR, arriba a la izquierda
      const symH = H * 0.26, cap = H * 0.15, gap = H * 0.06;
      const w = lockupWidth(ctx, symH, cap, gap);
      drawLockup(ctx, X(W * 0.17, w), H * 0.36, symH, cap, gap, c, design === 2 ? 'stroke' : 'fill');
      break;
    }
    case 3: { // símbolo grande pegado al texto
      const symH = H * 0.52, cap = H * 0.17;
      const sw = symbolWidth(symH), ww = wordWidth(ctx, cap);
      const total = sw * 0.8 + ww;
      const x0 = X(W * 0.16, total);
      drawSymbol(ctx, x0, H * 0.12, symH, c.symbol);
      drawWordmark(ctx, x0 + sw * 0.8, H * 0.38 + cap / 2, cap, c.text);
      break;
    }
    case 4: case 5: { // símbolo enorme con NAYGAR cruzándolo
      const symH = H * 0.78, cap = H * 0.16;
      const sw = symbolWidth(symH), ww = wordWidth(ctx, cap);
      const cx = mirror ? W * 0.58 : W * 0.42;
      drawSymbol(ctx, cx - sw / 2, H * 0.06, symH, c.symbol, design === 5 ? 'stroke' : 'fill');
      drawWordmark(ctx, cx - ww / 2, H * 0.36 + cap / 2, cap, c.text);
      break;
    }
    case 6: { // símbolo centrado detrás de las letras
      const symH = H * 0.46, cap = H * 0.19;
      const sw = symbolWidth(symH), ww = wordWidth(ctx, cap);
      const cx = W * 0.5;
      drawSymbol(ctx, cx - sw / 2 + ww * 0.04, H * 0.16, symH, c.symbol);
      drawWordmark(ctx, cx - ww / 2, H * 0.36 + cap / 2, cap, c.text);
      break;
    }
    case 7: { // símbolo gigante en línea a la izquierda + NAYGAR grande
      const symH = H * 0.92, cap = H * 0.2;
      const sw = symbolWidth(symH), ww = wordWidth(ctx, cap);
      drawSymbol(ctx, X(W * 0.04, sw), H * 0.04, symH, c.symbol, 'stroke');
      drawWordmark(ctx, X(W * 0.04 + sw * 0.55, ww), H * 0.36 + cap / 2, cap, c.text);
      break;
    }
    case 8: { // apilado y centrado
      const symH = H * 0.18, cap = H * 0.19;
      const sw = symbolWidth(symH), ww = wordWidth(ctx, cap);
      drawSymbol(ctx, W / 2 - sw / 2, H * 0.1, symH, c.symbol);
      drawWordmark(ctx, W / 2 - ww / 2, H * 0.34 + cap, cap, c.text);
      break;
    }
    case 9: default: { // símbolo + NAYGAR centrados
      const symH = H * 0.13, cap = H * 0.17, gap = H * 0.05;
      const w = lockupWidth(ctx, symH, cap, gap);
      drawLockup(ctx, W / 2 - w / 2, H * 0.32, symH, cap, gap, c);
      break;
    }
  }
}

// ---------- Diseños puerta trasera (Trasera 1–4) ----------
export const REAR_DESIGNS = [
  { id: 1, name: 'Trasera 1' }, { id: 2, name: 'Trasera 2' },
  { id: 3, name: 'Trasera 3' }, { id: 4, name: 'Trasera 4' },
];

export function drawRear(ctx, W, H, design, c) {
  ctx.clearRect(0, 0, W, H);
  paintBackground(ctx, W, H, c);
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
