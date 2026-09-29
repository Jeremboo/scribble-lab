import { Vector3 } from 'three';

/** Matches #ui-wrapper container query: short landscape canvas frame. */
export const MOBILE_LANDSCAPE_MAX_HEIGHT = 500;

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

const props = {
  debug: true,
  /** Tint loot meshes + show reward values (rescue = red). */
  debugLoot: false,
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
  noiseX: 0,
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
  // initial camera position
  initialCameraProps: {
    y: 0.95,
    offset: new Vector3(0, -2, 0),
    rotation: -Math.PI * 0.75,
    distance: 45,
  },
  inGameCameraProps: {
    y: 0.62,
    rotation: -Math.PI * 0.75,
    distance: 55,
    offset: new Vector3(0, 0.5, 0),
  },
  /**
   * Overrides when the canvas CSS box is mobile landscape
   * (`styleHeight <= maxHeight` and wider than tall).
   */
  mobileLandscape: {
    maxHeight: MOBILE_LANDSCAPE_MAX_HEIGHT,
    initialCameraProps: {
      y: 0.751,
      rotation: -2.546,
      offset: new Vector3(0, -1.1, 0),
      distance: 40,
    },
    inGameCameraProps: {
      y: 0.68,
      rotation: -2.69,
      offset: new Vector3(0, 1.1, 0),
      distance: 30.9,
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
  // atmosphere
  fogNear: 70,
  fogFar: 90,
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
 * @param {number} styleWidth
 * @param {number} styleHeight
 */
export function resolveCameraProps(styleWidth, styleHeight) {
  const ml = props.mobileLandscape;
  if (isMobileLandscapeSize(styleWidth, styleHeight, ml.maxHeight)) {
    return {
      initialCameraProps: mergeCameraProps(
        props.initialCameraProps,
        ml.initialCameraProps,
      ),
      inGameCameraProps: mergeCameraProps(
        props.inGameCameraProps,
        ml.inGameCameraProps,
      ),
    };
  }
  return {
    initialCameraProps: mergeCameraProps(props.initialCameraProps),
    inGameCameraProps: mergeCameraProps(props.inGameCameraProps),
  };
}

export default props;
