import { Vector3 } from 'three';

/** Matches #ui-wrapper container query: short landscape canvas frame. */
export const MOBILE_LANDSCAPE_MAX_HEIGHT = 500;

/** Camera + atmosphere presets keyed by gameplay phase. */
export const GameState = {
  INTRO: 'INTRO',
  IN_GAME: 'IN_GAME',
  GAME_OVER: 'GAME_OVER',
};

/**
 * @param {number} styleWidth
 * @param {number} styleHeight
 * @param {number} [maxHeight]
 */
export function isMobileLandscapeSize(
  styleWidth,
  styleHeight,
  maxHeight = MOBILE_LANDSCAPE_MAX_HEIGHT,
) {
  return styleHeight > 0
    && styleWidth > styleHeight
    && styleHeight <= maxHeight;
}

/**
 * Merge camera prop objects (clones Vector3 offsets).
 * @param {object} base
 * @param {object} [override]
 */
function mergeCameraProps(base, override = {}) {
  const next = { ...base, ...override };
  const offset = override.offset || base.offset;
  if (offset && typeof offset.clone === 'function') {
    next.offset = offset.clone();
  } else if (offset) {
    next.offset = new Vector3(offset.x, offset.y, offset.z);
  }
  return next;
}

/**
 * @param {object} base
 * @param {object} [override]
 */
function mergeViewProps(base, override = {}) {
  return {
    camera: mergeCameraProps(base.camera, override.camera),
    fogNear: override.fogNear != null ? override.fogNear : base.fogNear,
    fogFar: override.fogFar != null ? override.fogFar : base.fogFar,
  };
}

const props = {
  debug: true,
  /** Tint loot meshes + show reward values (rescue = red). */
  debugLoot: false,
  /** Show absolute 3×3 composition grid overlay. */
  debugGrid: false,
  // colors — index into each *Colors array (4 themes)
  themeIndex: 0,
  bgColors:       ['#34241F', '#1A322E', '#342C14', '#203226'],
  outlineColors:  ['#B08A78', '#6E9488', '#B09A5C', '#7A9070'],
  neutralColors:  ['#F6EFE6', '#E8F0EC', '#F4F0DC', '#ECF0E6'],
  pathColors:     ['#E04E3A', '#2A8F7E', '#E0A820', '#6B8F3E'],
  pawnColors:     ['#6ED4C4', '#F0D060', '#9ED46E', '#8EB4E8'],
  fogNearColor: '#4d3207',
  fogFarColor: '#181200',
  // board noise
  noiseX: 22,
  noiseY: 4.5,
  noiseScaleX: 0.1,
  noiseScaleY: 0.1,
  noiseAmpl: 6,
  noisePathElevation: 0.43,
  // hill noise (large rolling hills along the path — keeps detail noise above)
  hillNoiseX: 0,
  hillNoiseY: 0,
  hillNoiseScaleX: 0.006,
  hillNoiseScaleY: 0.01,
  hillNoiseAmpl: 65,
  // ground curve — left / right of the path (sides rise + stronger noise)
  groundCurveHeightLeft: 6,
  groundCurveHeightRight: 15,
  groundCurveRadiusLeft: 8.8,
  groundCurveRadiusRight: 2,
  groundNoiseAmplSideLeft: 2.8,
  groundNoiseAmplSideRight: 3.3,
  // board size
  boardWidth: 5,
  boardHeight: 15,
  boardPadding: 2,
  /**
   * Per-state camera + fog range. Colors stay global (`fogNearColor` / `fogFarColor`).
   * Mobile landscape may override any subset under `mobileLandscape.views`.
   */
  views: {
    [GameState.INTRO]: {
      camera: {
        y: 0.195,
        rotation: -1.979,
        distance: 20.8,
        offset: new Vector3(2.8, 2.5, 0),
      },
      fogNear: 20,
      fogFar: 28,
    },
    [GameState.IN_GAME]: {
      camera: {
        y: 0.62,
        rotation: -Math.PI * 0.75,
        distance: 55,
        offset: new Vector3(0, 2.2, 0),
      },
      fogNear: 65,
      fogFar: 77,
    },
    [GameState.GAME_OVER]: {
      camera: {
        y: 0.62,
        rotation: -Math.PI * 0.75,
        distance: 55,
        offset: new Vector3(0, 0.5, 0),
      },
      fogNear: 65,
      fogFar: 77,
    },
  },
  /**
   * Overrides when the canvas CSS box is mobile landscape
   * (`styleHeight <= maxHeight` and wider than tall).
   */
  mobileLandscape: {
    maxHeight: MOBILE_LANDSCAPE_MAX_HEIGHT,
    views: {
      [GameState.INTRO]: {
        camera: {
          y: 0.3,
          rotation: -2,
          distance: 25.3,
          offset: new Vector3(2.94, 2.27, 0),
        },
      },
      [GameState.IN_GAME]: {
        camera: {
          y: 0.68,
          rotation: -2.69,
          offset: new Vector3(0, 1.1, 0),
          distance: 30.9,
        },
      },
      [GameState.GAME_OVER]: {
        camera: {
          y: 0.68,
          rotation: -2.69,
          offset: new Vector3(0, 1.1, 0),
          distance: 30.9,
        },
      },
    },
    handLayout: {
      handY: -0.41,
      handWidth: 1.15,
      cardWidth: 0.2,
      cardHeight: 0.28,
      maxFanAngle: 0.28,
      curveAmount: 0.03,
      maxOverlap: 0.6,
      minGap: 0.3,
      hoverRaise: 0.04,
      hoverScale: 1.15,
      neighborPush: 0.05,
    },
  },
  // animation
  velocity: 0.1,
  cellCreationStagger: 75,

  // cards deck and hand
  startingHandSize: 4,
  cardDrawnPerSection: 2,
  cardDrawnPerLoot: 1,
  handLayout: {
    handY: -0.4,
    handWidth: 0.85,
    cardWidth: 0.14,
    cardHeight: 0.2,
    maxFanAngle: 0.38,
    curveAmount: 0.045,
    maxOverlap: 0.55,
    minGap: 0.35,
    hoverRaise: 0.05,
    hoverScale: 1.2,
    neighborPush: 0.06,
  },
  deckCards: [
    { id: 'c-1', value: -1, type: 'move', ratio: 0.25 },
    { id: 'c1', value: 1, type: 'move', ratio: 2 },
    { id: 'c2', value: 2, type: 'move', ratio: 3 },
    { id: 'c3', value: 3, type: 'move', ratio: 4 },
    { id: 'c4', value: 4, type: 'move', ratio: 4 },
    { id: 'c5', value: 5, type: 'move', ratio: 3 },
    { id: 'c6', value: 6, type: 'move', ratio: 1 },
    { id: 'c7', value: 7, type: 'move', ratio: 1 },
  ],
};

/**
 * @param {number} styleWidth
 * @param {number} styleHeight
 */
export function resolveHandLayout(styleWidth, styleHeight) {
  const ml = props.mobileLandscape;
  if (isMobileLandscapeSize(styleWidth, styleHeight, ml.maxHeight)) {
    return { ...props.handLayout, ...ml.handLayout };
  }
  return { ...props.handLayout };
}

/**
 * Resolved camera + fog range for a game state (desktop or mobile landscape).
 * @param {keyof typeof GameState | string} state
 * @param {number} styleWidth
 * @param {number} styleHeight
 */
export function resolveView(state, styleWidth, styleHeight) {
  const base = props.views[state];
  if (!base) {
    throw new Error(`Unknown game view state: ${state}`);
  }
  const ml = props.mobileLandscape;
  if (isMobileLandscapeSize(styleWidth, styleHeight, ml.maxHeight)) {
    return mergeViewProps(base, ml.views[state]);
  }
  return mergeViewProps(base);
}

export default props;
