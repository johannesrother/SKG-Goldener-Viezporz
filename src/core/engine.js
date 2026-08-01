import * as THREE from 'three';
import { createWorld, makePerson } from '../world/world.js';

const OUTFITS = { wald: 0x506b42, blau: 0x3b5874, kupfer: 0x9b623d };

export class GameEngine {
  constructor(canvas, profile, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-10, 10, 7, -7, .1, 120);
    this.camera.position.set(15, 22, 17);
    this.qualityProfile = this.chooseQualityProfile();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.qualityProfile !== 'low', powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = this.qualityProfile !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.pixelRatio()));
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.walkPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.destination = null;
    this.cameraFocus = new THREE.Vector3(0, 0, 0);
    this.keys = new Set();
    this.joystick = new THREE.Vector2();
    this.running = true;
    this.profile = profile;
    this.world = createWorld(this.scene, this.qualityProfile);
    this.player = makePerson({ name: profile.name, outfit: OUTFITS[profile.outfit] || OUTFITS.wald, scale: 1.08 });
    this.player.position.set(-5.4, 0, -8.6);
    this.world.root.add(this.player);
    this.resize();
    this.bindInput();
    this.animate();
  }

  chooseQualityProfile() {
    if (window.innerWidth < 560 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)) return 'low';
    return window.devicePixelRatio > 1.5 && (navigator.hardwareConcurrency || 4) >= 8 ? 'high' : 'medium';
  }

  pixelRatio() {
    return this.qualityProfile === 'high' ? 1.65 : this.qualityProfile === 'medium' ? 1.35 : 1;
  }

  getPosition() {
    return { x: this.player.position.x, z: this.player.position.z };
  }

  setDestination(x, z) {
    this.destination = this.world.clampPosition(new THREE.Vector3(x, 0, z));
  }

  setJoystick(x, y) {
    this.joystick.set(x, y);
    if (this.joystick.lengthSq() > .015) this.destination = null;
  }

  bindInput() {
    this.onResize = () => this.resize();
    this.onKeyDown = (event) => {
      if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) return;
      this.keys.add(event.code);
      this.destination = null;
      event.preventDefault();
    };
    this.onKeyUp = (event) => this.keys.delete(event.code);
    this.onPointerDown = (event) => {
      if (event.button > 0) return;
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.walkPlane, hit)) this.setDestination(hit.x, hit.z);
    };
    this.onWheel = (event) => {
      this.camera.zoom = THREE.MathUtils.clamp(this.camera.zoom - event.deltaY * .00065, .76, 1.25);
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
    const viewHeight = width < 620 ? 18.8 : 24.2;
    this.camera.left = (-viewHeight * aspect) / 2;
    this.camera.right = (viewHeight * aspect) / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  keyboardVector() {
    const vector = new THREE.Vector2();
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) vector.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) vector.x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) vector.y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) vector.y += 1;
    return vector;
  }

  updatePlayer(delta, time) {
    const keyboard = this.keyboardVector();
    const input = keyboard.lengthSq() > 0 ? keyboard : this.joystick;
    let movement = new THREE.Vector3();
    if (input.lengthSq() > .005) {
      movement.set(input.x, 0, input.y).normalize().multiplyScalar(4.8 * delta);
    } else if (this.destination) {
      const distance = this.destination.clone().sub(this.player.position);
      distance.y = 0;
      if (distance.length() < .1) this.destination = null;
      else movement = distance.normalize().multiplyScalar(Math.min(4.8 * delta, distance.length()));
    }
    if (movement.lengthSq() > 0) {
      this.player.position.add(movement);
      this.world.clampPosition(this.player.position);
      this.player.rotation.y = Math.atan2(movement.x, movement.z);
      this.callbacks.onMove?.(this.getPosition());
      this.player.position.y = Math.abs(Math.sin(time * 8)) * .026;
    } else {
      this.player.position.y = Math.sin(time * 1.75) * .008;
    }
  }

  updateCamera(delta) {
    this.cameraFocus.set(
      THREE.MathUtils.lerp(this.player.position.x, 0, .25),
      0,
      THREE.MathUtils.lerp(this.player.position.z, 2.5, .25),
    );
    const desired = new THREE.Vector3(this.cameraFocus.x + 13.5, 21.5, this.cameraFocus.z + 16);
    this.camera.position.lerp(desired, 1 - Math.exp(-delta * 2.35));
    this.camera.lookAt(this.cameraFocus.x, 0, this.cameraFocus.z);
  }

  animate() {
    if (!this.running) return;
    requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), .05);
    const time = this.clock.elapsedTime;
    this.updatePlayer(delta, time);
    this.updateCamera(delta);
    this.world.update(time, this.player.position);
    this.callbacks.onFrame?.({ time, position: this.getPosition(), visitorCount: this.world.visitorCount });
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
