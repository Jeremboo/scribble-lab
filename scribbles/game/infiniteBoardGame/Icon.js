import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry,
} from 'three';
import gsap from 'gsap';

/** @type {Map<string, import('three').MeshBasicMaterial>} */
const materialCache = new Map();
/** @type {Map<number, import('three').PlaneBufferGeometry>} */
const geometryCache = new Map();

/**
 * Shared MeshBasicMaterials — never disposed so three@0.116 keeps the
 * compiled WebGL program alive across board advances.
 */
function getSharedMaterial(texture, color) {
  const key = `${texture.uuid}|${String(color)}`;
  let material = materialCache.get(key);
  if (!material) {
    material = new MeshBasicMaterial({
      map: texture,
      color,
      transparent: true,
      depthWrite: false,
      // 0 so opacity fades work without a second ALPHATEST shader variant
      alphaTest: 0,
    });
    materialCache.set(key, material);
  }
  return material;
}

function getSharedGeometry(size) {
  let geometry = geometryCache.get(size);
  if (!geometry) {
    geometry = new PlaneBufferGeometry(size, size);
    geometryCache.set(size, geometry);
  }
  return geometry;
}

/**
 * Flat textured plane. Use a white (or grayscale) map — tint via material color.
 */
export default class Icon {
  /**
   * @param {Object} opts
   * @param {import('three').Texture} opts.texture
   * @param {import('three').ColorRepresentation} [opts.color='#ffffff']
   * @param {number} [opts.size=0.55]
   */
  constructor({ texture, color = '#ffffff', size = 0.55 } = {}) {
    if (!texture) {
      throw new Error('Icon requires a texture');
    }

    this._color = color;
    this._ownsMaterial = false;
    this.material = getSharedMaterial(texture, color);
    this.mesh = new Mesh(getSharedGeometry(size), this.material);
    // Lie flat on XZ (cell top surface), chevron facing path forward (-Z after flip)
    this.mesh.rotation.x = -Math.PI * 0.5;
    this.mesh.rotation.z = Math.PI;
    this.mesh.renderOrder = 2;
    this._fading = false;
  }

  /** @param {import('three').ColorRepresentation} color */
  setColor(color) {
    if (!this.material || this._fading) return;
    this._color = color;
    if (this._ownsMaterial) {
      this.material.color.set(color);
      return;
    }
    const map = this.material.map;
    this.material = getSharedMaterial(map, color);
    this.mesh.material = this.material;
  }

  /**
   * Parent to a cell mesh so the icon follows enter/exit elevation tweens.
   * @param {{ mesh: import('three').Object3D }} cell
   * @param {{ y?: number, lift?: number }} [opts] - local Y of the cell top face
   */
  attachToCell(cell, { y = 0.5, lift = 0.02 } = {}) {
    this.mesh.position.set(0, y + lift, 0);
    cell.mesh.add(this.mesh);
  }

  /**
   * Fade opacity to 0, then dispose mesh resources (shared material stays alive).
   * @param {number} [duration=0.8]
   * @param {() => void} [onComplete]
   */
  fadeOut(duration = 0.8, onComplete) {
    if (!this.material || this._fading) return;
    this._fading = true;

    // Per-icon opacity needs a clone; shared material must stay untouched.
    if (!this._ownsMaterial) {
      this.material = this.material.clone();
      this._ownsMaterial = true;
      this.mesh.material = this.material;
    }

    gsap.killTweensOf(this.material);
    gsap.to(this.material, {
      opacity: 0,
      duration,
      ease: 'power2.in',
      onComplete: () => {
        this.dispose();
        if (onComplete) onComplete();
      },
    });
  }

  dispose({ disposeTexture = false } = {}) {
    if (!this.mesh) return;
    if (this.material) {
      gsap.killTweensOf(this.material);
    }
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    // Geometry is shared — do not dispose.
    if (this._ownsMaterial && this.material) {
      if (disposeTexture && this.material.map) {
        this.material.map.dispose();
      }
      this.material.dispose();
    }
    this.mesh = null;
    this.material = null;
  }
}

/** Shared white chevron (forward) for section-advance markers. */
let advanceChevronTexture = null;

export function getAdvanceChevronTexture() {
  if (advanceChevronTexture) return advanceChevronTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  // Chevron pointing "up" in UV → +Z on the board after plane rotation
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.18);
  ctx.lineTo(size * 0.82, size * 0.52);
  ctx.lineTo(size * 0.64, size * 0.52);
  ctx.lineTo(size * 0.64, size * 0.82);
  ctx.lineTo(size * 0.36, size * 0.82);
  ctx.lineTo(size * 0.36, size * 0.52);
  ctx.lineTo(size * 0.18, size * 0.52);
  ctx.closePath();
  ctx.fill();

  advanceChevronTexture = new CanvasTexture(canvas);
  advanceChevronTexture.needsUpdate = true;
  return advanceChevronTexture;
}
