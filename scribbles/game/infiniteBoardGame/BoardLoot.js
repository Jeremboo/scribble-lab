import {
  BoxBufferGeometry,
  MeshLambertMaterial,
} from 'three';
import gsap from 'gsap';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';

/** Match DOM `.game-card` face / aspect (cardWidth / cardHeight ≈ 0.7). */
const CARD_FACE = '#fff8ee';
const CARD_WIDTH = 0.35;
const CARD_HEIGHT = 0.5;
const CARD_DEPTH = 0.04;

export default class BoardLoot {
  constructor(cell) {
    this.cell = cell;
    this.collected = false;

    // Lambert (not toon): continuous N·L so lighting eases as the card spins.
    // Emissive lifts the base so it stays cream-bright under ambient 0.5 lighting.
    this.mesh = new OutlinableMesh(
      new BoxBufferGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH),
      new MeshLambertMaterial({
        color: CARD_FACE,
        emissive: CARD_FACE,
        emissiveIntensity: 0.45,
      }),
      1,
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.scale.setScalar(0);

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
    this.mesh.position.y += Math.sin(time * 3) * 0.12;
    this.mesh.rotation.y += 0.025;
    this.mesh.rotation.x = Math.PI * 0.1;
    this.mesh.rotation.z = 0;

    this.mesh.scale.setScalar(this.currentScale);
  }

  dispose() {
    if (!this.mesh) return;
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh.disposeSurfaceIds();
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
    if (this.cell && this.cell.loot === this) {
      this.cell.loot = null;
    }
  }
}
