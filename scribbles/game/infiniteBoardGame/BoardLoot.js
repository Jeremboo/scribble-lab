import {
  BoxBufferGeometry,
  CylinderBufferGeometry,
  MeshToonMaterial,
  DataTexture,
  RGBFormat,
  NearestFilter,
} from 'three';
import gsap from 'gsap';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';

function createToonGradient() {
  const data = new Uint8Array([
    70, 70, 70,
    140, 140, 140,
    255, 255, 255,
  ]);
  const texture = new DataTexture(data, 3, 1, RGBFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

const toonGradient = createToonGradient();

function createGeometry(effect) {
  if (effect === 'pawn') {
    // Matches the pawn silhouette
    return new CylinderBufferGeometry(0.15, 0.15, 0.35, 12);
  }
  // Matches a path cell — small cube
  return new BoxBufferGeometry(0.3, 0.3, 0.3);
}

export default class BoardLoot {
  constructor(cell, { effect, color } = {}) {
    this.cell = cell;
    this.collected = false;
    this.effect = effect;
    this.color = color;

    this.mesh = new OutlinableMesh(
      createGeometry(this.effect),
      new MeshToonMaterial({ color: this.color, gradientMap: toonGradient }),
      1,
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.scale.setScalar(0);

    this.bobPhase = Math.random() * Math.PI * 2;
    this.targetedScale = 1;
    this.currentScale = 0;

    this.syncPosition();
    gsap.to(this, { currentScale: 1, duration: 0.4, ease: 'back.out(2)' });
  }

  syncPosition() {
    const { x, y, z } = this.cell.mesh.position;
    this.mesh.position.set(x, y + 3.1, z);
  }

  setElevation() {
    this.syncPosition();
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;
    this.targetedScale = 0;
    gsap.to(this.mesh.position, {
      y: this.mesh.position.y + 1.2,
      duration: 0.35,
      ease: 'power2.out',
    });
    gsap.to(this, {
      currentScale: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => this.dispose(),
    });
    return true;
  }

  update(time = 0) {
    if (this.collected && this.currentScale <= 0.01) return;

    this.syncPosition();
    this.mesh.position.y += Math.sin(time * 3 + this.bobPhase) * 0.12;
    this.mesh.rotation.y += 0.03;
    if (this.effect === 'path') {
      this.mesh.rotation.x = Math.PI * 0.2;
      this.mesh.rotation.z = Math.PI * 0.15;
    } else {
      this.mesh.rotation.x = 0;
      this.mesh.rotation.z = 0;
    }

    this.mesh.scale.setScalar(this.currentScale);
  }

  dispose() {
    if (!this.mesh) return;
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
    if (this.cell && this.cell.loot === this) {
      this.cell.loot = null;
    }
  }
}
