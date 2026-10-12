import props from '../props';
import { isAdvanceTriggerRow } from './section';

/**
 * Relative draw weight from a card template (`ratio`, default 1).
 * @param {{ ratio?: number }} card
 */
export function cardRatio(card) {
  const r = card && Number(card.ratio);
  return Number.isFinite(r) && r > 0 ? r : 1;
}

/**
 * Move values present in the configured deck (unique, ascending).
 * @param {{ includeNegative?: boolean }} [opts]
 * @returns {number[]}
 */
export function deckMoveValues({ includeNegative = false } = {}) {
  const values = [];
  const seen = new Set();
  for (const card of props.deckCards) {
    if (!card || card.type !== 'move') continue;
    const v = card.value | 0;
    if (v === 0 || seen.has(v)) continue;
    if (!includeNegative && v < 1) continue;
    seen.add(v);
    values.push(v);
  }
  values.sort((a, b) => a - b);
  return values;
}

/**
 * Weighted pick among configured move-card templates.
 * @param {{ includeNegative?: boolean }} [opts]
 * @returns {{ id?: string, value: number, type: string, ratio?: number } | null}
 */
export function pickWeightedDeckCard({ includeNegative = true } = {}) {
  /** @type {Array<{ card: object, w: number }>} */
  const pool = [];
  let total = 0;
  for (const card of props.deckCards) {
    if (!card || card.type !== 'move') continue;
    const v = card.value | 0;
    if (v === 0) continue;
    if (!includeNegative && v < 1) continue;
    const w = cardRatio(card);
    pool.push({ card, w });
    total += w;
  }
  if (!pool.length || total <= 0) return null;
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= pool[i].w;
    if (roll <= 0) return pool[i].card;
  }
  return pool[pool.length - 1].card;
}

/**
 * @param {{ includeNegative?: boolean }} [opts]
 * @returns {number | null}
 */
export function pickWeightedMoveValue(opts) {
  const card = pickWeightedDeckCard(opts);
  return card ? (card.value | 0) : null;
}

/**
 * Smallest deck move >= target; if none, the highest card.
 * @param {number} target
 */
export function closestDeckReward(target) {
  const values = deckMoveValues();
  if (!values.length) return Math.max(1, target | 0);

  const goal = Math.max(0, target | 0);
  for (let i = 0; i < values.length; i++) {
    if (values[i] >= goal) return values[i];
  }
  return values[values.length - 1];
}

/**
 * @param {number[]} moveValues
 * @returns {Set<number>}
 */
export function reachableOffsets(moveValues) {
  let sums = new Set([0]);
  for (let i = 0; i < moveValues.length; i++) {
    const v = moveValues[i];
    if (v < 1) continue;
    const next = new Set(sums);
    sums.forEach((s) => {
      next.add(s + v);
    });
    sums = next;
  }
  return sums;
}

/**
 * Path offsets reachable by playing exactly 1 or 2 cards from the hand.
 * @param {number[]} moveValues
 * @returns {Set<number>}
 */
export function offsetsWithOneOrTwoCards(moveValues) {
  const offsets = new Set();
  for (let i = 0; i < moveValues.length; i++) {
    const a = moveValues[i];
    if (a < 1) continue;
    offsets.add(a);
    for (let j = i + 1; j < moveValues.length; j++) {
      const b = moveValues[j];
      if (b < 1) continue;
      offsets.add(a + b);
    }
  }
  return offsets;
}

/**
 * Plan path-loot rows from the hand vs. distance to the section end.
 *
 * @param {number} pawnY
 * @param {number} endY - next section trigger
 * @param {number|Array<{ value?: number, type?: string }|number>} hand
 * @returns {Map<number, { isRescue: boolean, rewardValue: number }>}
 */
export function planSectionLoots(pawnY, endY, hand) {
  /** @type {Map<number, { isRescue: boolean, rewardValue: number }>} */
  const plan = new Map();
  const distance = endY - pawnY;
  const log = !!props.debugLoot;

  /** @type {number[]} */
  let moveValues = [];
  if (typeof hand === 'number') {
    const totalOnly = Math.max(0, hand | 0);
    if (totalOnly > 0) moveValues = [totalOnly];
  } else if (Array.isArray(hand)) {
    for (let i = 0; i < hand.length; i++) {
      const card = hand[i];
      if (typeof card === 'number') {
        if (card > 0) moveValues.push(card | 0);
        continue;
      }
      if (!card || card.type !== 'move') continue;
      const v = Math.max(0, card.value | 0);
      if (v > 0) moveValues.push(v);
    }
  }

  const total = moveValues.reduce((sum, v) => sum + v, 0);
  const deficit = Math.max(0, distance - total);
  const deckValues = deckMoveValues();
  const needsRescue = total > 0 && deficit > 0;

  if (log) {
    console.groupCollapsed(
      `[loot plan] pawnY=${pawnY} → endY=${endY} (distance=${distance})`,
    );
    console.log('hand move values', moveValues.slice(), `sum=${total}`);
    console.log('deficit', deficit, needsRescue ? '(rescue needed)' : '(no rescue)');
    console.log('deck values', deckValues.slice());
  }

  const pickFrom = (candidates) => {
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const randomReward = () => {
    const picked = pickWeightedMoveValue({ includeNegative: true });
    return picked != null ? picked : 1 + Math.floor(Math.random() * 6);
  };

  const eligibleY = (y) => (
    y >= 3 && y < endY && !isAdvanceTriggerRow(y) && !plan.has(y)
  );

  const ysFromOffsets = (offsets) => {
    const list = [];
    offsets.forEach((offset) => {
      if (offset < 1) return;
      const y = pawnY + offset;
      if (eligibleY(y)) list.push(y);
    });
    return list;
  };

  const sectionPool = () => {
    const list = [];
    for (let y = pawnY + 1; y < endY; y++) {
      if (eligibleY(y)) list.push(y);
    }
    return list;
  };

  const placeExtra = (y, label) => {
    if (y == null) {
      if (log) console.warn(`${label}: no free cell`);
      return false;
    }
    const rewardValue = randomReward();
    plan.set(y, { isRescue: false, rewardValue });
    if (log) console.log(`${label} → y=${y}, reward=+${rewardValue}`);
    return true;
  };

  if (needsRescue) {
    const rescueOffsets = offsetsWithOneOrTwoCards(moveValues);
    const rescueCandidates = ysFromOffsets(rescueOffsets);
    rescueCandidates.sort((a, b) => a - b);
    const rescueY = pickFrom(rescueCandidates);

    if (rescueY != null) {
      const rewardValue = closestDeckReward(deficit);
      plan.set(rescueY, { isRescue: true, rewardValue });
      if (log) {
        console.log(
          `rescue → y=${rescueY} (+${rescueY - pawnY}, 1–2 cards), reward=+${rewardValue} (covers deficit ${deficit})`,
        );
        console.log('rescue candidates', rescueCandidates.slice());
      }
    } else if (log) {
      console.warn('rescue needed but no 1–2 card landable cell', {
        offsets: Array.from(rescueOffsets).sort((a, b) => a - b),
      });
    }

    const reachable = reachableOffsets(moveValues);
    const reachableExtra = pickFrom(ysFromOffsets(reachable));
    placeExtra(reachableExtra, 'extra (reachable)');

    if (Math.random() < 0.5) {
      placeExtra(pickFrom(sectionPool()), 'extra (section 50%)');
    } else if (log) {
      console.log('extra (section 50%): skipped');
    }
  } else {
    if (log) {
      console.log('skip rescue', total <= 0 ? 'empty hand' : 'hand covers distance');
    }
    const extraCount = 1 + Math.floor(Math.random() * 3);
    if (log) console.log(`extras to place: ${extraCount}`);
    for (let i = 0; i < extraCount; i++) {
      placeExtra(pickFrom(sectionPool()), `extra #${i + 1}`);
    }
  }

  if (log) {
    const summary = [];
    plan.forEach((meta, y) => {
      summary.push({
        y,
        kind: meta.isRescue ? 'RESCUE' : 'extra',
        reward: `+${meta.rewardValue}`,
      });
    });
    console.log('final plan', summary);
    console.groupEnd();
  }

  return plan;
}

/**
 * Per-row loot meta (or false) for rows [fromY, fromY + count).
 * @param {number} fromY
 * @param {number} count
 * @param {Map<number, { isRescue: boolean, rewardValue: number }>} plan
 */
export function lootFlagsForRows(fromY, count, plan) {
  const flags = [];
  for (let i = 0; i < count; i++) {
    flags.push((plan && plan.get(fromY + i)) || false);
  }
  return flags;
}
