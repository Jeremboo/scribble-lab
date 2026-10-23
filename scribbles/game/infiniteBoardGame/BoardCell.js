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
import Icon, { getAdvanceChevronTexture, getForbiddenXTexture, getWarningTexture } from './Icon';
export {
  getSectionStride,
  getSectionTriggerOffset,
  isAdvanceTriggerRow,
  getNextSectionTriggerY,
} from './game/section';
import { isAdvanceTriggerRow } from './game/section';

const ENTER_DURATION = 0.45;
const EXIT_DURATION = 0.4;
const FORBIDDEN_ICON_COLOR = '#E8A090';
const WARNING_ICON_COLOR = '#F0C14A';

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
const FORBIDDEN_MATERIAL = toonMaterial(props.forbiddenColors[0]);

/** Current advance-icon tint (shared materials update live; icons need a refresh). */
let advanceIconColor = props.neutralColors[0];

/** Clamp theme index to the configured palette length. */
export function getThemeIndex(index = props.themeIndex) {
  const len = props.pathColors.length;
  const i = index | 0;
  if (i < 0) return 0;
  if (i >= len) return len - 1;
  return i;
}

/** Update shared path / neutral / forbidden cell materials for the active theme. */
export function applyBoardCellTheme(index = props.themeIndex) {
  const i = getThemeIndex(index);
  PATH_MATERIAL.color.set(props.pathColors[i]);
  NEUTRAL_MATERIAL.color.set(props.neutralColors[i]);
  const forbiddenHex = props.forbiddenColors[i] || props.forbiddenColors[0];
  FORBIDDEN_MATERIAL.color.set(forbiddenHex);
  advanceIconColor = props.neutralColors[i];
  return i;
}

export function getAdvanceIconColor() {
  return advanceIconColor;
}

const HEIGHT = 5;
const ELEVATION = 0.25;
const RISE_OFFSET = 2;

export default class BoardCell extends Cell {
  /**
   * @param {import('three').Vector3} position
   * @param {boolean} isPath
   * @param {{ forbidden?: boolean }} [opts]
   */
  constructor(position, isPath, { forbidden = false } = {}) {
    super(position.x, position.z);

    this.isPath = isPath;
    this.isForbidden = false;
    this.isWarned = false;
    /** @type {'advance' | 'forbidden' | 'warning' | null} */
    this.iconKind = null;
    this._warningTween = null;
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
      this._setIcon('advance', getAdvanceChevronTexture(), advanceIconColor, 0.55);
    }

    if (forbidden && isPath) {
      this.setForbidden(true);
    }

    this.update = this.update.bind(this);
  }

  /**
   * @param {'advance' | 'forbidden' | 'warning'} kind
   * @param {import('three').Texture} texture
   * @param {string} color
   * @param {number} size
   */
  _setIcon(kind, texture, color, size) {
    if (this.icon && this.iconKind === kind) {
      this.icon.setColor(color);
      return;
    }
    this._clearIcon();
    this.iconKind = kind;
    this.icon = new Icon({ texture, color, size });
    this.icon.attachToCell(this, { y: HEIGHT / 2 });
  }

  _clearIcon() {
    this._stopWarningPulse();
    if (!this.icon) {
      this.iconKind = null;
      return;
    }
    const icon = this.icon;
    this.icon = null;
    this.iconKind = null;
    icon.dispose();
  }

  _ensureAdvanceIcon() {
    if (!this.isAdvanceTrigger || this.isExiting) return;
    this._setIcon('advance', getAdvanceChevronTexture(), advanceIconColor, 0.55);
  }

  _startWarningPulse() {
    if (!this.icon || !this.icon.mesh) return;
    const mesh = this.icon.mesh;
    mesh.scale.setScalar(1);
    this._warningTween = gsap.to(mesh.scale, {
      x: 1.16,
      y: 1.16,
      z: 1.16,
      duration: 0.55,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  _stopWarningPulse() {
    if (this._warningTween) {
      this._warningTween.kill();
      this._warningTween = null;
    }
    if (this.icon && this.icon.mesh) this.icon.mesh.scale.setScalar(1);
  }

  /** Mark / unmark this cell as a lethal forbidden tile. Any column. */
  setForbidden(forbidden = true) {
    if (this.isExiting) return;
    const next = !!forbidden;
    if (this.isForbidden === next) return;
    this.isForbidden = next;
    this.isWarned = false;

    if (next) {
      this.mesh.material = FORBIDDEN_MATERIAL;
      this._setIcon('forbidden', getForbiddenXTexture(), FORBIDDEN_ICON_COLOR, 0.5);
    } else {
      this.mesh.material = this.isPath ? PATH_MATERIAL : NEUTRAL_MATERIAL;
      this._clearIcon();
      this._ensureAdvanceIcon();
    }
  }

  /**
   * Show or hide the turn−1 warning. Dead cells stay dead.
   * @param {boolean} [warned=true]
   */
  setWarned(warned = true) {
    if (this.isExiting || this.isForbidden) return;
    const next = !!warned;
    if (this.isWarned === next) return;
    this.isWarned = next;

    if (next) {
      this._setIcon('warning', getWarningTexture(), WARNING_ICON_COLOR, 0.5);
      this._startWarningPulse();
    } else {
      this._clearIcon();
      this._ensureAdvanceIcon();
    }
  }

  /** Retint the cell icon after a theme change. */
  applyThemeIcon() {
    if (!this.icon) return;
    if (this.iconKind === 'forbidden' || this.isForbidden) {
      this.icon.setColor(FORBIDDEN_ICON_COLOR);
    } else if (this.iconKind === 'warning' || this.isWarned) {
      this.icon.setColor(WARNING_ICON_COLOR);
    } else {
      this.icon.setColor(advanceIconColor);
    }
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
    this._stopWarningPulse();
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
    if (!this.icon || this.iconKind !== 'advance') return;
    const icon = this.icon;
    this.icon = null;
    this.iconKind = null;
    icon.fadeOut(duration);
  }
}
