import { CylinderBufferGeometry, MeshToonMaterial, Vector3, DataTexture, RGBFormat, NearestFilter } from "three";
import gsap from "gsap";
import Pawn from '../_modules/Pawn';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import props from './props';

const PROPS = {
  radius: 0.25,
  height: 0.8,
  velocity: 0.91,
  jumpVelocity: 0.999
}

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

export default class BoardPawn extends Pawn {
  constructor(pawnProps) {
    super(pawnProps);
    this.mesh = new OutlinableMesh(
      new CylinderBufferGeometry(PROPS.radius, PROPS.radius, PROPS.height),
      new MeshToonMaterial({ color: props.pawnColors[0], gradientMap: createToonGradient() })
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.targetedPosition = new Vector3();
    this.currentPosition = new Vector3();
    this.ampl = 0;
    this.velocity = PROPS.velocity;
    this.direction = 1;

    this.isVisible = false;
    this.targetedScale = this.isVisible ? 1 : 0;
    this.currentScale = this.targetedScale;

    /** When true, ampl eases toward previewAmpl and holds (mid-air jump preview). */
    this.jumpPreview = false;
    this.previewAmpl = 0;

    this._awaitingArrival = false;
    this._onArrived = null;
    this.falling = false;
  }

  /**
   * Fire `onArrived` once the spring has settled on the targeted cell.
   * @param {() => void} onArrived
   */
  awaitArrival(onArrived) {
    this._onArrived = onArrived;
    this._awaitingArrival = true;
  }

  cancelArrival() {
    this._awaitingArrival = false;
    this._onArrived = null;
  }

  finishArrival() {
    if (!this._awaitingArrival) return;
    const callback = this._onArrived;
    this.cancelArrival();
    if (callback) callback();
  }

  /**
   * Drop the pawn through the board, then call onComplete.
   * @param {() => void} [onComplete]
   */
  fallIntoVoid(onComplete) {
    this.cancelArrival();
    this.falling = true;
    gsap.killTweensOf(this.mesh.position);
    gsap.killTweensOf(this.mesh.rotation);
    gsap.killTweensOf(this.mesh.scale);
    gsap.to(this.mesh.position, {
      y: this.mesh.position.y - 8,
      duration: 0.9,
      ease: 'power2.in',
    });
    gsap.to(this.mesh.rotation, {
      x: Math.PI * 0.85,
      duration: 0.9,
      ease: 'power2.in',
    });
    gsap.to(this.mesh.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.9,
      ease: 'power2.in',
      onComplete: () => {
        this.mesh.visible = false;
        this.falling = false;
        this.hide();
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Hold the pawn mid-jump for move previews (drop-target hover).
   * Optionally eases partway toward the destination cell along the path.
   * @param {boolean} enabled
   * @param {object} [opts]
   * @param {number} [opts.ampl=0.85]
   * @param {import('./BoardCell').default} [opts.fromCell]
   * @param {import('./BoardCell').default} [opts.toCell]
   * @param {number} [opts.progress=1/5] fraction of the path to advance
   */
  setJumpPreview(enabled, opts = {}) {
    const ampl = opts.ampl != null ? opts.ampl : 0.85;
    this.jumpPreview = !!enabled;
    if (this.jumpPreview) {
      this.previewAmpl = ampl;
      this.direction = 1;
      // Nudge immediately so the hop reads on the first frames
      this.ampl = Math.max(this.ampl, ampl * 0.35);

      const { fromCell, toCell } = opts;
      const progress = opts.progress != null ? opts.progress : 1 / 5;
      if (fromCell && toCell) {
        const from = fromCell.targetedPosition;
        const to = toCell.targetedPosition;
        this.targetedPosition.set(
          from.x + (to.x - from.x) * progress,
          this.computeY(from.y + (to.y - from.y) * progress),
          from.z + (to.z - from.z) * progress,
        );
      }
    } else {
      this.previewAmpl = 0;
    }
  }

  moveTo(move = 1) {
    this.y += move;
    this.direction = move > 0 ? 1 : -1;
  }

  setThemeColor(color) {
    if (this.mesh && this.mesh.material) {
      this.mesh.material.color.set(color);
    }
  }

  computeY(y) {
    return y + 2.08 + PROPS.height;
  }

  applyRulesOnPawnAdded() {}

  applyRulesFromCellLanded(cell) {
    this.targetedPosition.set(
      cell.targetedPosition.x,
      this.computeY(cell.targetedPosition.y),
      cell.targetedPosition.z,
    );
  }

  applyRulesFromCellLeaved(cell) {}

  setElevation(y) {
    this.targetedPosition.y = this.computeY(y)
  }

  // jump(to = 0.7) {
  //   const id = setInterval(() => {
  //     this.ampl += 0.07;
  //     this.velocity = PROPS.jumpVelocity;
  //     if (this.ampl > to) {
  //       clearInterval(id);
  //       this.velocity = PROPS.velocity
  //     }
  //   }, 10)
  // }

  show() {
    this.falling = false;
    this.cancelArrival();
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.rotation.x = 0;
      gsap.killTweensOf(this.mesh.position);
      gsap.killTweensOf(this.mesh.rotation);
      gsap.killTweensOf(this.mesh.scale);
    }
    this.isVisible = true;
    this.currentPosition.y += 2;
    this.targetedScale = 1;
    this.direction = 1;

  }

  hide() {
    this.cancelArrival();
    this.isVisible = false;
    this.targetedScale = 0;
    this.direction = -1;
  }

  update() {
    if (this.falling) return;
    // Position
    const force = this.targetedPosition.clone().sub(this.currentPosition);
    this.currentPosition.add(force.multiplyScalar(props.velocity));
    this.mesh.position.copy(this.currentPosition);
    this.ampl += force.length();

    // Scale
    const scaleForce = (this.targetedScale - this.currentScale) * props.velocity;
    this.currentScale += scaleForce;
    this.mesh.scale.setScalar(this.currentScale);
    this.ampl += scaleForce ;

    // Effect
    this.mesh.position.y += Math.max(0, this.ampl);
    this.mesh.rotation.x = Math.max(-Math.PI * 0.15, Math.min(Math.PI * 0.25, this.ampl * 0.4 * this.direction));
    if (this.jumpPreview) {
      this.ampl += (this.previewAmpl - this.ampl) * 0.18;
    } else {
      this.ampl *= this.velocity;
    }

    if (this._awaitingArrival && !this.jumpPreview) {
      const dx = this.targetedPosition.x - this.currentPosition.x;
      const dy = this.targetedPosition.y - this.currentPosition.y;
      const dz = this.targetedPosition.z - this.currentPosition.z;
      if (dx * dx + dy * dy + dz * dz < 0.0025 && Math.abs(this.ampl) < 0.06) {
        this.finishArrival();
      }
    }
  }
}