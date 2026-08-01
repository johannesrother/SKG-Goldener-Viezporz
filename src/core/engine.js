import * as THREE from 'three';
import { createWorld, makePerson } from '../world/world.js';

const OUTFITS = { wald: '#506b42', blau: '#3b5874', kupfer: '#9b623d' };
const HAIR = { dunkel: '#281b17', braun: '#704529', hell: '#b27a38' };

export class GameEngine {
  constructor(canvas, profile, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9a7c57);
    this.scene.fog = new THREE.Fog(0x9a7c57, 26, 58);
    this.camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100);
    this.camera.position.set(15, 21, 18);
    this.qualityProfile = this.chooseQualityProfile();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.qualityProfile !== 'low', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = this.qualityProfile !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.choosePixelRatio()));
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.walkPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.destination = null;
    this.keys = new Set();
    this.joystick = new THREE.Vector2();
    this.running = true;
    this.inputEnabled = true;
    this.profile = profile;
    this.world = createWorld(this.scene);
    this.player = this.createPlayer(profile);
    this.player.position.set(-16.5, 0, -0.3);
    this.world.root.add(this.player);
    this.playerPosition = this.player.position;
    this.resize();
    this.bindInput();
    this.animate();
  }

  choosePixelRatio() {
    return this.qualityProfile === 'low' ? 1 : this.qualityProfile === 'high' ? 1.75 : 1.35;
  }

  chooseQualityProfile() {
    const low = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || window.innerWidth < 540;
    if (low) return 'low';
    return window.devicePixelRatio > 1.5 && navigator.hardwareConcurrency >= 8 ? 'high' : 'medium';
  }

  createPlayer(profile) {
    const person = makePerson({
      name: profile.name,
      outfit: OUTFITS[profile.outfit] || OUTFITS.wald,
      hair: HAIR[profile.hair] || HAIR.dunkel,
      scale: 1.12,
    });
    person.name = 'Spieler';
    const porz = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.24, 10),
      new THREE.MeshStandardMaterial({ color: 0xf3eee1, roughness: 0.4 }),
    );
    porz.position.set(-0.37, 0.94, 0.05);
    porz.rotation.z = 0.16;
    person.add(porz);
    const porzHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.018, 6, 10, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xf3eee1, roughness: 0.4 }),
    );
    porzHandle.position.set(-0.46, 0.97, 0.05);
    porzHandle.rotation.y = Math.PI / 2;
    person.add(porzHandle);
    return person;
  }

  setProfile(profile) {
    this.profile = profile;
  }

  setPosition(position) {
    this.player.position.set(position.x, 0, position.z);
  }

  getPosition() {
    return { x: this.player.position.x, z: this.player.position.z };
  }

  setDestination(x, z) {
    if (!this.inputEnabled) return;
    this.destination = this.world.clampPosition(new THREE.Vector3(x, 0, z));
  }

  setJoystick(x, y) {
    this.joystick.set(x, y);
    if (this.joystick.lengthSq() > 0.015) this.destination = null;
  }

  setInputEnabled(enabled) {
    this.inputEnabled = enabled;
    if (!enabled) {
      this.keys.clear();
      this.joystick.set(0, 0);
    }
  }

  near(point, distance = 1.65) {
    return this.player.position.distanceToSquared(new THREE.Vector3(point[0], 0, point[1])) <= distance * distance;
  }

  bindInput() {
    this.onResize = () => this.resize();
    this.onKeyDown = (event) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        this.keys.add(event.code);
        this.destination = null;
        event.preventDefault();
      }
      if (event.code === 'KeyE') this.callbacks.onInteract?.();
      if (event.code === 'KeyI') this.callbacks.onPanel?.('inventory');
      if (event.code === 'KeyM') this.callbacks.onPanel?.('memories');
      if (event.code === 'Escape') this.callbacks.onPanel?.(null);
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onPointerDown = (event) => {
      if (!this.inputEnabled || event.button > 0) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.walkPlane, hit)) this.setDestination(hit.x, hit.z);
    };
    this.onWheel = (event) => {
      if (event.deltaY === 0) return;
      this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom - event.deltaY * 0.00065, 0.78, 1.3);
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: true });
  }

  resize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const viewHeight = width < 620 ? 11.6 : 12.8;
    this.camera.left = (-viewHeight * aspect) / 2;
    this.camera.right = (viewHeight * aspect) / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  readKeyboardVector() {
    const vector = new THREE.Vector2();
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) vector.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) vector.x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) vector.y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) vector.y += 1;
    return vector;
  }

  updatePlayer(delta) {
    if (!this.inputEnabled) return;
    const keyboard = this.readKeyboardVector();
    const manual = keyboard.lengthSq() > 0 ? keyboard : this.joystick;
    let movement = new THREE.Vector3();
    if (manual.lengthSq() > 0.005) {
      movement.set(manual.x, 0, manual.y).normalize().multiplyScalar(4.2 * delta);
    } else if (this.destination) {
      const distance = this.destination.clone().sub(this.player.position);
      distance.y = 0;
      if (distance.length() < 0.1) {
        this.destination = null;
      } else {
        movement = distance.normalize().multiplyScalar(Math.min(4.2 * delta, distance.length()));
      }
    }
    if (movement.lengthSq() > 0) {
      this.player.position.add(movement);
      this.world.clampPosition(this.player.position);
      this.player.rotation.y = Math.atan2(movement.x, movement.z);
      this.callbacks.onMove?.(this.getPosition());
    }
  }

  updateCamera(delta) {
    const desired = new THREE.Vector3(this.player.position.x + 14, 19.5, this.player.position.z + 16);
    this.camera.position.lerp(desired, 1 - Math.exp(-delta * 3.4));
    this.camera.lookAt(this.player.position.x + 0.6, 0, this.player.position.z);
  }

  animate() {
    if (!this.running) return;
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    this.updatePlayer(delta);
    this.updateCamera(delta);
    this.player.position.y = Math.abs(Math.sin(time * 6)) * (this.destination || this.joystick.lengthSq() > 0 ? 0.025 : 0);
    this.world.update(time, this.player.position);
    this.callbacks.onFrame?.();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.running = false;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.renderer.dispose();
  }
}
