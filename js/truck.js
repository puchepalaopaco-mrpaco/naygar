// Camión rígido de caja (estilo europeo) modelado con primitivas de three.js.
// Todo en blanco; solo las lonas laterales y la puerta trasera llevan textura editable.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Medidas en metros
export const BOX = { L: 7.2, H: 2.6, W: 2.5, x0: -5.6, y0: 1.2 }; // x0 = trasera
export const SIDE_TEX = { w: 3600, h: Math.round(3600 * (BOX.H - 0.26) / (BOX.L - 0.16)) };
export const REAR_TEX = { w: 1600, h: Math.round(1600 * (BOX.H - 0.26) / (BOX.W - 0.16)) };

const M = {
  white: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.45, metalness: 0.0 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xc9cdd1, roughness: 0.35, metalness: 0.6 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2a2d30, roughness: 0.7 }),
  black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.95 }),
  rim: new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.3, metalness: 0.7 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x23323a, roughness: 0.08, metalness: 0.4 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.4, emissive: 0x400000 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xff9a1a, roughness: 0.4 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xeef3f7, roughness: 0.1, metalness: 0.3, emissive: 0x222222 }),
};

function box(w, h, d, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

function wheel(parent, x, z, dual, side) {
  const g = new THREE.Group();
  const r = 0.52, w = 0.3;
  const tireGeo = new THREE.CylinderGeometry(r, r, w, 40);
  const add = (dz) => {
    const t = new THREE.Mesh(tireGeo, M.tire);
    t.rotation.x = Math.PI / 2; t.position.z = dz; t.castShadow = true;
    g.add(t);
  };
  add(0);
  if (dual) add(-side * 0.32);
  // llanta
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 32), M.rim);
  rim.rotation.x = Math.PI / 2; rim.position.z = side * (w / 2 + 0.005);
  g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.08, 16), M.dark);
  hub.rotation.x = Math.PI / 2; hub.position.z = side * (w / 2 + 0.04);
  g.add(hub);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 8), M.dark);
    n.rotation.x = Math.PI / 2;
    n.position.set(Math.cos(a) * 0.19, Math.sin(a) * 0.19, side * (w / 2 + 0.03));
    g.add(n);
  }
  g.position.set(x, r, z);
  parent.add(g);
}

function mudguard(parent, x, z, len) {
  const geo = new THREE.CylinderGeometry(0.62, 0.62, 0.34, 32, 1, true, -Math.PI / 2, Math.PI);
  const m = new THREE.Mesh(geo, M.black);
  m.rotation.x = -Math.PI / 2;
  m.scale.x = len || 1;
  m.position.set(x, 0.52, z);
  parent.add(m);
}

export function buildTruck(sideLeftTex, sideRightTex, rearTex) {
  const truck = new THREE.Group();
  const { L, H, W, x0, y0 } = BOX;
  const cx = x0 + L / 2, cy = y0 + H / 2;

  // ---------- Chasis ----------
  box(9.4, 0.26, 0.12, M.dark, -0.75, 0.88, 0.45, truck);
  box(9.4, 0.26, 0.12, M.dark, -0.75, 0.88, -0.45, truck);
  box(L, 0.18, 1.0, M.dark, cx, 1.1, 0, truck);
  for (let i = 0; i < 10; i++) box(0.08, 0.14, W, M.dark, x0 + 0.3 + i * 0.75, 1.12, 0, truck);

  // ---------- Caja ----------
  const body = box(L, H, W, M.white, cx, cy, 0, truck);
  body.castShadow = true;
  // perfiles de aluminio
  const prof = 0.09;
  for (const s of [1, -1]) {
    box(L + 0.02, prof, prof, M.alu, cx, y0 + H - prof / 2, s * (W / 2), truck);
    box(L + 0.02, 0.16, prof, M.alu, cx, y0 + 0.08, s * (W / 2), truck);
    box(prof, H, prof, M.alu, x0, cy, s * (W / 2), truck);
    box(prof, H, prof, M.alu, x0 + L, cy, s * (W / 2), truck);
  }
  box(prof, prof, W, M.alu, x0, y0 + H - prof / 2, 0, truck);
  box(prof, 0.16, W, M.alu, x0, y0 + 0.08, 0, truck);

  // Lonas laterales (planos con textura)
  const sideGeo = new THREE.PlaneGeometry(L - 0.16, H - 0.26);
  const mk = (tex) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, metalness: 0 });
  const right = new THREE.Mesh(sideGeo, mk(sideRightTex)); // lado +Z (cabina a la derecha en pantalla)
  right.position.set(cx, cy + 0.035, W / 2 + 0.004);
  right.receiveShadow = true;
  truck.add(right);
  const left = new THREE.Mesh(sideGeo, mk(sideLeftTex)); // lado -Z (cabina a la izquierda)
  left.rotation.y = Math.PI;
  left.position.set(cx, cy + 0.035, -W / 2 - 0.004);
  left.receiveShadow = true;
  truck.add(left);

  // Puerta trasera
  const rear = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.16, H - 0.26), mk(rearTex));
  rear.rotation.y = -Math.PI / 2;
  rear.position.set(x0 - 0.004, cy + 0.035, 0);
  truck.add(rear);
  // herrajes de puerta
  const rx = x0 - 0.02;
  box(0.02, H - 0.2, 0.025, M.alu, rx, cy, 0, truck); // junta central
  for (const z of [-0.12, 0.12, -0.62, 0.62]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, H - 0.3, 12), M.alu);
    bar.position.set(rx - 0.03, cy, z);
    truck.add(bar);
    box(0.06, 0.05, 0.12, M.alu, rx - 0.03, y0 + 0.9, z + Math.sign(z) * 0.06, truck); // manilla
  }
  for (const z of [-W / 2 + 0.06, W / 2 - 0.06]) {
    for (const y of [y0 + 0.45, cy, y0 + H - 0.45]) box(0.04, 0.08, 0.18, M.alu, rx, y, z * 0.98, truck); // bisagras
  }

  // Paragolpes trasero, pilotos y guardabarros
  box(0.12, 0.14, W - 0.2, M.dark, x0 + 0.05, 0.62, 0, truck);
  for (const s of [1, -1]) {
    box(0.08, 0.5, 0.08, M.dark, x0 + 0.15, 0.85, s * 0.9, truck);
    box(0.06, 0.12, 0.32, M.red, x0 - 0.02, 1.0, s * 0.95, truck);
    box(0.05, 0.12, 0.08, M.amber, x0 - 0.02, 1.0, s * 0.72, truck);
    box(0.02, 0.6, 0.5, M.black, -4.6, 0.55, s * 1.05, truck); // faldilla
  }

  // ---------- Cabina ----------
  const cab = new THREE.Group();
  truck.add(cab);
  const cabX0 = 1.75, cabL = 2.25, cabW = 2.45, cabY0 = 0.95, cabH = 2.45;
  const cabBody = new THREE.Mesh(new RoundedBoxGeometry(cabL, cabH, cabW, 5, 0.16), M.white);
  cabBody.position.set(cabX0 + cabL / 2, cabY0 + cabH / 2, 0);
  cabBody.castShadow = true; cabBody.receiveShadow = true;
  cab.add(cabBody);
  const fx = cabX0 + cabL; // frontal
  // deflector de techo
  const shape = new THREE.Shape();
  shape.moveTo(cabX0 + 0.05, cabY0 + cabH - 0.05);
  shape.lineTo(cabX0 + 0.05, y0 + H);
  shape.lineTo(cabX0 + 0.7, y0 + H);
  shape.quadraticCurveTo(fx - 0.5, cabY0 + cabH + 0.15, fx - 0.15, cabY0 + cabH - 0.05);
  shape.closePath();
  const defl = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: cabW - 0.25, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }), M.white);
  defl.position.z = -(cabW - 0.25) / 2;
  defl.castShadow = true;
  cab.add(defl);
  // parabrisas
  box(0.03, 0.85, cabW - 0.3, M.glass, fx + 0.005, cabY0 + 1.75, 0, cab);
  box(0.03, 0.06, cabW - 0.25, M.dark, fx + 0.01, cabY0 + 1.3, 0, cab);
  // ventanillas laterales y puertas
  for (const s of [1, -1]) {
    const z = s * (cabW / 2 + 0.005);
    box(0.95, 0.72, 0.02, M.glass, fx - 0.6, cabY0 + 1.78, z, cab);
    box(0.012, 1.55, 0.02, M.dark, fx - 1.12, cabY0 + 1.2, z, cab); // junta puerta
    box(0.012, 1.55, 0.02, M.dark, fx - 0.05, cabY0 + 1.2, z * 1.0, cab);
    box(0.18, 0.04, 0.03, M.dark, fx - 1.0, cabY0 + 1.25, z, cab); // manilla
    // retrovisores
    box(0.04, 0.04, 0.3, M.dark, fx + 0.05, cabY0 + 1.95, s * (cabW / 2 + 0.15), cab);
    box(0.08, 0.5, 0.2, M.dark, fx + 0.07, cabY0 + 1.85, s * (cabW / 2 + 0.32), cab);
    // estribos
    box(0.6, 0.05, 0.25, M.dark, fx - 0.55, 0.55, s * (cabW / 2 - 0.08), cab);
    box(0.6, 0.05, 0.25, M.dark, fx - 0.55, 0.85, s * (cabW / 2 - 0.08), cab);
    // faros
    box(0.05, 0.18, 0.42, M.lamp, fx + 0.01, cabY0 + 0.35, s * 0.88, cab);
    box(0.05, 0.08, 0.1, M.amber, fx + 0.01, cabY0 + 0.35, s * 1.13, cab);
  }
  // rejilla frontal
  box(0.04, 0.55, 1.2, M.dark, fx + 0.005, cabY0 + 0.75, 0, cab);
  for (let i = 0; i < 5; i++) box(0.05, 0.03, 1.15, M.alu, fx + 0.01, cabY0 + 0.53 + i * 0.11, 0, cab);
  // paragolpes delantero
  box(0.3, 0.35, cabW + 0.02, M.dark, fx - 0.08, 0.72, 0, cab);
  // depósito de combustible
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.1, 24), M.alu);
  tank.rotation.z = Math.PI / 2;
  tank.position.set(0.7, 0.7, 0.85);
  tank.castShadow = true;
  truck.add(tank);
  box(1.0, 0.45, 0.4, M.dark, 0.7, 0.75, -0.85, truck); // caja baterías
  // protecciones laterales
  for (const s of [1, -1]) {
    box(2.4, 0.08, 0.04, M.alu, -1.5, 0.65, s * 1.18, truck);
    box(2.4, 0.08, 0.04, M.alu, -1.5, 0.92, s * 1.18, truck);
  }

  // ---------- Ruedas ----------
  const frontX = 3.05, r1 = -2.55, r2 = -3.9;
  for (const s of [1, -1]) {
    const z = s * 1.02;
    wheel(truck, frontX, z, false, s);
    wheel(truck, r1, z, true, s);
    wheel(truck, r2, z, true, s);
    mudguard(truck, frontX, z - s * 0.0);
    mudguard(truck, (r1 + r2) / 2, z - s * 0.15, 1.9);
  }
  box(0.08, 0.08, 2.0, M.dark, frontX, 0.52, 0, truck);
  box(0.12, 0.12, 1.6, M.dark, r1, 0.52, 0, truck);
  box(0.12, 0.12, 1.6, M.dark, r2, 0.52, 0, truck);

  return { truck, lonas: { left, right, rear } };
}
