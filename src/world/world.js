import * as THREE from 'three';
import cobblestoneUrl from '../assets/hauptmarkt-cobblestone.png';
import slateRoofUrl from '../assets/trier-slate-roof.png';

const PALETTE = {
  sandstone: [0xd6b27f, 0xc99165, 0xe0c599, 0xb98762, 0xd3a876],
  roof: [0xb0aaa1, 0xabb5b7, 0xb59a90, 0x9caeb1],
  leaf: [0x42613e, 0x587448, 0x35523c, 0x6d824e],
  flower: [0xd67175, 0xe9b35c, 0xc65c8c, 0xf2ded0],
  outfit: [0x3f5f50, 0x4d6075, 0x735348, 0x9a7041, 0x475348, 0x6f4243, 0x384654],
  hair: [0x291c18, 0x553524, 0x8c633d, 0x3a2a22],
  skin: [0xf0bf91, 0xd99668, 0xb97452, 0xf3cfaa],
};

const shared = {
  leg: new THREE.CapsuleGeometry(0.085, 0.42, 5, 8),
  torso: new THREE.CapsuleGeometry(0.25, 0.47, 6, 12),
  head: new THREE.SphereGeometry(0.225, 14, 11),
  hair: new THREE.SphereGeometry(0.232, 14, 9, 0, Math.PI * 2, 0, Math.PI / 1.9),
  arm: new THREE.CapsuleGeometry(0.055, 0.38, 5, 8),
  pigeon: new THREE.SphereGeometry(0.075, 9, 7),
};

let roofTexture;
let cobblestoneTexture;

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
  // Every roof side receives its own UV island. The slate asset is a material on
  // actual pitched geometry, not a flat scene backdrop, so it keeps its texture
  // when the camera follows the player.
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
    0, 0, 1, 0, 1, 1,  0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,  0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,  0, 0, 1, 1, 0, 1,
  ]), 2));
  geometry.computeVertexNormals();
  const roof = new THREE.Mesh(geometry, material(color, {
    map: getRoofTexture(),
    roughness: 0.88,
    emissive: 0x3a2b25,
    emissiveIntensity: 0.28,
    side: THREE.DoubleSide,
  }));
  roof.castShadow = true;
  roof.receiveShadow = true;
  return roof;
}

function getRoofTexture() {
  if (roofTexture) return roofTexture;
  roofTexture = new THREE.TextureLoader().load(slateRoofUrl);
  roofTexture.colorSpace = THREE.SRGBColorSpace;
  roofTexture.wrapS = THREE.RepeatWrapping;
  roofTexture.wrapT = THREE.RepeatWrapping;
  roofTexture.repeat.set(2.1, 2.1);
  roofTexture.anisotropy = 6;
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
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.028, 0.032), material(0x243139));
  crossbar.position.copy(mullion.position);
  parent.add(crossbar);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + 0.16, 0.055, 0.12), material(0xe5c99f, { roughness: .58 }));
  sill.position.set(x, y - height / 2 - .04, z + side * .1);
  sill.castShadow = true;
  parent.add(sill);
}

function addPlanter(parent, x, z, rotation = 0, flowers = 0xd67175) {
  const planter = new THREE.Group();
  planter.position.set(x, 0, z);
  planter.rotation.y = rotation;
  addBox(planter, { w: 0.95, h: 0.28, d: 0.42, color: 0x76513b });
  addBox(planter, { y: 0.28, w: 0.78, h: 0.08, d: 0.32, color: 0x453827 });
  for (let i = 0; i < 4; i += 1) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), material(choose(PALETTE.leaf, i + x * 5)));
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

// The next three landmarks are deliberately modelled from the distinctive rhythm of
// Trier's Hauptmarkt: the Steipe, St. Gangolf's tower and the ornate gabled houses.
// They make the square legible as Trier rather than a generic old town.
function addGableFace(parent, { w, wallHeight, gableHeight, front, color, timber = false }) {
  const positions = new Float32Array([
    -w / 2, wallHeight, front, w / 2, wallHeight, front, 0, wallHeight + gableHeight, front,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const gable = new THREE.Mesh(geometry, material(color, { roughness: .68, side: THREE.DoubleSide }));
  parent.add(gable);
  if (timber) {
    addBox(parent, { y: wallHeight + gableHeight * .38, z: front - .025, w: w * .72, h: .07, d: .045, color: 0x563a2d });
    const diagonal = new THREE.Mesh(new THREE.BoxGeometry(w * .58, .06, .045), material(0x563a2d));
    diagonal.position.set(0, wallHeight + gableHeight * .43, front - .045);
    diagonal.rotation.z = -.64;
    parent.add(diagonal);
  }
}

function addArcade(parent, x, z, width = .72, height = 1.35, side = -1, color = 0x7d5b45) {
  const depth = .08;
  addBox(parent, { x: x - width / 2, y: .02, z, w: .12, h: height * .72, d: depth, color });
  addBox(parent, { x: x + width / 2, y: .02, z, w: .12, h: height * .72, d: depth, color });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(width / 2, .065, 6, 18, Math.PI), material(color, { roughness: .55 }));
  arch.position.set(x, height * .72, z + side * .02);
  arch.rotation.z = 0;
  parent.add(arch);
}

function createGabledHouse(parent, spec) {
  const { x, z, w, h, d = 3.8, facade, roof = 0xaab2b3, seed, sign, rotation = 0, ornate = false } = spec;
  const house = new THREE.Group();
  house.position.set(x, 0, z);
  house.rotation.y = rotation;
  addBox(house, { w, h, d, color: facade, roughness: .71 });
  const front = -d / 2 - .035;
  // Narrow pilasters and floor bands give the stylised facades a real, built
  // rhythm instead of a single flat coloured block.
  for (const edge of [-w / 2 + .12, w / 2 - .12]) {
    addBox(house, { x: edge, y: .15, z: front - .03, w: .1, h: h - .18, d: .07, color: ornate ? 0xa65d51 : 0xe8cfaa });
  }
  for (let story = 0; story < 3; story += 1) {
    const y = 1.18 + story * 1.02;
    for (let col = 0; col < Math.max(2, Math.floor(w / .72)); col += 1) {
      const colW = w / Math.max(2, Math.floor(w / .72));
      addWindow(house, -w / 2 + colW * (col + .5), y, front, -1, Math.min(.43, colW - .16), .58, true);
    }
    if (story < 2) addBox(house, { y: y + .38, z: front - .035, w: w * .94, h: .055, d: .06, color: ornate ? 0xf1d4b4 : 0xe3c59a });
  }
  addGableFace(house, { w: w + .1, wallHeight: h, gableHeight: Math.min(2.15, w * .43), front: front - .05, color: facade, timber: ornate });
  const roofMesh = makeRoof(w, d, h, roof);
  house.add(roofMesh);
  const portal = new THREE.Mesh(new THREE.BoxGeometry(.72, 1.18, .09), material(ornate ? 0x74473a : 0x4a3d36, { roughness: .42 }));
  portal.position.set(ornate ? -.16 : .12, .59, front - .07);
  house.add(portal);
  if (ornate) {
    const crest = new THREE.Mesh(new THREE.CircleGeometry(.17, 12), material(0xf0c57e, { metalness: .22, roughness: .4 }));
    crest.position.set(0, h + .58, front - .085);
    house.add(crest);
    for (const windowY of [h + .48, h + .98]) {
      const gableWindow = new THREE.Mesh(new THREE.CircleGeometry(.13, 10), material(0xffcf83, { emissive: 0x6e3e1f, emissiveIntensity: .5 }));
      gableWindow.position.set(0, windowY, front - .082);
      house.add(gableWindow);
    }
  }
  if (sign) addLabel(house, sign, 0, 1.72, front - .14, Math.min(1.02, w * .22));
  parent.add(house);
  return house;
}

function addSteipe(parent, x, z) {
  const steipe = new THREE.Group();
  steipe.name = 'Steipe – Trierer Hauptmarkt';
  steipe.position.set(x, 0, z);
  const facade = 0xf0e4cf;
  const accent = 0x9a483d;
  addBox(steipe, { w: 6.2, h: 5.55, d: 3.9, color: facade, roughness: .63 });
  const front = -2.01;
  for (let bay = -2; bay <= 2; bay += 1) addArcade(steipe, bay * 1.12, front - .045, .78, 1.45, -1, accent);
  for (let story = 0; story < 3; story += 1) {
    for (let bay = -2; bay <= 2; bay += 1) {
      addWindow(steipe, bay * 1.08, 2.08 + story * .9, front - .01, -1, .5, .58, true);
      if (story === 0) {
        const hood = new THREE.Mesh(new THREE.ConeGeometry(.35, .17, 4), material(accent));
        hood.position.set(bay * 1.08, 2.43, front - .12);
        hood.rotation.x = Math.PI / 4;
        steipe.add(hood);
      }
    }
  }
  addBox(steipe, { y: 5.4, w: 6.45, h: .17, d: 4.1, color: 0xd5bc99 });
  for (let crenel = -2.65; crenel <= 2.65; crenel += .66) addBox(steipe, { x: crenel, y: 5.57, z: front + .15, w: .3, h: .35, d: .32, color: accent });
  steipe.add(makeRoof(6.2, 3.9, 5.55, 0xa8b0b1));
  for (const towerX of [-2.52, 2.52]) {
    const turret = new THREE.Group();
    turret.position.set(towerX, 5.53, front + .18);
    addCylinder(turret, { rTop: .29, rBottom: .34, h: .68, sides: 8, color: facade });
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.48, .92, 6), material(0xaab2b1, { map: getRoofTexture(), roughness: .78 }));
    cap.position.y = .99;
    turret.add(cap);
    steipe.add(turret);
  }
  addLabel(steipe, 'STEIPE', 0, 1.68, front - .2, .86, '#f0c56f');
  parent.add(steipe);
  return steipe;
}

function addGangolfTower(parent, x, z) {
  const tower = new THREE.Group();
  tower.name = 'St. Gangolf – Hauptmarkt';
  tower.position.set(x, 0, z);
  const stone = 0xc8a779;
  addBox(tower, { w: 2.85, h: 7.4, d: 2.85, color: stone, roughness: .73 });
  addBox(tower, { y: 4.2, w: 3.1, h: .18, d: 3.1, color: 0xe1c69b });
  for (const y of [3.15, 5.02, 5.98]) {
    for (const xOffset of [-.7, .7]) addWindow(tower, xOffset, y, -1.47, -1, .42, .83, y > 5 ? false : true);
  }
  for (let battlement = -1.1; battlement <= 1.1; battlement += .55) addBox(tower, { x: battlement, y: 7.28, z: -1.18, w: .25, h: .38, d: .3, color: 0xb58c60 });
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.42, 5.55, 4), material(0xa4afb2, { map: getRoofTexture(), roughness: .8 }));
  spire.position.y = 10.1;
  spire.rotation.y = Math.PI / 4;
  spire.castShadow = true;
  tower.add(spire);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(.08, .85, .08), material(0xd2b06f, { metalness: .32 }));
  cross.position.y = 13.05;
  tower.add(cross);
  const crossBar = new THREE.Mesh(new THREE.BoxGeometry(.45, .08, .08), material(0xd2b06f, { metalness: .32 }));
  crossBar.position.set(0, 13.28, 0);
  tower.add(crossBar);
  parent.add(tower);
  return tower;
}

function addTree(parent, x, z, scale = 1, seed = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  addCylinder(tree, { rTop: .11 * scale, rBottom: .17 * scale, h: 1.52 * scale, sides: 8, color: 0x65452c });
  const canopy = new THREE.Group();
  const first = new THREE.Mesh(new THREE.SphereGeometry(.72 * scale, 14, 10), material(choose(PALETTE.leaf, seed)));
  first.position.set(-.13 * scale, 1.72 * scale, .04 * scale);
  const second = new THREE.Mesh(new THREE.SphereGeometry(.62 * scale, 14, 10), material(choose(PALETTE.leaf, seed + 1)));
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
  addBox(stand, { y: 2.46, w: 3.82, h: .1, d: 1.78, color: 0x315048, roughness: .5 });
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
  // Friday evening light strings make the Viez stand the social heart of the square.
  const bulbMaterial = material(0xffd887, { emissive: 0xff9d36, emissiveIntensity: 1.8, roughness: .25 });
  for (let bulb = -6; bulb <= 6; bulb += 1) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), bulbMaterial);
    lamp.position.set(bulb * .24, 2.36 - Math.abs(bulb) * .025, -.82);
    stand.add(lamp);
  }
  for (const [tableX, tableZ] of [[-1.7, 1.55], [1.55, 1.62], [2.3, .85]]) {
    addCylinder(stand, { x: tableX, z: tableZ, rTop: .28, rBottom: .28, h: .58, sides: 12, color: 0x68432e });
    addCylinder(stand, { x: tableX, y: .58, z: tableZ, rTop: .42, rBottom: .42, h: .055, sides: 12, color: 0xd2a36a, roughness: .42 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(.05, .075, .14, 8), material(0xe8dbc2, { transparent: true, opacity: .7, roughness: .16 }));
    glass.position.set(tableX + .09, .74, tableZ);
    stand.add(glass);
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
  fountain.name = 'Petrusbrunnen – Hauptmarkt';
  addCylinder(fountain, { rTop: 2.62, rBottom: 2.84, h: .24, sides: 48, color: 0xd8c09a, roughness: .56 });
  addCylinder(fountain, { y: .23, rTop: 2.38, rBottom: 2.38, h: .14, sides: 48, color: 0x3b8290, metalness: .22, roughness: .18, transparent: true, opacity: .92 });
  addCylinder(fountain, { y: .34, rTop: .72, rBottom: .94, h: .42, sides: 16, color: 0xd0b17d, roughness: .62 });
  addCylinder(fountain, { y: .76, rTop: .38, rBottom: .55, h: 2.1, sides: 12, color: 0xc6a674, roughness: .67 });
  addCylinder(fountain, { y: 2.78, rTop: .78, rBottom: .41, h: .2, sides: 20, color: 0xd9bd8c });
  const statue = new THREE.Group();
  statue.position.y = 2.98;
  const robe = new THREE.Mesh(new THREE.ConeGeometry(.34, 1.05, 9), material(0x926b47, { metalness: .16, roughness: .55 }));
  robe.position.y = .44;
  statue.add(robe);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8), material(0x9b714b, { metalness: .16, roughness: .5 }));
  torso.position.y = .98;
  statue.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), material(0xb78b59, { metalness: .13, roughness: .5 }));
  head.position.y = 1.28;
  statue.add(head);
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.33, 6), material(0xd4b873, { metalness: .46, roughness: .3 }));
  staff.position.set(.26, .7, 0);
  staff.rotation.z = -.13;
  statue.add(staff);
  fountain.add(statue);
  const waterMaterial = new THREE.MeshBasicMaterial({ color: 0xd8f2eb, transparent: true, opacity: .56, depthWrite: false });
  for (let i = 0; i < 6; i += 1) {
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(.022, .045, 1.16, 7, 1, true), waterMaterial);
    stream.position.set(Math.cos(i * Math.PI / 3) * .46, 2.22, Math.sin(i * Math.PI / 3) * .46);
    stream.rotation.z = (i % 2 ? -.18 : .18);
    fountain.add(stream);
  }
  parent.add(fountain);
  return fountain;
}

// A Romanesque, sandstone interpretation of Trier Cathedral. Its broad nave,
// paired massing and restrained tower caps deliberately avoid the silhouette of
// a generic Gothic/fantasy cathedral.
function addTrierDom(parent, x, z, quality) {
  const dom = new THREE.Group();
  dom.name = 'Trierer Dom – Domfreihof';
  dom.position.set(x, 0, z);
  dom.rotation.y = Math.PI;
  const sandstone = 0xc99f72;
  const lightStone = 0xe0bf91;
  const darkRoof = 0x5a6267;
  addBox(dom, { w: 14.2, h: 10.1, d: 10.8, color: sandstone, roughness: .7 });
  addBox(dom, { y: 8.5, w: 14.7, h: .24, d: 11.15, color: lightStone });
  dom.add(makeRoof(14.2, 10.8, 10.1, darkRoof));
  // Broad transept and a semi-octagonal eastern choir make the footprint feel
  // specific to the Romanesque Trier landmark rather than a narrow church.
  addBox(dom, { y: 3.15, w: 18.2, h: 6.2, d: 4.3, color: 0xd4ae80 });
  dom.add(makeRoof(18.2, 4.3, 6.2, darkRoof));
  const choir = new THREE.Group();
  choir.position.set(0, 0, 5.95);
  addCylinder(choir, { rTop: 4.15, rBottom: 4.15, h: 8.4, sides: 8, color: 0xd2ab7d });
  choir.add(makeRoof(8.1, 6.2, 8.35, darkRoof));
  dom.add(choir);
  for (const towerX of [-5.45, 5.45]) {
    const tower = new THREE.Group();
    tower.position.set(towerX, 0, -5.9);
    addBox(tower, { w: 3.65, h: 16.1, d: 4.25, color: lightStone, roughness: .68 });
    for (const band of [4.4, 9.0, 13.2]) addBox(tower, { y: band, w: 3.95, h: .16, d: 4.52, color: 0xb98d62 });
    for (const y of [6.1, 10.7, 13.8]) {
      addWindow(tower, -.72, y, -2.18, -1, .55, y > 12 ? .95 : .72, false);
      addWindow(tower, .72, y, -2.18, -1, .55, y > 12 ? .95 : .72, false);
    }
    for (let crenel = -1.35; crenel <= 1.35; crenel += .55) addBox(tower, { x: crenel, y: 15.95, z: -1.7, w: .26, h: .5, d: .32, color: 0xb78960 });
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.15, 2.35, 4), material(0x697278, { map: getRoofTexture(), roughness: .85 }));
    cap.position.y = 17.55;
    cap.rotation.y = Math.PI / 4;
    cap.castShadow = true;
    tower.add(cap);
    dom.add(tower);
  }
  const front = -5.48;
  addBox(dom, { y: .02, z: front - .08, w: 8.2, h: 1.12, d: .28, color: 0xb98960 });
  for (const doorX of [-2.4, 0, 2.4]) {
    const portal = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.6, .16), material(0x4b3b32, { roughness: .46 }));
    portal.position.set(doorX, 1.3, front - .1);
    dom.add(portal);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(.72, .12, 8, 18, Math.PI), material(0xb7865e));
    arch.position.set(doorX, 2.58, front - .2);
    dom.add(arch);
  }
  const rose = new THREE.Mesh(new THREE.CircleGeometry(.82, 16), material(0x9ec7d1, { emissive: 0x446a75, emissiveIntensity: .4, roughness: .3 }));
  rose.position.set(0, 6.65, front - .13);
  dom.add(rose);
  for (const xOffset of [-4.5, -2.5, 2.5, 4.5]) addWindow(dom, xOffset, 5.1, front, -1, .58, 1.18, true);
  if (quality !== 'low') {
    for (let candle = -3; candle <= 3; candle += 1) {
      const glow = new THREE.PointLight(0xffb862, .2, 6, 2);
      glow.position.set(candle * 1.4, 3.1, front - .7);
      dom.add(glow);
    }
  }
  addLabel(dom, 'HOHER DOM ZU TRIER', 0, 3.85, front - .46, 1.16, '#efcb7d');
  parent.add(dom);
  return dom;
}

// The Porta is intentionally a broad, dark Roman gate rather than a castle:
// twin massive sandstone towers, the two traffic arches and a stepped forecourt
// make it immediately legible as Trier's northern entrance.
function addPortaNigra(parent, x, z, quality) {
  const porta = new THREE.Group();
  porta.name = 'Porta Nigra – Trier';
  porta.position.set(x, 0, z);
  const stone = 0x5f5a55;
  const edge = 0x847c70;
  for (const towerX of [-5.3, 5.3]) {
    addBox(porta, { x: towerX, w: 5.2, h: 15.5, d: 6.2, color: stone, roughness: .88 });
    for (const y of [3.3, 7.2, 11.3]) {
      addBox(porta, { x: towerX, y, w: 5.5, h: .18, d: 6.5, color: edge });
      for (const wx of [-.95, .95]) addWindow(porta, towerX + wx, y + 1.25, -3.13, -1, .62, .82, false);
    }
    for (let crenel = -1.9; crenel <= 1.9; crenel += .62) addBox(porta, { x: towerX + crenel, y: 15.35, z: -2.45, w: .32, h: .55, d: .34, color: 0x756b61 });
  }
  addBox(porta, { y: 5.5, w: 7.8, h: 10, d: 5.8, color: 0x67615a, roughness: .86 });
  for (const archX of [-2.0, 2.0]) {
    const opening = new THREE.Mesh(new THREE.BoxGeometry(2.1, 4.65, .2), material(0x1d2426, { roughness: .9 }));
    opening.position.set(archX, 2.35, -3.0);
    porta.add(opening);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.05, .22, 8, 20, Math.PI), material(edge, { roughness: .8 }));
    arch.position.set(archX, 4.65, -3.17);
    porta.add(arch);
  }
  for (let step = 0; step < 4; step += 1) addBox(porta, { y: step * .16, z: -4.25 - step * .22, w: 13.5 + step * .5, h: .16, d: .78, color: 0x8f8170 });
  addLabel(porta, 'PORTA NIGRA', 0, 6.7, -3.36, 1.12, '#d6ba82');
  if (quality !== 'low') {
    const lateSun = new THREE.PointLight(0xffb86e, 1.1, 18, 1.8);
    lateSun.position.set(-7.5, 7, -9);
    porta.add(lateSun);
  }
  parent.add(porta);
  return porta;
}

function addModernBus(parent, x, z) {
  const bus = new THREE.Group();
  bus.position.set(x, 0, z);
  addBox(bus, { w: 2.5, h: 2.2, d: 6.2, color: 0xf2eee3, roughness: .42 });
  addBox(bus, { y: 1.2, z: -3.13, w: 2.2, h: .66, d: .08, color: 0x284958, metalness: .2, roughness: .28 });
  for (const side of [-1, 1]) for (const offset of [-1.65, -.55, .55, 1.65]) addCylinder(bus, { x: side * 1.15, z: offset, rTop: .34, rBottom: .34, h: .14, sides: 12, color: 0x202628 });
  parent.add(bus);
}

function addSimeonstrasse(parent, quality) {
  const street = new THREE.Group();
  street.name = 'Simeonstraße – Porta Nigra zum Hauptmarkt';
  const paving = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 38), material(0xd6bd94, { map: loadCobblestones(), roughness: .9 }));
  paving.rotation.x = -Math.PI / 2;
  paving.position.set(-27, -.012, 35);
  street.add(paving);
  const west = [[-32.3, 21.5, 4.4, 4.4, 301, 'EIS'], [-32.3, 27.2, 4.1, 4.8, 302, 'BÄCKEREI'], [-32.3, 33.0, 4.5, 4.3, 303, null], [-32.3, 39.0, 4.1, 4.75, 304, 'TRIER'], [-32.3, 45.0, 4.4, 4.4, 305, 'BUCHLADEN'], [-32.3, 51.0, 4.0, 4.6, 306, null]];
  const east = [[-21.7, 21.8, 4.2, 4.6, 311, 'SOUVENIRS'], [-21.7, 27.8, 4.5, 4.35, 312, null], [-21.7, 33.5, 4.0, 4.8, 313, 'CAFÉ'], [-21.7, 39.3, 4.45, 4.45, 314, null], [-21.7, 45.3, 4.0, 4.7, 315, 'MARKT'], [-21.7, 51.1, 4.2, 4.25, 316, null]];
  west.forEach(([bx, bz, w, h, seed, sign]) => createTownhouse(street, { x: bx, z: bz, w, h, d: 3.8, facade: choose([0xe1d3bf, 0xd69c7b, 0xf0c78b, 0xd7c4a9], seed), roof: 0x626a70, seed, rotation: -Math.PI / 2, sign }));
  east.forEach(([bx, bz, w, h, seed, sign]) => createTownhouse(street, { x: bx, z: bz, w, h, d: 3.8, facade: choose([0xe8ddca, 0xc98570, 0xe8ba87, 0xd3b596], seed), roof: 0x60696f, seed, rotation: Math.PI / 2, sign }));
  [[-30.5, 24.2], [-23.6, 29.6], [-30.5, 35.7], [-23.7, 42.3], [-30.5, 48.1]].forEach(([px, pz], index) => {
    addPlanter(street, px, pz, index % 2 ? Math.PI / 2 : 0, choose(PALETTE.flower, index + 640));
    addLamp(street, px + (index % 2 ? .35 : -.35), pz + .65, false);
  });
  [[-30.6, 31.3, .2], [-23.4, 38.4, -.2], [-30.5, 46.4, .1]].forEach(([bx, bz, rot]) => addBicycle(street, bx, bz, rot));
  addModernBus(street, -36.8, 59.4);
  addPortaNigra(street, -27, 64.6, quality);
  parent.add(street);
  return street;
}

function addSternstrasse(parent) {
  const street = new THREE.Group();
  street.name = 'Sternstraße – Verbindung zum Domfreihof';
  // The street begins at the east-north corner of the Hauptmarkt and opens
  // northeast toward the Domfreihof, matching the real spatial relationship.
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 23.5), material(0xd8bd91, { map: loadCobblestones(), roughness: .9 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(27.4, -.015, 25.2);
  street.add(road);
  const left = [
    [22.1, 17.4, 4.3, 4.9, 201, 'STERN 1'], [22.0, 22.7, 3.7, 4.2, 202, 'BUCH & KULTUR'],
    [22.1, 27.5, 4.5, 4.7, 203, null], [22.0, 32.0, 3.9, 4.4, 204, 'KAFFEE'],
  ];
  const right = [
    [32.7, 17.8, 4.1, 4.5, 211, 'STERNSTRASSE'], [32.8, 22.6, 4.4, 4.7, 212, null],
    [32.6, 27.6, 3.9, 4.25, 213, 'TRIER'], [32.7, 32.1, 4.2, 4.8, 214, 'STADTPLAN'],
  ];
  left.forEach(([bx, bz, w, h, seed, sign]) => createTownhouse(street, { x: bx, z: bz, w, h, d: 3.5, facade: choose([0xe9dfcf, 0xd4907d, 0xf0c78d, 0xc98772], seed), roof: 0x687076, seed, rotation: -Math.PI / 2, sign }));
  right.forEach(([bx, bz, w, h, seed, sign]) => createTownhouse(street, { x: bx, z: bz, w, h, d: 3.5, facade: choose([0xebdfcc, 0xc97b6d, 0xe4b487, 0xd8c3a3], seed), roof: 0x626b72, seed, rotation: Math.PI / 2, sign }));
  [[24.0, 19.3], [30.8, 24.8], [24.0, 30.2], [30.7, 31.0]].forEach(([px, pz], index) => {
    addPlanter(street, px, pz, index % 2 ? Math.PI / 2 : 0, choose(PALETTE.flower, index + 410));
    addLamp(street, index % 2 ? px - .45 : px + .45, pz + .45, false);
  });
  [[24.15, 22.2, .3], [30.7, 28.7, -.35], [24.1, 33.2, .2]].forEach(([px, pz, rotation]) => addBicycle(street, px, pz, rotation));
  parent.add(street);
  return street;
}

function addDomfreihof(parent, quality) {
  const court = new THREE.Group();
  court.name = 'Domfreihof – Trier';
  // An intentionally roomier, calmer plane than the market, framed by the Dom.
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), material(0xe2cba4, { map: loadCobblestones(), roughness: .9 }));
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(40, -.012, 42);
  court.add(surface);
  addTrierDom(court, 40, 51.2, quality);
  [
    [25.4, 37.2, 4.4, 4.35, 231, 'DOMFREIHOF'], [25.2, 44.2, 4.2, 4.6, 232, null],
    [54.5, 37.4, 4.6, 4.8, 233, 'CAFÉ DOM'], [54.5, 44.2, 4.1, 4.4, 234, null],
  ].forEach(([bx, bz, w, h, seed, sign]) => createGabledHouse(court, { x: bx, z: bz, w, h, d: 4.3, facade: choose([0xe5dac8, 0xd3ab80, 0xe9d6ba], seed), roof: 0x677078, seed, sign, rotation: bx < 40 ? -Math.PI / 2 : Math.PI / 2, ornate: seed % 2 === 0 }));
  [[28.7, 36.1], [29.5, 47.3], [51.8, 35.3], [52.1, 47.4], [34.4, 34.7]].forEach(([tx, tz], index) => addTree(court, tx, tz, .9 + (index % 2) * .1, index + 510));
  [[30.4, 40, Math.PI / 2], [49.2, 39.5, -Math.PI / 2], [35.7, 46.8, 0], [45.5, 35.1, 0]].forEach(([bx, bz, rot]) => addBench(court, bx, bz, rot));
  [[28.2, 42.3, .3], [52.2, 40.8, -.4], [33.7, 36.5, .1]].forEach(([px, pz, rot]) => addBicycle(court, px, pz, rot));
  [[31.2, 35.7], [49.7, 35.8], [30.2, 45.8], [50.3, 45.8]].forEach(([px, pz], index) => addPlanter(court, px, pz, index % 2 ? Math.PI / 2 : 0, choose(PALETTE.flower, index + 550)));
  parent.add(court);
  return court;
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
  if (options.bike) {
    const bike = new THREE.Group();
    bike.position.set(.44 * scale, .34 * scale, .08);
    const wheelMaterial = material(0x253038, { metalness: .32, roughness: .45 });
    for (const wheelX of [-.21, .21]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(.15, .016, 5, 12), wheelMaterial);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.x = wheelX;
      bike.add(wheel);
    }
    const frame = new THREE.Mesh(new THREE.BoxGeometry(.39, .035, .035), material(0xc67b39, { metalness: .22 }));
    frame.rotation.z = -.35;
    bike.add(frame);
    person.add(bike);
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
  if (cobblestoneTexture) return cobblestoneTexture;
  const texture = new THREE.TextureLoader().load(cobblestoneUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(7.8, 7.1);
  texture.anisotropy = 6;
  cobblestoneTexture = texture;
  return cobblestoneTexture;
}

function createPavingVariation() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const context = canvas.getContext('2d');
  for (let i = 0; i < 430; i += 1) {
    const seed = i * 13.37;
    const x = hash(seed) * canvas.width;
    const y = hash(seed + 4) * canvas.height;
    const width = 7 + hash(seed + 8) * 25;
    const height = 5 + hash(seed + 12) * 18;
    context.fillStyle = hash(seed + 1) > .52 ? 'rgba(91, 63, 37, .11)' : 'rgba(255, 232, 180, .09)';
    context.beginPath();
    context.roundRect(x, y, width, height, 3 + hash(seed + 5) * 5);
    context.fill();
  }
  for (let i = 0; i < 44; i += 1) {
    context.strokeStyle = 'rgba(74, 57, 40, .18)';
    context.lineWidth = 1 + hash(i) * 2;
    context.beginPath();
    context.moveTo(hash(i * 3) * canvas.width, hash(i * 9) * canvas.height);
    context.lineTo(hash(i * 14) * canvas.width, hash(i * 17) * canvas.height);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addPavingVariation(parent) {
  const overlay = new THREE.Mesh(
    new THREE.PlaneGeometry(104, 116),
    new THREE.MeshBasicMaterial({ map: createPavingVariation(), transparent: true, opacity: .9, depthWrite: false }),
  );
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.y = -.017;
  parent.add(overlay);
  return overlay;
}

export function createWorld(scene, quality = 'medium') {
  const root = new THREE.Group();
  root.name = 'Hauptmarkt Trier – Golden Hour';
  scene.add(root);
  const citizens = [];
  const pigeons = [];

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(104, 116),
    material(0xf3d39d, {
      map: loadCobblestones(),
      roughness: .92,
      metalness: 0,
      emissive: 0x514027,
      emissiveIntensity: .32,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(5, -.03, 29);
  ground.receiveShadow = true;
  root.add(ground);
  addPavingVariation(root).position.set(5, 0, 29);

  // The first playable sight is the Porta Nigra; the street then leads south
  // into the existing Hauptmarkt without loading another scene.
  addSimeonstrasse(root, quality);

  // Hauptmarkt façade sequence: St. Gangolf, the ornate gables and the Steipe are
  // the visual anchors from the supplied Trier photos. Street gaps form the Brot-
  // and Fleischstraße axes instead of sealing the scene as a generic rectangle.
  addGangolfTower(root, -20.5, 14.8);
  [
    [-15.4, 4.25, 4.55, 0xb55e50, 31, 'BROTSTRASSE', false],
    [-10.8, 3.5, 4.18, 0xe5d7b6, 32, null, false],
    [-7.0, 3.9, 4.8, 0xd89689, 33, null, true],
    [-2.65, 4.45, 5.35, 0xc78170, 34, 'HAUPTMARKT', true],
    [2.0, 3.5, 4.4, 0xf1ead8, 35, null, false],
  ].forEach(([x, w, h, facade, seed, sign, ornate]) => createGabledHouse(root, { x, z: 14.7, w, h, facade, roof: choose(PALETTE.roof, seed), seed, sign, ornate }));
  addSteipe(root, 8.2, 14.55);
  [
    [14.15, 3.7, 4.45, 0xe7e0d1, 41, null, false],
    [18.1, 3.95, 4.78, 0xd1a276, 42, 'FLEISCHSTRASSE', false],
    [22.0, 3.4, 4.3, 0xe7ded0, 43, null, false],
  ].forEach(([x, w, h, facade, seed, sign, ornate]) => createGabledHouse(root, { x, z: 14.7, w, h, facade, roof: choose(PALETTE.roof, seed), seed, sign, ornate }));

  [
    [-22.5, 4.4, 4.5, 0xca8b69, 51, null], [-17.6, 4.1, 4.0, 0xf1e4c9, 52, 'WEIN & VIEZ'],
    [-13.2, 4.2, 4.7, 0xd88673, 53, null], [-8.6, 4.5, 4.25, 0xe8ddd0, 54, null],
    [-3.9, 4.4, 4.5, 0xc79a7d, 55, null], [1.0, 4.95, 4.8, 0xe7e4db, 56, 'MARKTCAFÉ'],
    [6.2, 4.2, 4.25, 0xe9c29f, 57, null], [10.7, 4.6, 4.65, 0xc77768, 58, null],
    [15.6, 4.5, 4.45, 0xe1d8cb, 59, null], [20.3, 4.15, 4.1, 0xdca782, 60, null],
  ].forEach(([x, w, h, facade, seed, sign]) => createGabledHouse(root, { x, z: -17.7, w, h, facade, roof: choose(PALETTE.roof, seed), seed, sign, rotation: Math.PI, ornate: seed % 3 === 0 }));

  [
    [-22.8, -9.5, 4.0, 4.2, 0xd8b48c, 71], [-22.8, -3.7, 4.65, 4.5, 0xe5dbcf, 72],
    [-22.7, 2.7, 4.25, 4.15, 0xc97b6b, 73], [-22.8, 8.7, 4.1, 4.25, 0xe3d6bf, 74],
  ].forEach(([x, z, w, h, facade, seed]) => createGabledHouse(root, { x, z, w, h, d: 4.5, facade, roof: choose(PALETTE.roof, seed), seed, rotation: -Math.PI / 2, ornate: seed % 2 === 0 }));
  [
    [23.0, -9.6, 4.15, 4.25, 0xe4d7c2, 81], [23.0, -3.4, 4.8, 4.65, 0xc88770, 82],
    [23.0, 3.1, 4.2, 4.25, 0xf0e7d9, 83], [23.0, 9.1, 4.1, 4.45, 0xd29f79, 84],
  ].forEach(([x, z, w, h, facade, seed]) => createGabledHouse(root, { x, z, w, h, d: 4.5, facade, roof: choose(PALETTE.roof, seed), seed, rotation: Math.PI / 2, ornate: seed % 2 === 0 }));

  addFountain(root);
  addWineStand(root, -12.9, 2.1);
  addCafeTerrace(root, 13.6, 2.25);
  addMarketStall(root, 7.4, -3.2, 'BLUMEN', 0xd9707b, 0xf0d7a4);
  addMarketStall(root, -9.6, -4.2, 'REGIONAL', 0x5c7d59, 0xf0d7a4);
  addStreetMusicCorner(root, -2.7, -7.35);

  // Sprint 3: the market exits naturally into Sternstraße and then opens onto
  // Domfreihof. All three spaces share this same scene and navigation surface.
  addSternstrasse(root);
  addDomfreihof(root, quality);

  // The little side alleys keep the market legible while making the plaza feel larger than real life.
  for (const [x, z, rotation] of [[-20.4, 8.5, .2], [-20.2, -7.9, -.2], [20.2, 8.3, -.3], [19.7, -8.4, .22]]) {
    addBicycle(root, x, z, rotation);
    addPlanter(root, x + .8, z + .45, rotation, choose(PALETTE.flower, x * 3));
  }
  [[-15, -5.7, 0], [-8.2, 6.4, Math.PI / 2], [7.5, -6.7, Math.PI], [16.8, -7.6, Math.PI / 2], [3.7, 8, .3]].forEach(([x, z, rotation]) => addBench(root, x, z, rotation));
  [[-18, -7], [-16, 7.4], [-8.7, -9.2], [-6.6, 9], [7.7, 8.7], [10.1, -8.3], [18, 7.3], [18.3, -5.6], [-18.8, 4.4], [-11.8, 10.2], [4.2, 10.1], [14.9, -9.7], [20.1, 4.6]].forEach(([x, z], index) => addTree(root, x, z, .82 + (index % 3) * .1, index + 120));
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
    [-11.7, 4.9, 'talk'], [-10.9, 5.2, 'laugh'], [11.7, 4.9, 'photo'], [13.0, 5.2, 'talk'],
    [17.1, 1.6, 'bike'], [-17.1, -1.9, 'bike'], [1.8, 7.9, 'walk'],
    [25.8, 18.5, 'walk'], [28.5, 21.4, 'shop'], [25.7, 24.6, 'talk'], [29.2, 26.9, 'bike'],
    [25.9, 29.4, 'photo'], [29.4, 31.6, 'walk'], [33.2, 35.8, 'photo'], [37.2, 38.4, 'tourist'],
    [42.3, 38.6, 'tourist'], [46.4, 41.2, 'talk'], [34.2, 44.1, 'sit'], [47.7, 45.0, 'photo'],
    [39.2, 46.4, 'look'], [43.5, 46.0, 'look'], [31.4, 39.0, 'walk'], [50.1, 39.4, 'bike'],
    [-28.4, 55.7, 'photo'], [-24.8, 57.0, 'tourist'], [-30.2, 49.2, 'walk'], [-24.4, 44.4, 'shop'],
    [-29.4, 39.3, 'phone'], [-24.3, 34.7, 'walk'], [-29.8, 29.2, 'talk'], [-24.0, 24.6, 'bike'],
  ];
  const activePlacement = quality === 'low' ? placement.filter((_, index) => index % 2 === 0) : placement;
  activePlacement.forEach(([x, z, mode], index) => {
    const routes = [
      [new THREE.Vector3(-17, -0, -4.8), new THREE.Vector3(-3.4, 0, -4.9), new THREE.Vector3(5.8, 0, -4.2), new THREE.Vector3(18, 0, -3.8)],
      [new THREE.Vector3(-16, 0, 5.3), new THREE.Vector3(-4, 0, 6.5), new THREE.Vector3(7, 0, 5.6), new THREE.Vector3(17, 0, 5.8)],
      [new THREE.Vector3(24.8, 0, 17), new THREE.Vector3(27.5, 0, 24), new THREE.Vector3(27.3, 0, 31), new THREE.Vector3(36, 0, 38)],
      [new THREE.Vector3(-27, 0, 55), new THREE.Vector3(-27, 0, 44), new THREE.Vector3(-27, 0, 33), new THREE.Vector3(-23, 0, 19)],
    ];
    const citizen = createCitizen(index, {
      mode,
      home: new THREE.Vector3(x, 0, z),
      route: routes[index % routes.length],
      phone: mode === 'phone' || mode === 'photo' || mode === 'tourist',
      drink: mode === 'drink' || mode === 'sit' || mode === 'shop',
      guitar: mode === 'music',
      bike: mode === 'bike',
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
  scene.add(new THREE.HemisphereLight(0xffe4b8, 0x51695c, 2.5));
  scene.add(new THREE.AmbientLight(0xffd9ad, .72));
  const sun = new THREE.DirectionalLight(0xffb969, 4.15);
  sun.position.set(-28, 30, 14);
  sun.castShadow = true;
  const shadowSize = quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -31;
  sun.shadow.camera.right = 58;
  sun.shadow.camera.top = 58;
  sun.shadow.camera.bottom = -30;
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
        if (mode === 'listen' || mode === 'feed' || mode === 'talk' || mode === 'laugh') citizen.rotation.y = Math.sin(time * .44 + phase) * .35 + .3;
        if (mode === 'laugh') citizen.position.y += Math.max(0, Math.sin(time * 3.4 + phase)) * .035;
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
    citizens,
    visitorCount: citizens.length,
    update,
    clampPosition(position) {
      position.x = THREE.MathUtils.clamp(position.x, -38, 52);
      position.z = THREE.MathUtils.clamp(position.z, -11.8, 73);
      return position;
    },
    getLocation(position) {
      if (position.x < -18 && position.z > 53.5) return { name: 'Porta Nigra', zone: 'porta' };
      if (position.x < -18 && position.z > 17) return { name: 'Simeonstraße', zone: 'simeonstrasse' };
      if (position.z > 34 || (position.x > 32 && position.z > 31)) return { name: 'Domfreihof', zone: 'domfreihof' };
      if (position.x > 20 && position.z > 13) return { name: 'Sternstraße', zone: 'sternstrasse' };
      return { name: 'Hauptmarkt', zone: 'hauptmarkt' };
    },
  };
}
