import * as THREE from 'three';
import { CHARACTERS, LOCATIONS, getLocationAt } from '../data/story.js';

const COLORS = {
  sandstone: 0xc99d70,
  paleStone: 0xe0c5a1,
  roof: 0x283039,
  road: 0x7b766d,
  bronze: 0xa87a37,
  leaf: 0x47613e,
  leafDark: 0x304631,
  lamp: 0xffc467,
  water: 0x4b8493,
  green: 0x556d45,
  pink: 0xb15e66,
};

function standard(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.03, ...extra });
}

function addBox(parent, { x = 0, y = 0, z = 0, w = 1, h = 1, d = 1, color, ...options }) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), standard(color, options));
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, { x = 0, y = 0, z = 0, rTop = 0.5, rBottom = rTop, h = 1, sides = 10, color, ...options }) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, sides), standard(color, options));
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeLabel(text, accent = '#e7c37c') {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 640;
  canvas.height = 144;
  context.fillStyle = 'rgba(12, 19, 17, .88)';
  context.roundRect(8, 8, 624, 128, 24);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.roundRect(8, 8, 624, 128, 24);
  context.stroke();
  context.font = '600 58px Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f6dfae';
  context.fillText(text, 320, 76);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.5, 1.02, 1);
  return sprite;
}

function addTree(parent, x, z, scale = 1, flowerColor = null) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  addCylinder(tree, { rTop: 0.13 * scale, rBottom: 0.2 * scale, h: 1.45 * scale, color: 0x60452c, sides: 7 });
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82 * scale, 1), standard(flowerColor || COLORS.leaf));
  crown.position.y = 1.72 * scale;
  crown.castShadow = true;
  tree.add(crown);
  if (flowerColor) {
    const blossoms = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * scale, 1), standard(flowerColor));
    blossoms.position.set(0.35 * scale, 1.82 * scale, 0.12 * scale);
    tree.add(blossoms);
  }
  parent.add(tree);
  return tree;
}

function addLamp(parent, x, z) {
  const lamp = new THREE.Group();
  lamp.position.set(x, 0, z);
  addCylinder(lamp, { rTop: 0.055, rBottom: 0.09, h: 2.7, color: 0x263035, sides: 8, metalness: 0.25 });
  const top = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), standard(COLORS.lamp, { emissive: 0x8f5520, emissiveIntensity: 1.4 }));
  top.position.y = 2.75;
  lamp.add(top);
  const light = new THREE.PointLight(0xffb25e, 1.25, 7, 2.2);
  light.position.y = 2.65;
  lamp.add(light);
  parent.add(lamp);
  return { lamp, light };
}

function addBuilding(parent, { x, z, w, h, d, facade = COLORS.sandstone, roof = COLORS.roof, sign = null, tall = false }) {
  const building = new THREE.Group();
  building.position.set(x, 0, z);
  addBox(building, { w, h, d, color: facade });
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, tall ? 1.65 : 1.05, 4), standard(roof));
  roofMesh.rotation.y = Math.PI / 4;
  roofMesh.position.y = h + (tall ? 0.68 : 0.42);
  roofMesh.castShadow = true;
  building.add(roofMesh);
  for (let i = 0; i < Math.max(1, Math.floor(w / 0.8)); i += 1) {
    const window = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.38), standard(0xf6c66f, { emissive: 0x9c4c16, emissiveIntensity: 0.75 }));
    window.position.set(-w / 2 + 0.4 + i * 0.72, h * 0.58, z > 0 ? -d / 2 - 0.012 : d / 2 + 0.012);
    window.rotation.y = z > 0 ? Math.PI : 0;
    building.add(window);
  }
  if (sign) {
    const label = makeLabel(sign, '#d6a24e');
    label.position.set(0, h * 0.72, z > 0 ? -d / 2 - 0.04 : d / 2 + 0.04);
    label.scale.set(2.3, 0.52, 1);
    building.add(label);
  }
  parent.add(building);
  return building;
}

function addCafe(parent, x, z, title = 'VIEZ') {
  addBuilding(parent, { x, z, w: 3.7, h: 2.35, d: 1.9, facade: 0x8c6044, sign: title });
  for (const offset of [-1, 0, 1]) {
    addCylinder(parent, { x: x + offset, z: z > 0 ? z - 1.55 : z + 1.55, rTop: 0.26, rBottom: 0.28, h: 0.58, color: 0x4a3020, sides: 10 });
    addCylinder(parent, { x: x + offset, z: z > 0 ? z - 1.55 : z + 1.55, rTop: 0.48, rBottom: 0.48, h: 0.05, y: 0.58, color: COLORS.bronze, sides: 10 });
  }
}

function addFountain(parent, x, z) {
  const fountain = new THREE.Group();
  fountain.position.set(x, 0, z);
  addCylinder(fountain, { rTop: 1.26, rBottom: 1.38, h: 0.22, color: 0xd8c9ad, sides: 18 });
  addCylinder(fountain, { rTop: 1.04, rBottom: 1.04, h: 0.12, y: 0.14, color: COLORS.water, sides: 18, roughness: 0.3, metalness: 0.18 });
  addCylinder(fountain, { rTop: 0.21, rBottom: 0.28, h: 1.25, y: 0.24, color: 0xd3c2a2, sides: 10 });
  const topper = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), standard(COLORS.bronze, { metalness: 0.45 }));
  topper.position.y = 1.62;
  fountain.add(topper);
  parent.add(fountain);
}

function addMusician(parent, x, z) {
  const musician = makePerson({ name: 'Straßenmusik', outfit: '#815c45', hair: '#1f1714' });
  musician.position.set(x, 0, z);
  const guitar = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), standard(0xb87836));
  guitar.scale.set(0.72, 1.2, 0.3);
  guitar.position.set(0.25, 1.0, 0.18);
  musician.add(guitar);
  parent.add(musician);
  return musician;
}

export function makePerson({ name = 'Passant', outfit = '#536f3d', hair = '#2b1d17', scale = 1 }) {
  const person = new THREE.Group();
  person.name = name;
  addCylinder(person, { x: -0.15 * scale, rTop: 0.1 * scale, rBottom: 0.12 * scale, h: 0.7 * scale, color: 0x2b3540, sides: 6 });
  addCylinder(person, { x: 0.15 * scale, rTop: 0.1 * scale, rBottom: 0.12 * scale, h: 0.7 * scale, color: 0x2b3540, sides: 6 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28 * scale, 0.48 * scale, 5, 8), standard(outfit));
  torso.position.y = 1.08 * scale;
  torso.castShadow = true;
  person.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 12, 10), standard(0xe4aa76));
  head.position.y = 1.58 * scale;
  head.castShadow = true;
  person.add(head);
  const hairstyle = new THREE.Mesh(new THREE.SphereGeometry(0.26 * scale, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), standard(hair));
  hairstyle.position.y = 1.72 * scale;
  person.add(hairstyle);
  person.userData.baseY = 0;
  return person;
}

function addPigeons(parent, x, z) {
  for (let i = 0; i < 6; i += 1) {
    const bird = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), standard(0x526068));
    bird.position.set(x + (i % 3) * 0.32, 0.1, z + Math.floor(i / 3) * 0.28);
    bird.userData.phase = i;
    parent.add(bird);
  }
}

function makeMarker() {
  const marker = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 8, 20), new THREE.MeshBasicMaterial({ color: 0xffd66b }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  marker.add(ring);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.65, 5, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd66b, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  beam.position.y = 0.62;
  marker.add(beam);
  marker.visible = false;
  return marker;
}

export function createWorld(scene) {
  const root = new THREE.Group();
  root.name = 'Stilisierte Trierer Altstadt';
  scene.add(root);
  const moving = [];
  const lamps = [];
  const npcs = new Map();
  let companions = [];
  const optionalPoints = [
    { id: 'street-music', x: 7.1, z: -2.6, label: 'Straßenmusik zuhören' },
    { id: 'sign', x: -15.4, z: -3.5, label: 'Stadtplan anschauen' },
  ];

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(58, 18), standard(0x6c7664));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(2.5, -0.015, 0);
  ground.receiveShadow = true;
  root.add(ground);

  for (const [start, end, color] of [[-20, -5, 0x918873], [-5, 4.5, 0xb5a889], [4.5, 11, 0x796f64], [11, 18, 0xb6aa94], [18, 25, 0x4d504c]]) {
    addBox(root, { x: (start + end) / 2, z: 0, w: end - start - 0.15, h: 0.035, d: 8.3, color });
  }

  // Hauptmarkt
  addCafe(root, -16.8, 5.55, 'VIEZ & WEIN');
  addBuilding(root, { x: -10.5, z: 5.6, w: 3.2, h: 3.1, d: 2.2, facade: 0xd6b080, roof: 0x3f4a53, tall: true });
  addBuilding(root, { x: -18.5, z: -5.6, w: 3.3, h: 2.5, d: 2.2, facade: 0xb58361 });
  addBuilding(root, { x: -12, z: -5.6, w: 4.2, h: 2.7, d: 2.1, facade: 0xd8c19b, sign: 'BROTSTRASSE' });
  addFountain(root, -14.3, 0.8);
  addTree(root, -17.8, -2.5, 1.0, COLORS.pink);
  addTree(root, -9.5, 2.8, 0.9);
  addPigeons(root, -15.5, -1.8);
  const marketLabel = makeLabel('HAUPTMARKT');
  marketLabel.position.set(-14, 4.2, 0);
  root.add(marketLabel);

  // Domfreihof
  addBuilding(root, { x: -0.7, z: 5.25, w: 5.8, h: 5.5, d: 2.7, facade: 0xcda16d, roof: 0x33404a, tall: true });
  addBuilding(root, { x: 2.4, z: 4.6, w: 1.1, h: 8.8, d: 1.1, facade: 0xd0a675, roof: 0x303943, tall: true });
  addBuilding(root, { x: -4, z: -5.4, w: 3.6, h: 2.6, d: 2.3, facade: 0xd4b98f });
  addTree(root, -1.2, -2.9, 0.9);
  addTree(root, 2.2, -2.6, 0.75);
  const domLabel = makeLabel('DOMFREIHOF');
  domLabel.position.set(-0.4, 4.15, -0.1);
  root.add(domLabel);

  // Liebfrauenstraße
  addCafe(root, 6.8, 5.55, 'CAFÉ');
  addBuilding(root, { x: 10.2, z: 5.6, w: 2.8, h: 3.1, d: 2.1, facade: 0xbf8e6b });
  addBuilding(root, { x: 6.2, z: -5.55, w: 3.4, h: 2.8, d: 2, facade: 0xc6b48f, sign: 'KLEINE GASSE' });
  addBuilding(root, { x: 10.3, z: -5.5, w: 2.6, h: 2.4, d: 2.1, facade: 0x9d7458 });
  addTree(root, 5.6, 2.8, 0.8, COLORS.pink);
  addTree(root, 9.3, -2.8, 0.7);
  const streetLabel = makeLabel('LIEBFRAUENSTRASSE');
  streetLabel.position.set(7.9, 3.9, 0);
  streetLabel.scale.set(4.3, 0.97, 1);
  root.add(streetLabel);

  // Kornmarkt
  addBuilding(root, { x: 13.1, z: 5.5, w: 3.7, h: 3.1, d: 2.1, facade: 0xc5a17a, sign: 'KORNMARKT' });
  addBuilding(root, { x: 17.1, z: 5.5, w: 2.5, h: 2.55, d: 2.2, facade: 0x71818a });
  addCafe(root, 16.3, -5.55, 'ABEND');
  addBuilding(root, { x: 12.4, z: -5.5, w: 2.4, h: 2.7, d: 2.1, facade: 0xe0c6a2 });
  addFountain(root, 15.2, 0.15);
  addTree(root, 12.7, -2.5, 0.8);
  addTree(root, 17.7, 2.5, 0.8);
  const kornLabel = makeLabel('KORNMARKT');
  kornLabel.position.set(15, 4.15, 0);
  root.add(kornLabel);

  // Seitengasse und Ende
  addBuilding(root, { x: 20.5, z: 4.9, w: 4.1, h: 3.8, d: 2.4, facade: 0x745e52, roof: 0x222932, tall: true });
  addBuilding(root, { x: 23.8, z: -4.9, w: 3.1, h: 3.1, d: 2.2, facade: 0x5d534d, roof: 0x20272d });
  addBuilding(root, { x: 19, z: -4.85, w: 1.6, h: 2.6, d: 1.9, facade: 0x8b715b });
  const alleyLabel = makeLabel('SEITENGASSE', '#e0aa54');
  alleyLabel.position.set(21.5, 4.1, 0);
  alleyLabel.scale.set(3.7, 0.83, 1);
  root.add(alleyLabel);

  for (const position of [[-18.5, 2.8], [-10, -2.9], [-4, 2.8], [3.2, -2.9], [5.1, 2.8], [11, -2.9], [12.1, 2.8], [18.1, -2.9], [19.1, 2.7], [23.5, -2.7]]) {
    lamps.push(addLamp(root, position[0], position[1]));
  }

  addMusician(root, 7.1, -2.6);
  for (let i = 0; i < 13; i += 1) {
    const passerby = makePerson({
      outfit: [COLORS.green, 0x455b70, 0x8c6044, 0x9b634c][i % 4],
      hair: [0x2b1e18, 0x7b5636, 0x32251d][i % 3],
      scale: 0.78 + (i % 3) * 0.06,
    });
    passerby.position.set(-17 + ((i * 4.37) % 36), 0, -2.1 + ((i * 1.91) % 4.2));
    passerby.userData.walkOffset = i * 0.87;
    moving.push(passerby);
    root.add(passerby);
  }

  const npcPositions = {
    johannes: [-12, 0.8],
    marc: [-0.8, 0.9],
    charly: [7.8, -0.6],
    weber: [14.6, 0.8],
  };
  Object.entries(npcPositions).forEach(([id, [x, z]]) => {
    const spec = CHARACTERS[id];
    const person = makePerson({ name: spec.name, outfit: spec.color, hair: spec.hair, scale: 1.05 });
    person.position.set(x, 0, z);
    person.userData.npcId = id;
    const label = makeLabel(spec.name, '#f2c86f');
    label.position.y = 2.55;
    label.scale.set(1.65, 0.37, 1);
    person.add(label);
    root.add(person);
    npcs.set(id, person);
  });

  const marker = makeMarker();
  root.add(marker);
  const goldenGlow = new THREE.PointLight(0xffbd4f, 0, 9, 2);
  goldenGlow.position.set(21.6, 1.2, 0);
  root.add(goldenGlow);

  const duskColor = new THREE.Color(0x1a2635);
  const dayColor = new THREE.Color(0x9a7c57);
  const hemi = new THREE.HemisphereLight(0xffd8a2, 0x31483d, 2.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffbf75, 3.1);
  sun.position.set(-18, 21, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  scene.add(sun);

  function setActiveTarget(stage) {
    marker.visible = Boolean(stage);
    if (!stage) {
      goldenGlow.intensity = 0;
      return;
    }
    marker.position.set(stage.marker[0], 0, stage.marker[1]);
    goldenGlow.intensity = stage.id === 'light' ? 4.5 : 0;
  }

  function updateAtmosphere(step) {
    const amount = Math.min(step / 4, 1);
    scene.background = dayColor.clone().lerp(duskColor, amount);
    scene.fog.color.copy(scene.background);
    scene.fog.near = 26 - amount * 2;
    scene.fog.far = 58 - amount * 7;
    hemi.intensity = 2.1 - amount * 0.55;
    sun.intensity = 3.1 - amount * 1.4;
    lamps.forEach(({ light }) => { light.intensity = 0.72 + amount * 0.9; });
  }

  function update(time, playerPosition) {
    marker.rotation.y += 0.028;
    marker.position.y = Math.sin(time * 2.1) * 0.07;
    moving.forEach((person) => {
      const phase = time + person.userData.walkOffset;
      person.position.z += Math.sin(phase * 0.45) * 0.0015;
      person.rotation.y = Math.sin(phase * 0.21) * 0.18;
      person.position.y = Math.abs(Math.sin(phase * 2.1)) * 0.015;
    });
    npcs.forEach((npc, id) => {
      const companionIndex = companions.indexOf(id);
      if (companionIndex >= 0 && playerPosition) {
        const row = Math.floor(companionIndex / 2);
        const side = companionIndex % 2 === 0 ? -1 : 1;
        const goal = new THREE.Vector3(
          playerPosition.x - 0.85 - row * 0.55,
          0,
          playerPosition.z + side * (0.78 + row * 0.2),
        );
        npc.position.lerp(goal, 0.035);
        npc.lookAt(playerPosition.x, 0, playerPosition.z);
      }
      npc.position.y = Math.sin(time * 1.7 + id.length) * 0.018;
    });
    goldenGlow.intensity = goldenGlow.intensity > 0 ? 3.8 + Math.sin(time * 4) * 0.65 : 0;
  }

  return {
    root,
    marker,
    npcs,
    optionalPoints,
    setActiveTarget,
    setCompanions(ids) { companions = [...ids]; },
    updateAtmosphere,
    update,
    clampPosition(position) {
      position.x = THREE.MathUtils.clamp(position.x, -19.2, 24.2);
      position.z = THREE.MathUtils.clamp(position.z, -3.8, 3.8);
      return position;
    },
    getLocation(position) { return getLocationAt(position.x); },
  };
}
