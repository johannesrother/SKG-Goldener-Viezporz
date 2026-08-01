import * as THREE from 'three';
import cobblestoneUrl from '../assets/hauptmarkt-cobblestone.png';

const PALETTE = {
  sandstone: [0xd6b27f, 0xc99165, 0xe0c599, 0xb98762, 0xd3a876],
  roof: [0x2d3740, 0x35434d, 0x493d39, 0x283037],
  leaf: [0x42613e, 0x587448, 0x35523c, 0x6d824e],
  flower: [0xd67175, 0xe9b35c, 0xc65c8c, 0xf2ded0],
  outfit: [0x3f5f50, 0x4d6075, 0x735348, 0x9a7041, 0x475348, 0x6f4243, 0x384654],
  hair: [0x291c18, 0x553524, 0x8c633d, 0x3a2a22],
  skin: [0xf0bf91, 0xd99668, 0xb97452, 0xf3cfaa],
};

const shared = {
  leg: new THREE.CapsuleGeometry(0.085, 0.42, 3, 6),
  torso: new THREE.CapsuleGeometry(0.25, 0.47, 4, 8),
  head: new THREE.SphereGeometry(0.225, 10, 8),
  hair: new THREE.SphereGeometry(0.232, 10, 6, 0, Math.PI * 2, 0, Math.PI / 1.9),
  arm: new THREE.CapsuleGeometry(0.055, 0.38, 3, 6),
  pigeon: new THREE.SphereGeometry(0.075, 7, 5),
};

let roofTexture;

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.76, metalness: 0.02, ...options });
}

function hash(seed) {
  const value = Math.sin(seed * 91.173 + 17.41) * 15321.731;
  return value - Math.floor(value);
}

function choose(values, seed) {
  return values[Math.floor(hash(seed) * values.length) % values.length];
}

function addBox(parent, { x = 0, y = 0, z = 0, w = 1, h = 1, d = 1, color = 0xffffff, ...options }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color, options));
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, { x = 0, y = 0, z = 0, rTop = 0.5, rBottom = rTop, h = 1, sides = 10, color = 0xffffff, ...options }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, sides), material(color, options));
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addLabel(parent, text, x, y, z, scale = 1, accent = '#f0c56f') {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 176;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(17, 25, 24, .91)';
  context.roundRect(12, 12, 696, 152, 25);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 4;
  context.roundRect(12, 12, 696, 152, 25);
  context.stroke();
  context.fillStyle = '#f6dfaf';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '600 65px Georgia, serif';
  context.fillText(text, 360, 91);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sign.position.set(x, y, z);
  sign.scale.set(scale * 2.05, scale * 0.5, 1);
  parent.add(sign);
  return sign;
}

function makeRoof(w, d, wallHeight, color) {
  const halfW = w / 2 + 0.14;
  const halfD = d / 2 + 0.14;
  const roofHeight = Math.min(1.65, 0.6 + Math.max(w, d) * 0.11);
  const positions = new Float32Array([
    -halfW, wallHeight, -halfD, halfW, wallHeight, -halfD, halfW, wallHeight + roofHeight, 0,
    -halfW, wallHeight, -halfD, halfW, wallHeight + roofHeight, 0, -halfW, wallHeight + roofHeight, 0,
    -halfW, wallHeight, halfD, -halfW, wallHeight + roofHeight, 0, halfW, wallHeight + roofHeight, 0,
    -halfW, wallHeight, halfD, halfW, wallHeight + roofHeight, 0, halfW, wallHeight, halfD,
    -halfW, wallHeight, -halfD, -halfW, wallHeight, halfD, -halfW, wallHeight + roofHeight, 0,
    halfW, wallHeight, -halfD, halfW, wallHeight + roofHeight, 0, halfW, wallHeight, halfD,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const roof = new THREE.Mesh(geometry, material(color, { map: getRoofTexture(), roughness: 0.88, side: THREE.DoubleSide }));
  roof.castShadow = true;
  roof.receiveShadow = true;
  return roof;
}

function getRoofTexture() {
  if (roofTexture) return roofTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  context.fillStyle = '#303a40';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let row = -1; row < 18; row += 1) {
    const offset = row % 2 ? -18 : 0;
    for (let column = -1; column < 12; column += 1) {
      const x = column * 48 + offset;
      const y = row * 31;
      context.fillStyle = (row + column) % 3 ? '#3d474d' : '#263139';
      context.fillRect(x + 2, y + 2, 45, 28);
      context.strokeStyle = 'rgba(209, 192, 158, .09)';
      context.lineWidth = 1;
      context.strokeRect(x + 2, y + 2, 45, 28);
    }
  }
  roofTexture = new THREE.CanvasTexture(canvas);
  roofTexture.colorSpace = THREE.SRGBColorSpace;
  roofTexture.wrapS = THREE.RepeatWrapping;
  roofTexture.wrapT = THREE.RepeatWrapping;
  roofTexture.repeat.set(2.3, 2.3);
  return roofTexture;
}

function addWindow(parent, x, y, z, side, width = 0.42, height = 0.62, lit = true) {
  const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.075), material(0x263238, { roughness: 0.42 }));
  frame.position.set(x, y, z + side * 0.045);
  frame.castShadow = true;
  parent.add(frame);
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    material(lit ? 0xffcf84 : 0x7ca0ad, { emissive: lit ? 0xa75e24 : 0x183c4a, emissiveIntensity: lit ? 1.05 : 0.18, roughness: 0.3, metalness: 0.14, side: THREE.DoubleSide }),
  );
  pane.position.set(x, y, z + side * 0.09);
  if (side < 0) pane.rotation.y = Math.PI;
  parent.add(pane);
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.032, height, 0.03), material(0x243139));
  mullion.position.copy(frame.position);
  mullion.position.z += side * 0.055;
  parent.add(mullion);
}

function addPlanter(parent, x, z, rotation = 0, flowers = 0xd67175) {
  const planter = new THREE.Group();
  planter.position.set(x, 0, z);
  planter.rotation.y = rotation;
  addBox(planter, { w: 0.95, h: 0.28, d: 0.42, color: 0x76513b });
  addBox(planter, { y: 0.28, w: 0.78, h: 0.08, d: 0.32, color: 0x453827 });
  for (let i = 0; i < 4; i += 1) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), material(choose(PALETTE.leaf, i + x * 5)));
    leaf.position.set(-0.29 + i * 0.19, 0.48 + (i % 2) * 0.06, (i % 2 ? .08 : -.06));
    planter.add(leaf);
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), material(i % 2 ? flowers : 0xf4c86f));
    bloom.position.set(leaf.position.x + .03, leaf.position.y + .12, leaf.position.z);
    planter.add(bloom);
  }
  parent.add(planter);
  return planter;
}

function createTownhouse(parent, spec) {
  const { x, z, w, h, d, rotation = 0, facade, roof, seed, sign } = spec;
  const building = new THREE.Group();
  building.position.set(x, 0, z);
  building.rotation.y = rotation;
  addBox(building, { w, h, d, color: facade });
  const cornice = addBox(building, { y: h - .13, w: w + .14, h: .16, d: d + .1, color: 0xe8cb9c });
  cornice.castShadow = true;
  building.add(makeRoof(w, d, h, roof));
  const front = -d / 2 - .02;
  const columns = Math.max(2, Math.floor(w / .72));
  const stories = h > 4 ? 3 : 2;
  for (let story = 0; story < stories; story += 1) {
    const y = h * .38 + story * (h * .26);
    for (let column = 0; column < columns; column += 1) {
      const windowX = -w / 2 + (column + .5) * (w / columns);
      addWindow(building, windowX, y, front, -1, Math.min(.4, w / columns - .16), .52, hash(seed + story * 7 + column) > .25);
      if (story === 0 && column % 2 === 0 && hash(seed + column * 19) > .55) addPlanter(building, windowX, front - .14, 0, choose(PALETTE.flower, seed + column));
    }
  }
  const door = new THREE.Mesh(new THREE.BoxGeometry(.58, 1.04, .08), material(0x413329, { roughness: .38 }));
  door.position.set(w * (hash(seed) > .5 ? .26 : -.26), .52, front - .045);
  building.add(door);
  const transom = new THREE.Mesh(new THREE.BoxGeometry(.42, .15, .045), material(0xffcb7a, { emissive: 0x9b4f1e, emissiveIntensity: .7 }));
  transom.position.set(door.position.x, 1.08, front - .09);
  building.add(transom);
  if (hash(seed + 5) > .34) {
    const timber = 0x4c3429;
    for (const y of [h * .31, h * .58]) addBox(building, { y, z: front - .035, w: w * .94, h: .075, d: .055, color: timber });
    for (let trim = 1; trim < columns; trim += 1) addBox(building, { x: -w / 2 + trim * (w / columns), y: h * .31, z: front - .04, w: .07, h: h * .63, d: .055, color: timber });
    const diagonal = new THREE.Mesh(new THREE.BoxGeometry(w * .52, .065, .055), material(timber));
    diagonal.position.set(0, h * .49, front - .07);
    diagonal.rotation.z = -.54;
    building.add(diagonal);
  }
  if (hash(seed + 17) > .48) {
    const dormer = new THREE.Group();
    dormer.position.set(w * (hash(seed + 21) > .5 ? .18 : -.18), h + .26, -.03);
    addBox(dormer, { w: .68, h: .55, d: .52, color: facade });
    dormer.add(makeRoof(.68, .52, .55, roof));
    addWindow(dormer, 0, .32, -.29, -1, .28, .28, true);
    building.add(dormer);
  }
  if (hash(seed + 3) > .34) {
    const balcony = addBox(building, { x: w * .18, y: h * .42, z: front - .12, w: Math.min(1.15, w * .42), h: .08, d: .25, color: 0x343d3d, metalness: .25 });
    for (let rail = -2; rail <= 2; rail += 1) addCylinder(building, { x: balcony.position.x + rail * .17, y: h * .42 + .08, z: front - .18, rTop: .016, rBottom: .016, h: .32, sides: 5, color: 0x283033 });
    addPlanter(building, balcony.position.x, front - .29, 0, choose(PALETTE.flower, seed + 11));
  }
  if (sign) addLabel(building, sign, 0, 1.72, front - .13, Math.min(1.05, w * .22));
  parent.add(building);
  return building;
}

function addTree(parent, x, z, scale = 1, seed = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  addCylinder(tree, { rTop: .11 * scale, rBottom: .17 * scale, h: 1.52 * scale, sides: 8, color: 0x65452c });
  const canopy = new THREE.Group();
  const first = new THREE.Mesh(new THREE.IcosahedronGeometry(.72 * scale, 1), material(choose(PALETTE.leaf, seed)));
  first.position.set(-.13 * scale, 1.72 * scale, .04 * scale);
  const second = new THREE.Mesh(new THREE.IcosahedronGeometry(.62 * scale, 1), material(choose(PALETTE.leaf, seed + 1)));
  second.position.set(.37 * scale, 1.83 * scale, -.05 * scale);
  canopy.add(first, second);
  const distantCanopy = new THREE.Mesh(new THREE.OctahedronGeometry(.86 * scale, 0), material(choose(PALETTE.leaf, seed)));
  distantCanopy.position.set(.08 * scale, 1.75 * scale, 0);
  const lod = new THREE.LOD();
  lod.addLevel(canopy, 0);
  lod.addLevel(distantCanopy, 55);
  tree.add(lod);
  parent.add(tree);
  return tree;
}

function addLamp(parent, x, z, glow = true) {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);
  addCylinder(lamp, { rTop: .052, rBottom: .095, h: 3.1, sides: 8, color: 0x252d30, metalness: .36, roughness: .46 });
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.52, .06, .06), material(0x252d30, { metalness: .35 }));
  arm.position.set(.22, 2.72, 0);
  lamp.add(arm);
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(.23, 0), material(0xffce74, { emissive: 0xa35c20, emissiveIntensity: 1.55, roughness: .3 }));
  lantern.position.set(.47, 2.57, 0);
  lamp.add(lantern);
  if (glow) {
    const point = new THREE.PointLight(0xffb45f, .76, 8, 2.1);
    point.position.set(.47, 2.55, 0);
    lamp.add(point);
  }
  parent.add(lamp);
  return lamp;
}

function addBench(parent, x, z, rotation = 0) {
  const bench = new THREE.Group();
  bench.position.set(x, 0, z);
  bench.rotation.y = rotation;
  addBox(bench, { z: .08, w: 1.45, h: .09, d: .32, color: 0x744b2b });
  addBox(bench, { z: -.13, y: .39, w: 1.45, h: .085, d: .085, color: 0x744b2b });
  for (const legX of [-.51, .51]) addBox(bench, { x: legX, z: .08, w: .075, h: .43, d: .09, color: 0x252d30 });
  parent.add(bench);
  return bench;
}

function addBicycle(parent, x, z, rotation = 0) {
  const bicycle = new THREE.Group();
  bicycle.position.set(x, .38, z);
  bicycle.rotation.y = rotation;
  const wheelMaterial = material(0x252b2f, { metalness: .35, roughness: .42 });
  for (const wheelX of [-.38, .38]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(.28, .027, 5, 14), wheelMaterial);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.x = wheelX;
    bicycle.add(wheel);
  }
  const frame = new THREE.Mesh(new THREE.TorusGeometry(.29, .028, 5, 3), material(0xc47c36, { metalness: .25 }));
  frame.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  bicycle.add(frame);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .32, 5), wheelMaterial);
  handle.position.set(.35, .28, 0);
  handle.rotation.z = -.45;
  bicycle.add(handle);
  parent.add(bicycle);
}

function addWineStand(parent, x, z) {
  const stand = new THREE.Group();
  stand.position.set(x, 0, z);
  addBox(stand, { w: 3.35, h: 1.32, d: 1.32, color: 0x6b4429 });
  addBox(stand, { y: 1.33, w: 3.65, h: .12, d: 1.58, color: 0x293332 });
  for (let pole = -1; pole <= 1; pole += 2) addCylinder(stand, { x: pole * 1.45, z: -.57, rTop: .055, rBottom: .075, h: 2.7, sides: 6, color: 0x3a3026 });
  for (let stripe = -3; stripe <= 3; stripe += 1) addBox(stand, { x: stripe * .5, y: 2.69, z: -.57, w: .48, h: .11, d: .1, color: stripe % 2 ? 0xb66244 : 0xf2d29a });
  for (const offset of [-1.06, -.53, 0, .53, 1.06]) {
    const bottle = addCylinder(stand, { x: offset, y: 1.38, z: -.4, rTop: .07, rBottom: .1, h: .42, sides: 7, color: offset % 1 ? 0x704a27 : 0x45644b, roughness: .35 });
    bottle.castShadow = false;
  }
  for (const offset of [-1.2, 1.2]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .58, 10), material(0x80532e));
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(offset, .4, .76);
    stand.add(barrel);
  }
  addLabel(stand, 'VIEZ · WEIN', 0, 2.2, -.76, 1.05);
  parent.add(stand);
  return stand;
}

function addCafeTerrace(parent, x, z) {
  const cafe = new THREE.Group();
  cafe.position.set(x, 0, z);
  addBox(cafe, { w: 4.7, h: 2.75, d: 2.25, color: 0x9e6949 });
  cafe.add(makeRoof(4.7, 2.25, 2.75, 0x303b43));
  for (let i = -2; i <= 2; i += 1) addWindow(cafe, i * .78, 1.55, -1.16, -1, .5, .72, true);
  addLabel(cafe, 'CAFÉ AM MARKT', 0, 2.13, -1.29, .85);
  for (const row of [-.98, .25]) {
    for (let column = -1; column <= 1; column += 1) {
      const table = new THREE.Group();
      table.position.set(column * 1.1, .02, row - 1.8);
      addCylinder(table, { rTop: .31, rBottom: .31, h: .65, sides: 12, color: 0x785037 });
      addCylinder(table, { y: .65, rTop: .48, rBottom: .48, h: .055, sides: 12, color: 0xd4a86a, roughness: .42 });
      if (row < 0) {
        const umbrella = new THREE.Mesh(new THREE.ConeGeometry(.75, .13, 16), material(column % 2 ? 0xe4c07a : 0x9b5a4a));
        umbrella.position.y = 1.72;
        umbrella.scale.y = .6;
        table.add(umbrella);
      }
      cafe.add(table);
    }
  }
  parent.add(cafe);
  return cafe;
}

function addMarketStall(parent, x, z, title, canopyA, canopyB) {
  const stall = new THREE.Group();
  stall.position.set(x, 0, z);
  addBox(stall, { w: 2.45, h: 1.05, d: 1.18, color: 0x784b2c });
  addBox(stall, { y: 1.09, w: 2.7, h: .08, d: 1.43, color: 0x303b36 });
  for (const poleX of [-1.05, 1.05]) addCylinder(stall, { x: poleX, z: -.47, rTop: .042, rBottom: .06, h: 2.3, sides: 6, color: 0x352a22 });
  for (let stripe = -2; stripe <= 2; stripe += 1) addBox(stall, { x: stripe * .54, y: 2.27, z: -.47, w: .53, h: .1, d: .09, color: stripe % 2 ? canopyA : canopyB });
  for (let item = -3; item <= 3; item += 1) {
    const produce = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), material(item % 2 ? 0xd36a51 : 0x91a84e));
    produce.position.set(item * .28, 1.18 + (item % 2 ? .06 : 0), -.42);
    stall.add(produce);
  }
  addLabel(stall, title, 0, 1.74, -.72, .7);
  parent.add(stall);
  return stall;
}

function addStreetMusicCorner(parent, x, z) {
  const corner = new THREE.Group();
  corner.position.set(x, 0, z);
  const caseMesh = new THREE.Mesh(new THREE.TorusGeometry(.42, .11, 7, 18, Math.PI), material(0x4b3326, { roughness: .43 }));
  caseMesh.rotation.x = -Math.PI / 2;
  caseMesh.position.set(.44, .08, -.42);
  corner.add(caseMesh);
  const speaker = new THREE.Mesh(new THREE.BoxGeometry(.42, .58, .27), material(0x263037, { roughness: .38 }));
  speaker.position.set(-.54, .3, .22);
  corner.add(speaker);
  const cone = new THREE.Mesh(new THREE.CircleGeometry(.12, 12), material(0xd3a560, { emissive: 0x563719, emissiveIntensity: .3 }));
  cone.position.set(-.54, .3, .37);
  corner.add(cone);
  addLabel(corner, 'LIVE', .1, 1.65, .14, .48, '#e4b964');
  parent.add(corner);
}

function addFountain(parent) {
  const fountain = new THREE.Group();
  addCylinder(fountain, { rTop: 2.38, rBottom: 2.55, h: .32, sides: 36, color: 0xd9c6a3, roughness: .52 });
  addCylinder(fountain, { y: .22, rTop: 2.1, rBottom: 2.1, h: .11, sides: 36, color: 0x3c8795, metalness: .18, roughness: .2, transparent: true, opacity: .88 });
  addCylinder(fountain, { y: .28, rTop: .42, rBottom: .56, h: 1.72, sides: 12, color: 0xd4b983, roughness: .6 });
  addCylinder(fountain, { y: 1.95, rTop: .73, rBottom: .42, h: .16, sides: 18, color: 0xdcc49a });
  const top = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), material(0x9e7343, { metalness: .35, roughness: .32 }));
  top.position.y = 2.24;
  fountain.add(top);
  const waterMaterial = new THREE.MeshBasicMaterial({ color: 0xd8f2eb, transparent: true, opacity: .56, depthWrite: false });
  for (let i = 0; i < 4; i += 1) {
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(.025, .045, .94, 7, 1, true), waterMaterial);
    stream.position.set(Math.cos(i * Math.PI / 2) * .37, 1.88, Math.sin(i * Math.PI / 2) * .37);
    stream.rotation.z = (i % 2 ? -.18 : .18);
    fountain.add(stream);
  }
  parent.add(fountain);
  return fountain;
}

function createCitizen(index, options = {}) {
  const scale = options.scale || (.82 + hash(index + 4) * .16);
  const person = new THREE.Group();
  person.name = options.name || `Marktbesucher ${index + 1}`;
  const skin = material(choose(PALETTE.skin, index + 1));
  const outfit = material(options.outfit || choose(PALETTE.outfit, index + 7));
  const hair = material(choose(PALETTE.hair, index + 21));
  const trousers = material(choose([0x29333a, 0x3f4d55, 0x4a3d37], index + 3));
  for (const x of [-.13, .13]) {
    const leg = new THREE.Mesh(shared.leg, trousers);
    leg.scale.setScalar(scale);
    leg.position.set(x * scale, .36 * scale, 0);
    leg.castShadow = true;
    person.add(leg);
  }
  const body = new THREE.Mesh(shared.torso, outfit);
  body.scale.setScalar(scale);
  body.position.y = 1.04 * scale;
  body.castShadow = true;
  person.add(body);
  const head = new THREE.Mesh(shared.head, skin);
  head.scale.setScalar(scale);
  head.position.y = 1.55 * scale;
  head.castShadow = true;
  person.add(head);
  const hairCap = new THREE.Mesh(shared.hair, hair);
  hairCap.scale.setScalar(scale);
  hairCap.position.y = 1.71 * scale;
  person.add(hairCap);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(shared.arm, skin);
    arm.scale.setScalar(scale);
    arm.position.set(side * .31 * scale, 1.07 * scale, 0);
    arm.rotation.z = side * .12;
    person.add(arm);
  }
  if (options.phone) {
    const phone = new THREE.Mesh(new THREE.BoxGeometry(.07, .14, .02), material(0x15202a, { metalness: .45 }));
    phone.position.set(.32 * scale, 1.36 * scale, -.08);
    phone.rotation.z = -.45;
    person.add(phone);
  }
  if (options.drink) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(.055, .065, .16, 8), material(0xf3e5c9));
    cup.position.set(-.3 * scale, 1.15 * scale, -.04);
    person.add(cup);
  }
  if (options.guitar) {
    const guitar = new THREE.Mesh(new THREE.SphereGeometry(.19, 10, 7), material(0xbd7431, { roughness: .4 }));
    guitar.scale.set(.78, 1.12, .28);
    guitar.position.set(.16 * scale, .98 * scale, -.15);
    person.add(guitar);
  }
  person.userData = { mode: options.mode || 'stand', phase: index * .79, route: options.route || [], home: options.home || new THREE.Vector3() };
  return person;
}

export function makePerson({ name = 'Spieler', outfit = 0x506b42, scale = 1 } = {}) {
  return createCitizen(500, { name, outfit, scale, mode: 'player' });
}

function createPigeons(parent, x, z) {
  const pigeons = [];
  const pigeonMaterial = material(0x52616b, { roughness: .55 });
  for (let i = 0; i < 12; i += 1) {
    const pigeon = new THREE.Mesh(shared.pigeon, pigeonMaterial);
    pigeon.position.set(x + (hash(i + 1) - .5) * 3.3, .09, z + (hash(i + 14) - .5) * 2.1);
    pigeon.castShadow = true;
    pigeon.userData = { baseX: pigeon.position.x, baseZ: pigeon.position.z, phase: i * .71 };
    parent.add(pigeon);
    pigeons.push(pigeon);
  }
  return pigeons;
}

function addFlowerDrifts(parent) {
  const flowerGeometry = new THREE.SphereGeometry(.075, 6, 5);
  const flowerMaterials = PALETTE.flower.map((color) => material(color));
  const locations = [
    [-20, -9, 5.8, 2.2], [-18, 10, 5.2, 1.4], [19, -10, 5.6, 1.8], [21, 10, 4.8, 1.4],
    [-5, 12.8, 13.5, .65], [6, -12.8, 15.5, .7], [0, -3.2, 2.5, .5],
  ];
  flowerMaterials.forEach((flowerMaterial, materialIndex) => {
    const mesh = new THREE.InstancedMesh(flowerGeometry, flowerMaterial, 70);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 70; i += 1) {
      const patch = locations[(i + materialIndex * 2) % locations.length];
      const seed = i * 3.17 + materialIndex * 12;
      dummy.position.set(patch[0] + (hash(seed) - .5) * patch[2], .18 + hash(seed + 8) * .18, patch[1] + (hash(seed + 5) - .5) * patch[3]);
      const scale = .55 + hash(seed + 10) * .7;
      dummy.scale.setScalar(scale);
      dummy.rotation.set(hash(seed + 4), hash(seed + 3) * Math.PI, hash(seed + 5));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    parent.add(mesh);
  });
}

function loadCobblestones() {
  const texture = new THREE.TextureLoader().load(cobblestoneUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7.4, 6.3);
  texture.anisotropy = 6;
  return texture;
}

export function createWorld(scene, quality = 'medium') {
  const root = new THREE.Group();
  root.name = 'Hauptmarkt Trier – Golden Hour';
  scene.add(root);
  const citizens = [];
  const pigeons = [];

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(59, 45),
    material(0xffffff, { map: loadCobblestones(), roughness: .92, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.03;
  ground.receiveShadow = true;
  root.add(ground);

  // North and south sides: Hauptmarkt inspired façade rhythm, deliberately stylised.
  const north = [
    [-24, 5.2, 4.7, 10.5, 51, 'GOLDENE TRAUBE'], [-18.5, 4.1, 3.7, 9.3, 52, null], [-13.7, 5.5, 5.1, 10.1, 53, 'BÄCKEREI'],
    [-7.5, 4.4, 4.4, 9.6, 54, null], [-2.2, 6.1, 5.6, 10.4, 55, 'MARKTCAFÉ'], [4.5, 4.7, 4.6, 10, 56, null],
    [10, 5.8, 5.25, 10.3, 57, 'HAUPTMARKT'], [16.3, 4.3, 4, 9.7, 58, null], [21.1, 5.3, 4.7, 10.2, 59, 'WEIN & VIEZ'],
  ];
  north.forEach(([x, w, h, d, seed, sign]) => createTownhouse(root, { x, z: 17.5, w, h, d, facade: choose(PALETTE.sandstone, seed), roof: choose(PALETTE.roof, seed + 3), seed, sign }));
  const south = [
    [-23, 5, 4.7, 9, 71, null], [-17.4, 4.2, 3.8, 9.2, 72, 'FLEISCHSTRASSE'], [-12.2, 5.6, 5.1, 10.3, 73, null],
    [-5.7, 4.5, 4.15, 9.4, 74, 'BLUMEN'], [1.2, 6.2, 5.4, 10.6, 75, null], [8.5, 4.5, 4.3, 9.5, 76, null],
    [14, 5.6, 5, 10.1, 77, 'BRÖTCHEN & VIEZ'], [20.5, 5.1, 4.6, 9.7, 78, null],
  ];
  south.forEach(([x, w, h, d, seed, sign]) => createTownhouse(root, { x, z: -17.5, w, h, d, rotation: Math.PI, facade: choose(PALETTE.sandstone, seed), roof: choose(PALETTE.roof, seed + 3), seed, sign }));
  const west = [
    [-22.8, -9, 4.3, 4.1, 8, 91], [-23.2, -2.5, 5.2, 4.4, 8.2, 92], [-23, 4.8, 4.7, 4.1, 8, 93], [-22.5, 10.3, 4.1, 3.9, 7.5, 94],
  ];
  west.forEach(([x, z, w, h, d, seed]) => createTownhouse(root, { x, z, w, h, d, rotation: Math.PI / 2, facade: choose(PALETTE.sandstone, seed), roof: choose(PALETTE.roof, seed + 2), seed }));
  const east = [
    [23.3, -10, 4.5, 4.4, 8.3, 101], [23.1, -3.6, 5.4, 4.8, 8.5, 102], [23.3, 3.8, 4.2, 4.2, 8, 103], [23.2, 10.1, 4.7, 4.5, 8.2, 104],
  ];
  east.forEach(([x, z, w, h, d, seed]) => createTownhouse(root, { x, z, w, h, d, rotation: -Math.PI / 2, facade: choose(PALETTE.sandstone, seed), roof: choose(PALETTE.roof, seed + 2), seed }));

  addFountain(root);
  addWineStand(root, -12.9, 2.1);
  addCafeTerrace(root, 13.6, 2.25);
  addMarketStall(root, 7.4, -3.2, 'BLUMEN', 0xd9707b, 0xf0d7a4);
  addMarketStall(root, -9.6, -4.2, 'REGIONAL', 0x5c7d59, 0xf0d7a4);
  addStreetMusicCorner(root, -2.7, -7.35);

  // The little side alleys keep the market legible while making the plaza feel larger than real life.
  for (const [x, z, rotation] of [[-20.4, 8.5, .2], [-20.2, -7.9, -.2], [20.2, 8.3, -.3], [19.7, -8.4, .22]]) {
    addBicycle(root, x, z, rotation);
    addPlanter(root, x + .8, z + .45, rotation, choose(PALETTE.flower, x * 3));
  }
  [[-15, -5.7, 0], [-8.2, 6.4, Math.PI / 2], [7.5, -6.7, Math.PI], [16.8, -7.6, Math.PI / 2], [3.7, 8, .3]].forEach(([x, z, rotation]) => addBench(root, x, z, rotation));
  [[-18, -7], [-16, 7.4], [-8.7, -9.2], [-6.6, 9], [7.7, 8.7], [10.1, -8.3], [18, 7.3], [18.3, -5.6]].forEach(([x, z], index) => addTree(root, x, z, .82 + (index % 3) * .1, index + 120));
  [[-20, -12], [-14.5, -12.3], [-8, -12.3], [-1, -12], [6.2, -12.4], [13, -12.4], [20, -12], [-19, 12.5], [-11, 12.5], [-3, 12.6], [5, 12.5], [13, 12.6], [20, 12.4]].forEach(([x, z], index) => addPlanter(root, x, z, index % 2 ? Math.PI / 2 : 0, choose(PALETTE.flower, index + 300)));
  addFlowerDrifts(root);

  const lampPositions = [[-18, -3], [-13, 8], [-8, -5], [-4, 9], [5, -7], [9, 8], [17, -3], [19, 8], [-2.8, -9], [2, 9.6]];
  lampPositions.forEach(([x, z], index) => addLamp(root, x, z, index % 2 === 0));

  // 36 market visitors: walkers, seated guests, photography, music, drinks and pigeon feeding.
  const placement = [
    [-10.8, .2, 'serve'], [-9.4, .45, 'drink'], [-13.5, .8, 'stand'], [-14.3, 3.1, 'stand'], [-12.3, 4.1, 'drink'],
    [11.6, -1.2, 'sit'], [12.7, -2.8, 'sit'], [14.2, -3.6, 'drink'], [15.4, -2.1, 'sit'], [16.6, -3.5, 'drink'], [14.7, -.6, 'serve'],
    [-2.7, -7.2, 'music'], [-1.7, -6.3, 'listen'], [-3.8, -6.4, 'listen'], [-.4, -7.6, 'phone'], [1.2, -6.3, 'stand'],
    [-4.4, 2.6, 'photo'], [-5.4, 1.5, 'photo'], [3.2, 3.5, 'stand'], [4.1, 2.3, 'drink'], [6.8, 4.8, 'stand'],
    [-15, -5.6, 'sit'], [-16.1, -5.7, 'sit'], [7.4, -6.8, 'sit'], [8.6, -6.9, 'stand'], [17.8, 4, 'phone'],
    [-7.4, -1.9, 'feed'], [-6.6, -1.4, 'feed'], [-5.7, -2.3, 'stand'], [8.9, 6.6, 'stand'], [10.2, 7, 'phone'],
    [-18.8, 1.6, 'walk'], [18.2, -1.1, 'walk'], [4.3, -3.6, 'walk'], [-1.6, 7.2, 'walk'], [2.4, -8.4, 'walk'],
  ];
  placement.forEach(([x, z, mode], index) => {
    const routes = [
      [new THREE.Vector3(-17, -0, -4.8), new THREE.Vector3(-3.4, 0, -4.9), new THREE.Vector3(5.8, 0, -4.2), new THREE.Vector3(18, 0, -3.8)],
      [new THREE.Vector3(-16, 0, 5.3), new THREE.Vector3(-4, 0, 6.5), new THREE.Vector3(7, 0, 5.6), new THREE.Vector3(17, 0, 5.8)],
    ];
    const citizen = createCitizen(index, {
      mode,
      home: new THREE.Vector3(x, 0, z),
      route: routes[index % routes.length],
      phone: mode === 'phone' || mode === 'photo',
      drink: mode === 'drink' || mode === 'sit',
      guitar: mode === 'music',
      outfit: mode === 'serve' ? 0x293c37 : undefined,
    });
    citizen.position.set(x, 0, z);
    if (mode === 'sit') {
      citizen.position.y = -.27;
      citizen.rotation.x = -.1;
      citizen.scale.set(.94, .84, .94);
    }
    if (mode === 'music') citizen.rotation.y = .4;
    if (mode === 'photo') citizen.rotation.y = -2.25;
    root.add(citizen);
    citizens.push(citizen);
  });
  pigeons.push(...createPigeons(root, -6.6, -1.65));

  const warmSky = new THREE.Color(0xdda96a);
  scene.background = warmSky;
  scene.fog = new THREE.Fog(0xdda96a, 30, 74);
  scene.add(new THREE.HemisphereLight(0xffe4b8, 0x274335, 2.05));
  const sun = new THREE.DirectionalLight(0xffb969, 4.15);
  sun.position.set(-28, 30, 14);
  sun.castShadow = true;
  const shadowSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -31;
  sun.shadow.camera.right = 31;
  sun.shadow.camera.top = 31;
  sun.shadow.camera.bottom = -31;
  sun.shadow.bias = -.00025;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x8bb0c5, .55);
  fill.position.set(16, 10, -24);
  scene.add(fill);

  function update(time) {
    citizens.forEach((citizen, index) => {
      const { mode, phase, route, home } = citizen.userData;
      if (mode === 'walk') {
        const travel = (time * .18 + phase * .12) % (route.length - 1);
        const leg = Math.floor(travel);
        const amount = travel - leg;
        const from = route[leg];
        const to = route[leg + 1];
        citizen.position.lerpVectors(from, to, amount);
        citizen.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
        citizen.position.y = Math.abs(Math.sin(time * 7 + phase)) * .028;
      } else {
        citizen.position.x = home.x + Math.sin(time * (.18 + (index % 3) * .03) + phase) * .025;
        citizen.position.z = home.z + Math.cos(time * .22 + phase) * .018;
        citizen.position.y = (mode === 'sit' ? -.27 : 0) + Math.sin(time * 1.6 + phase) * .012;
        if (mode === 'listen' || mode === 'feed') citizen.rotation.y = Math.sin(time * .44 + phase) * .35 + .3;
      }
    });
    pigeons.forEach((pigeon) => {
      const { baseX, baseZ, phase } = pigeon.userData;
      pigeon.position.x = baseX + Math.sin(time * .7 + phase) * .14;
      pigeon.position.z = baseZ + Math.cos(time * .52 + phase) * .12;
      pigeon.position.y = .09 + Math.abs(Math.sin(time * 3 + phase)) * .018;
    });
  }

  return {
    root,
    visitorCount: citizens.length,
    update,
    clampPosition(position) {
      position.x = THREE.MathUtils.clamp(position.x, -20.5, 20.5);
      position.z = THREE.MathUtils.clamp(position.z, -11.8, 11.8);
      return position;
    },
    getLocation() { return { name: 'Hauptmarkt' }; },
  };
}
