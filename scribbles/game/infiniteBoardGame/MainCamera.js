import { Vector3 } from 'three';
import props from './props';

const ORBIT_DIST = 40;
const ELEV_REF_DIST = 20;

/**
 * Owns orthographic camera orbit, height, hill follow, and zoom.
 * Look target stays fixed — the board scrolls underneath so DOM UI stays put.
 */
export default class MainCamera {
  constructor(camera, { setZoom }) {
    this.camera = camera;
    this._setZoom = setZoom;
    this._lookAt = new Vector3();

    this.angle = -Math.PI * 0.75;

    this.targetedZoom = props.cameraZoomOut;
    this.currentZoom = props.cameraZoomOut * 2;

    this.targetedCameraY = props.initialCameraY;
    this.currentCameraY = this.targetedCameraY;
    this.targetedCameraOffsetY = props.initialCameraOffsetY;
    this.currentCameraOffsetY = this.targetedCameraOffsetY;
    this.targetedHillY = 0;
    this.currentHillY = 0;

    this.updatePosition(props.initialCameraY, props.initialCameraOffsetY);
  }

  updatePosition(
    camY = this.currentCameraY,
    camOffsetY = this.currentCameraOffsetY,
    hillY = this.currentHillY
  ) {
    const offsetY = camOffsetY - (props.boardWidth * 0.01) + hillY;
    const elev = camY * (ORBIT_DIST / ELEV_REF_DIST);
    this.camera.position.set(
      Math.cos(this.angle) * ORBIT_DIST,
      offsetY + elev,
      Math.sin(this.angle) * ORBIT_DIST
    );
    this._lookAt.set(0, offsetY, 0);
    this.camera.lookAt(this._lookAt);
  }

  /** Tween into gameplay framing (from intro / zoomed-out home). */
  animateIn() {
    this.targetedCameraOffsetY = props.cameraOffsetY;
    this.targetedCameraY = props.cameraY;
    this.targetedZoom = props.cameraZoom;
  }

  setTargetedHillY(hillY) {
    this.targetedHillY = hillY;
  }

  /** Per-frame lerp of position, hill follow, zoom, and optional spin. */
  update() {
    let updateCam = false;

    const fCamera = this.targetedCameraY - this.currentCameraY;
    if (Math.abs(fCamera) > 0.01) {
      this.currentCameraY += fCamera * props.velocity * 0.5;
      updateCam = true;
    }

    const fCOffset = this.targetedCameraOffsetY - this.currentCameraOffsetY;
    if (Math.abs(fCOffset) > 0.01) {
      this.currentCameraOffsetY += fCOffset * props.velocity * 0.5;
      updateCam = true;
    }

    const fHillY = this.targetedHillY - this.currentHillY;
    if (Math.abs(fHillY) > 0.01) {
      this.currentHillY += fHillY * props.velocity * 0.15;
      updateCam = true;
    }

    if (updateCam) {
      this.updatePosition();
    }

    const fZoom = this.targetedZoom - this.currentZoom;
    if (Math.abs(fZoom) > 0.01) {
      this.currentZoom += fZoom * props.velocity * 0.5;
      this._setZoom(this.currentZoom);
    }

    if (props.rotationSpeed > 0) {
      this.angle += props.rotationSpeed;
      this.updatePosition();
    }
  }
}
