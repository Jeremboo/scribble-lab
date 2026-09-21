import {
  BoxBufferGeometry,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneBufferGeometry,
} from 'three';
import gsap from 'gsap';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import props from './props';

/** Match DOM `.game-card` face / aspect (cardWidth / cardHeight ≈ 0.7). */
const CARD_FACE = '#fff8ee';
const RESCUE_FACE = '#E04E3A';
const EXTRA_FACE = '#6E9488';
const CARD_WIDTH = 0.35;
const CARD_HEIGHT = 0.5;
const CARD_DEPTH = 0.04;

// Shared across default loot — never disposed so three@0.116 keeps the compiled
// MeshLambert program alive (same fix as Icon materialCache).
const LOOT_GEOMETRY = new BoxBufferGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH);
const LOOT_MATERIAL = new MeshLambertMaterial({
  color: CARD_FACE,
  emissive: CARD_FACE,
  emissiveIntensity: 0.45,
});

const LABEL_GEOMETRY = new PlaneBufferGeometry(CARD_WIDTH * 0.85, CARD_HEIGHT * 0.55);

/** @type {Map<string, import('three').CanvasTexture>} */
const labelTextureCache = new Map();

function getLabelTexture(value) {
  const key = String(value);
  let texture = labelTextureCache.get(key);
  if (texture) return texture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(key.startsWith('+') ? key : `+${key}`, size / 2, size / 2 + 4);

  texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  labelTextureCache.set(key, texture);
  return texture;
}

function faceColorFor(meta, debugLoot) {
  if (!debugLoot) return CARD_FACE;
  if (meta.isRescue) return RESCUE_FACE;
  return EXTRA_FACE;
}

export default class BoardLoot {
  /**
   * @param {import('./BoardCell').default} cell
   * @param {{ isRescue?: boolean, rewardValue?: number }} [meta]
   */
  constructor(cell, meta = {}) {
    this.cell = cell;
    this.collected = false;
    this.isRescue = !!meta.isRescue;
    this.rewardValue = meta.rewardValue != null ? meta.rewardValue | 0 : null;

    const debugLoot = !!props.debugLoot;
    const faceColor = faceColorFor(meta, debugLoot);
    const needsOwnMaterial = debugLoot;

    this._ownsMaterial = needsOwnMaterial;
    this.material = needsOwnMaterial
      ? new MeshLambertMaterial({
          color: faceColor,
          emissive: faceColor,
          emissiveIntensity: 0.45,
        })
      : LOOT_MATERIAL;

    // Lambert (not toon): continuous N·L so lighting eases as the card spins.
    // Emissive lifts the base so it stays cream-bright under ambient 0.5 lighting.
    this.mesh = new OutlinableMesh(
      LOOT_GEOMETRY,
      this.material,
      1,
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.scale.setScalar(0);

    this.labelMeshes = [];
    if (debugLoot && this.rewardValue != null) {
      const labelMat = new MeshBasicMaterial({
        map: getLabelTexture(this.rewardValue),
        transparent: true,
        depthWrite: false,
      });
      const z = CARD_DEPTH / 2 + 0.002;
      const front = new Mesh(LABEL_GEOMETRY, labelMat);
      front.position.set(0, 0, z);
      const back = new Mesh(LABEL_GEOMETRY, labelMat);
      back.position.set(0, 0, -z);
      back.rotation.y = Math.PI;
      this.mesh.add(front);
      this.mesh.add(back);
      this.labelMeshes.push(front, back);
    }

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
    if (this.labelMeshes && this.labelMeshes.length) {
      let disposedMat = false;
      for (const label of this.labelMeshes) {
        this.mesh.remove(label);
        if (!disposedMat && label.material) {
          // Texture is cached — do not dispose. Shared mat across both faces.
          label.material.dispose();
          disposedMat = true;
        }
      }
      this.labelMeshes = [];
    }
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.mesh.disposeSurfaceIds();
    if (this._ownsMaterial && this.material) {
      this.material.dispose();
    }
    // Geometry is shared — do not dispose.
    this.mesh = null;
    this.material = null;
    if (this.cell && this.cell.loot === this) {
      this.cell.loot = null;
    }
  }
}
