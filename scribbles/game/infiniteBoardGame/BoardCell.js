import {
  BoxBufferGeometry,
  Color,
  MeshToonMaterial,
  Vector3,
  DataTexture,
  RGBFormat,
  NearestFilter,
} from "three";
import Cell from "../_modules/Cell";
import props from './props';
import OutlinableMesh from "../../../modules/Three/OutlinePass/OutlinableMesh";
import gsap from "gsap";
import Icon, { getAdvanceChevronTexture } from './Icon';

const ENTER_DURATION = 0.45;
const EXIT_DURATION = 0.4;

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

function toonMaterial(hex) {
  return new MeshToonMaterial({
    color: new Color(hex),
    gradientMap: toonGradient,
  });
}

const PATH_MATERIAL = toonMaterial(props.pathColors[0]);
const NEUTRAL_MATERIAL = toonMaterial(props.neutralColors[0]);
const ADVANCE_ICON_COLOR = props.neutralColors[0];

/** Rows shifted when the board advances one section. */
export function getSectionStride() {
  return Math.floor(props.boardHeight - props.boardPadding);
}

/** First padding cell offset from section start (triggers animateAdvance). */
export function getSectionTriggerOffset() {
  return Math.floor(props.boardHeight - props.boardPadding);
}

/**
 * Path rows in each section's padding zone (the last boardPadding cells).
 */
export function isAdvanceTriggerRow(y) {
  const stride = getSectionStride();
  const padding = Math.max(0, Math.floor(props.boardPadding));
  const first = getSectionTriggerOffset();
  if (stride <= 0 || padding <= 0 || y < first) return false;
  return ((y - first) % stride) < padding;
}

const HEIGHT = 5;
const ELEVATION = 0.25;
const RISE_OFFSET = 2;

export default class BoardCell extends Cell {
  constructor(position, isPath) {
    super(position.x, position.z);

    this.isPath = isPath;
    this.isAdvanceTrigger = isPath && isAdvanceTriggerRow(position.z);
    this.isExiting = false;
    this.loot = null;
    this.icon = null;
    this.mesh = new OutlinableMesh(
      new BoxBufferGeometry(1, HEIGHT, 1),
      isPath ? PATH_MATERIAL : NEUTRAL_MATERIAL,
    );
    // this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.targetedPosition = new Vector3(
      -props.boardWidth * 0.5 + position.x,
      this.computeY(position.y),
      -props.boardHeight * 0.5 + position.z,
    );
    this.mesh.position.copy(this.targetedPosition);

    if (this.isAdvanceTrigger) {
      this.icon = new Icon({
        texture: getAdvanceChevronTexture(),
        color: ADVANCE_ICON_COLOR,
        size: 0.55,
      });
      this.icon.attachToCell(this, { y: HEIGHT / 2 });
    }

    this.update = this.update.bind(this);
  }

  computeY(y) {
    return y - HEIGHT / 2 + ELEVATION;
  }

  setElevation(newElevation) {
    if (this.isExiting) return;
    this.targetedPosition.y = this.computeY(newElevation);
    this.tweenY(this.targetedPosition.y);
    this.pawns.forEach((pawn) => {
      pawn.setElevation(this.targetedPosition.y);
    });
    if (this.loot) {
      this.loot.setElevation();
    }
  }

  update() {

  }

  tweenY(y, { duration = props.cellEnterDuration, ease = 'power2.out', onComplete } = {}) {
    gsap.killTweensOf(this.mesh.position, 'y');
    return gsap.to(this.mesh.position, {
      y,
      duration,
      ease,
      onComplete,
    });
  }

  /** Rise into place from below the board. */
  animateIn() {
    if (this.isExiting) return;
    this.mesh.position.y = this.targetedPosition.y - RISE_OFFSET;
    this.tweenY(this.targetedPosition.y, {
      duration: ENTER_DURATION,
      ease: 'power2.out',
    });
  }

  /** Sink below the board, then call onComplete once the mesh can be unmounted. */
  animateOut(onComplete) {
    if (this.isExiting) return;
    this.isExiting = true;
    const sinkY = this.targetedPosition.y - RISE_OFFSET;
    this.targetedPosition.y = sinkY;
    this.tweenY(sinkY, {
      duration: EXIT_DURATION,
      ease: 'power2.in',
      onComplete,
    });
  }

  dispose() {
    gsap.killTweensOf(this.mesh.position);
    if (this.loot) {
      this.loot.dispose();
      this.loot = null;
    }
    if (this.icon) {
      this.icon.dispose();
      this.icon = null;
    }
    this.mesh.disposeSurfaceIds();
    this.mesh.geometry.dispose();
  }

  /** Fade and clear the advance chevron (e.g. after the section is passed). */
  fadeAdvanceIcon(duration = 0.8) {
    if (!this.icon) return;
    const icon = this.icon;
    this.icon = null;
    icon.fadeOut(duration);
  }
}
