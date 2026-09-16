/**
 * Hearthstone-inspired fan layout in logical hand space.
 *
 * Coordinate system (engine space):
 * - Origin at viewport center
 * - +x right, +y up
 * - Units are normalized to viewport height (1 = full viewport height)
 * - Hand sits near the bottom; card size is a fraction of viewport height
 */

/**
 * @typedef {object} HandLayoutConfig
 * @property {number} [handY] Baseline Y of the hand (center of idle cards)
 * @property {number} [handWidth] Max horizontal span of the fan
 * @property {number} [cardWidth] Logical card width
 * @property {number} [cardHeight] Logical card height
 * @property {number} [maxFanAngle] Max rotation at outermost cards (radians)
 * @property {number} [curveAmount] How much cards arc upward toward center
 * @property {number} [maxOverlap] Max fraction of card width that may overlap
 * @property {number} [minGap] Min gap between card centers as fraction of card width
 * @property {number} [hoverRaise] Extra Y when hovered
 * @property {number} [hoverScale] Scale multiplier when hovered
 * @property {number} [neighborPush] How far neighbors shift away from hover
 */

const DEFAULTS = {
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
};

/**
 * @param {number} count
 * @param {number} [hoverIndex] index of hovered card, or -1
 * @param {Partial<HandLayoutConfig>} [config]
 * @returns {Array<{ x: number, y: number, rotation: number, scale: number, zIndex: number }>}
 */
export function computeHandLayout(count, hoverIndex = -1, config = {}) {
  const cfg = { ...DEFAULTS, ...config };
  const poses = [];

  if (count <= 0) return poses;

  const spacing = computeSpacing(count, cfg);
  const totalWidth = spacing * (count - 1);
  const startX = -totalWidth * 0.5;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const centered = t * 2 - 1; // -1 .. 1

    let x = startX + i * spacing;
    let y = cfg.handY + (1 - centered * centered) * cfg.curveAmount;
    let rotation = centered * cfg.maxFanAngle;
    let scale = 1;
    let zIndex = i + 1;

    if (hoverIndex >= 0) {
      const dist = i - hoverIndex;
      if (dist === 0) {
        y += cfg.hoverRaise;
        scale = cfg.hoverScale;
        rotation *= 0.15;
        zIndex = count + 10;
      } else {
        const push = cfg.neighborPush / Math.max(1, Math.abs(dist));
        x += Math.sign(dist) * push * cfg.cardWidth;
        zIndex = i + 1;
      }
    }

    poses.push({ x, y, rotation, scale, zIndex });
  }

  return poses;
}

/**
 * @param {number} count
 * @param {typeof DEFAULTS} cfg
 */
function computeSpacing(count, cfg) {
  if (count <= 1) return 0;
  const ideal = cfg.handWidth / (count - 1);
  const minSpacing = cfg.cardWidth * (1 - cfg.maxOverlap);
  const maxSpacing = cfg.cardWidth * Math.max(cfg.minGap, 0.95);
  return Math.min(maxSpacing, Math.max(minSpacing, ideal));
}

export function getDefaultLayoutConfig() {
  return { ...DEFAULTS };
}

/**
 * Axis-aligned hit test in logical space against a card pose.
 * @param {number} px
 * @param {number} py
 * @param {{ x: number, y: number, rotation: number, scale: number }} pose
 * @param {number} cardWidth
 * @param {number} cardHeight
 */
export function hitTestCard(px, py, pose, cardWidth, cardHeight) {
  const dx = px - pose.x;
  const dy = py - pose.y;
  const cos = Math.cos(-pose.rotation);
  const sin = Math.sin(-pose.rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;
  const hw = (cardWidth * pose.scale) * 0.5;
  const hh = (cardHeight * pose.scale) * 0.5;
  return Math.abs(localX) <= hw && Math.abs(localY) <= hh;
}
