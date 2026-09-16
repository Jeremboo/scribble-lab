import {
  ConeBufferGeometry,
  Curve,
  DataTexture,
  Group,
  MeshToonMaterial,
  CatmullRomCurve3,
  NearestFilter,
  PlaneBufferGeometry,
  QuadraticBezierCurve3,
  RGBFormat,
  TubeBufferGeometry,
  Vector3,
} from 'three';
import gsap from 'gsap';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';

/** Matches BoardCell box height — top face is mesh.y + HALF_HEIGHT. */
const CELL_HALF_HEIGHT = 2.5;
/** Arrow endpoints sit slightly above the cell top. */
const SURFACE_LIFT = 0.2;
/** Highlight hugs the cell floor — tiny epsilon only to avoid z-fighting. */
const HIGHLIGHT_LIFT = 0.001;
const ARC_HEIGHT = 1.35;
const TUBE_RADIUS = 0.05;
const TIP_RADIUS = 0.14;
const TIP_HEIGHT = 0.32;
/** Gap between tube end and cone base so the shaft does not pierce the tip. */
const TUBE_TIP_GAP = 0.04;
const HIGHLIGHT_COLOR = 0xfff2c4;
const ARROW_COLOR = 0xfff2c4;
const UP = new Vector3(0, 1, 0);

/**
 * Arc-length slice of a parent curve in [u0, u1] (both in 0..1 getPointAt space).
 * Avoids CatmullRom overshoot past the intended tube end.
 */
class SubCurve extends Curve {
  /**
   * @param {Curve} parent
   * @param {number} u0
   * @param {number} u1
   */
  constructor(parent, u0, u1) {
    super();
    this.parent = parent;
    this.u0 = u0;
    this.u1 = u1;
  }

  /**
   * @param {number} t
   * @param {Vector3} [optionalTarget]
   */
  getPoint(t, optionalTarget = new Vector3()) {
    const u = this.u0 + (this.u1 - this.u0) * t;
    return this.parent.getPointAt(u, optionalTarget);
  }
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

const toonGradient = createToonGradient();

/**
 * 3D hover preview for a pending pawn move:
 * destination cell marker + curved jump arrow (OutlinableMesh).
 */
export default class MovePreview {
  /**
   * @param {import('three').Object3D} parent
   */
  constructor(parent) {
    this.group = new Group();
    this.group.visible = false;
    parent.add(this.group);

    this._from = new Vector3();
    this._to = new Vector3();
    this._mid = new Vector3();
    this._tangent = new Vector3();
    this._active = false;

    this.highlightMat = new MeshToonMaterial({
      color: HIGHLIGHT_COLOR,
      gradientMap: toonGradient,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    // Flat plane flush with the destination cell top
    this.highlight = new OutlinableMesh(
      new PlaneBufferGeometry(0.8, 0.8),
      this.highlightMat,
    );
    this.highlight.rotation.x = -Math.PI * 0.5;
    this.group.add(this.highlight);

    this.arrowMat = new MeshToonMaterial({
      color: ARROW_COLOR,
      gradientMap: toonGradient,
    });
    this.tube = null;
    this.tip = new OutlinableMesh(
      new ConeBufferGeometry(TIP_RADIUS, TIP_HEIGHT, 10),
      this.arrowMat,
    );
    this.group.add(this.tip);

    this._pulse = null;
  }

  /**
   * @param {import('./BoardCell').default} fromCell
   * @param {import('./BoardCell').default} toCell
   */
  show(fromCell, toCell) {
    if (!fromCell || !toCell) {
      this.hide();
      return;
    }

    this._cellTop(fromCell, this._from);
    this._cellTop(toCell, this._to);

    this.highlight.position.set(
      this._to.x,
      this._to.y - SURFACE_LIFT + HIGHLIGHT_LIFT,
      this._to.z,
    );

    this._rebuildArrow();

    this._active = true;
    this.group.visible = true;
    this._startPulse();
  }

  hide() {
    this._active = false;
    this.group.visible = false;
    this._stopPulse();
    this.highlightMat.opacity = 0.55;
  }

  get isActive() {
    return this._active;
  }

  dispose() {
    this.hide();
    this._disposeTube();
    this.highlight.disposeSurfaceIds();
    this.highlight.geometry.dispose();
    this.highlightMat.dispose();
    this.tip.disposeSurfaceIds();
    this.tip.geometry.dispose();
    this.arrowMat.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }

  /**
   * @param {import('./BoardCell').default} cell
   * @param {Vector3} out
   */
  _cellTop(cell, out) {
    const p = cell.targetedPosition;
    out.set(p.x, p.y + CELL_HALF_HEIGHT + SURFACE_LIFT, p.z);
  }

  _rebuildArrow() {
    this._disposeTube();

    const span = this._from.distanceTo(this._to);
    const arc = ARC_HEIGHT + span * 0.15;
    this._mid.copy(this._from).lerp(this._to, 0.5);
    this._mid.y += arc;

    const curve = new QuadraticBezierCurve3(
      this._from.clone(),
      this._mid.clone(),
      this._to.clone(),
    );

    const curveLen = Math.max(curve.getLength(), 0.001);
    // Reserve cone length + gap at the end; tube only spans [0, tubeEndU].
    const reserved = TIP_HEIGHT + TUBE_TIP_GAP;
    const tubeEndU = Math.max(0.15, 1 - reserved / curveLen);

    const tubularSegments = Math.max(12, Math.round(12 + span * 8 * tubeEndU));
    const tubeCurve = new SubCurve(curve, 0, tubeEndU);
    const geometry = new TubeBufferGeometry(
      tubeCurve,
      tubularSegments,
      TUBE_RADIUS,
      6,
      false,
    );
    this.tube = new OutlinableMesh(geometry, this.arrowMat);
    this.group.add(this.tube);

    // Cone base sits just after the tube end; apex points along the path.
    // ConeBufferGeometry is centered: base at local -Y*(h/2), apex at +Y*(h/2).
    const tubeEnd = new Vector3();
    curve.getPointAt(tubeEndU, tubeEnd);
    curve.getTangentAt(tubeEndU, this._tangent).normalize();
    this.tip.position
      .copy(tubeEnd)
      .addScaledVector(this._tangent, TUBE_TIP_GAP + TIP_HEIGHT * 0.5);
    this.tip.quaternion.setFromUnitVectors(UP, this._tangent);
  }

  _disposeTube() {
    if (!this.tube) return;
    this.group.remove(this.tube);
    this.tube.disposeSurfaceIds();
    this.tube.geometry.dispose();
    this.tube = null;
  }

  _startPulse() {
    this._stopPulse();
    this.highlightMat.opacity = 0.45;
    this._pulse = gsap.to(this.highlightMat, {
      opacity: 0.85,
      duration: 0.55,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    gsap.fromTo(
      this.highlight.scale,
      { x: 0.7, y: 0.7, z: 0.7 },
      { x: 1, y: 1, z: 1, duration: 0.28, ease: 'back.out(2)' },
    );
  }

  _stopPulse() {
    if (this._pulse) {
      this._pulse.kill();
      this._pulse = null;
    }
    gsap.killTweensOf(this.highlightMat);
    gsap.killTweensOf(this.highlight.scale);
  }
}
