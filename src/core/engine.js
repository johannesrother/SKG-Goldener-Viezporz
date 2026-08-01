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
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: this.qualityProfile !== 'low', powerPreference: 'high-performance' });
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
    // The detailed Hauptmarkt matte is the visual level layer. The runtime world
    // keeps its navigation and actors independent, so it remains expandable.
    this.world.root.visible = false;
    this.scene.background = null;
    this.scene.fog = null;
    // A light real-time foreground layer keeps the square alive without covering
    // the detailed, optimised backdrop with a second full population pass.
    const foregroundVisitors = [
      [-3.1, 6.8, 'talk'], [-1.2, 4.0, 'drink'], [2.0, 7.7, 'photo'],
      [6.9, 2.1, 'talk'], [9.6, 3.8, 'phone'], [0.1, 5.0, 'music'],
    ];
    this.world.citizens.slice(0, foregroundVisitors.length).forEach((citizen, index) => {
      const [x, z, mode] = foregroundVisitors[index];
      citizen.position.set(x, 0, z);
      citizen.userData.home.set(x, 0, z);
      citizen.userData.mode = mode;
      citizen.scale.setScalar(.56);
      this.scene.add(citizen);
    });
    this.player = makePerson({ name: profile.name, outfit: OUTFITS[profile.outfit] || OUTFITS.wald, scale: 1.08 });
    this.player.scale.setScalar(.7);
    // This maps to the clear south-east side of the Petrusbrunnen in the fixed
    // isometric level composition rather than onto the façade backdrop.
    this.player.position.set(4.2, 0, 4.4);
    const playerMarker = new THREE.Mesh(
      new THREE.RingGeometry(.29, .39, 28),
      new THREE.MeshBasicMaterial({ color: 0xffd26c, transparent: true, opacity: .9, side: THREE.DoubleSide }),
    );
    playerMarker.rotation.x = -Math.PI / 2;
    playerMarker.position.y = .035;
    this.player.add(playerMarker);
    this.scene.add(this.player);
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
    // The painted market is a deliberately fixed isometric composition; movement
    // therefore reads clearly against it without shifting the landmark framing.
    const desired = new THREE.Vector3(13.5, 21.5, 16);
    this.camera.position.lerp(desired, 1 - Math.exp(-delta * 2.35));
    this.camera.lookAt(0, 0, 0);
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
