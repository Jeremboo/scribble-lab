import {
  ClampToEdgeWrapping,
  DataTexture,
  LuminanceFormat,
  NearestFilter,
  UnsignedByteType,
  Vector2,
} from 'three';
import gsap from 'gsap';
import { parseCellKey } from './game/deckRules';
import props from './props';

const RISE_DURATION = 0.9;
const MAX_HEIGHT = 4096;

function nextPow2(n) {
  let value = 1;
  while (value < n) value <<= 1;
  return value;
}

/**
 * Board-sized mask of how dead each cell is (0–1), animated as cells die.
 * Sampled by the void shaders. One texture shared by every tile.
 */
export default class VoidField {
  constructor(boardWidth = props.boardWidth) {
    this.boardWidth = boardWidth | 0;
    this.textureWidth = Math.max(8, nextPow2(this.boardWidth));
    this.height = 2048;
    this.amounts = new Float32Array(this.textureWidth * this.height);
    this.data = new Uint8Array(this.amounts.length);
    this.size = new Vector2(this.textureWidth, this.height);
    this.deadUniform = { value: null };
    this.epoch = 0;
    /** @type {Map<string, gsap.core.Tween>} */
    this._tweens = new Map();
    this._makeTexture();
  }

  _makeTexture() {
    if (this.texture) this.texture.dispose();
    const texture = new DataTexture(
      this.data,
      this.textureWidth,
      this.height,
      LuminanceFormat,
      UnsignedByteType,
    );
    texture.flipY = false;
    texture.generateMipmaps = false;
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.needsUpdate = true;
    this.texture = texture;
    this.deadUniform.value = texture;
  }

  _index(x, y) {
    if (x < 0 || x >= this.boardWidth || y < 0 || y >= this.height) return -1;
    return y * this.textureWidth + x;
  }

  _write(index, amount) {
    this.amounts[index] = amount;
    this.data[index] = Math.min(255, Math.max(0, Math.round(amount * 255)));
    this.texture.needsUpdate = true;
  }

  _grow(minHeight) {
    let height = this.height;
    while (height <= minHeight && height < MAX_HEIGHT) height *= 2;
    if (height === this.height) return;
    const nextAmounts = new Float32Array(this.textureWidth * height);
    const nextData = new Uint8Array(nextAmounts.length);
    nextAmounts.set(this.amounts);
    nextData.set(this.data);
    this.amounts = nextAmounts;
    this.data = nextData;
    this.height = height;
    this.size.y = height;
    this._makeTexture();
  }

  /**
   * Raise newly dead cells. Cells already rising or fully dead stay put.
   * @param {Iterable<string>} dead
   */
  sync(dead) {
    if (!dead) return;
    let maxY = 0;
    const keys = [];
    for (const key of dead) {
      const { x, y } = parseCellKey(key);
      if (y > maxY) maxY = y;
      keys.push({ key, x, y });
    }
    if (maxY >= this.height) this._grow(maxY);

    const epoch = this.epoch;
    for (let i = 0; i < keys.length; i++) {
      const { key, x, y } = keys[i];
      const index = this._index(x, y);
      if (index < 0 || this._tweens.has(key) || this.amounts[index] >= 1) continue;
      const state = { v: this.amounts[index] };
      const tween = gsap.to(state, {
        v: 1,
        duration: RISE_DURATION,
        ease: 'power2.out',
        onUpdate: () => {
          if (epoch !== this.epoch) return;
          this._write(index, state.v);
        },
        onComplete: () => {
          this._tweens.delete(key);
          if (epoch !== this.epoch) return;
          this._write(index, 1);
        },
      });
      this._tweens.set(key, tween);
    }
  }

  clear() {
    this.epoch += 1;
    this._tweens.forEach((tween) => tween.kill());
    this._tweens.clear();
    this.amounts.fill(0);
    this.data.fill(0);
    this.texture.needsUpdate = true;
  }
}
