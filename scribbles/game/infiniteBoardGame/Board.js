import { Group, Vector3 } from "three";
import gsap from "gsap";
import Stage from "../_modules/Stage";
import BoardCell, { isAdvanceTriggerRow } from "./BoardCell";
import BoardLoot from "./BoardLoot";
import { boardNoise, getHillElevation } from "./boardNoise";
import props from "./props";

const CELL_HEIGHT = 5;
const CELL_ELEVATION = 0.25;

export default class Board extends Stage {
  constructor(row, column) {
    super();

    this.group = new Group();

    this.pathX = Math.floor(row / 2);
    this.pathY = 0;
    this.startY = 0;

    this.regenerateNoise = this.regenerateNoise.bind(this);
    this.initCell = this.initCell.bind(this);

    this.loots = [];
    /** @type {Set<BoardCell>} cells still owned by this board (incl. mid-exit). */
    this.liveCells = new Set();
    this.init(row, column, this.initCell);
  }

  getElevation(x, y) {
    const noiseElevation = Math.abs(boardNoise.perlin2((props.noiseX + x) * props.noiseScaleX, (props.noiseY + y + this.pathY) * props.noiseScaleY)) * props.noiseAmpl;
    const pathElevation = props.noisePathElevation - Math.abs(x - this.pathX) * props.noisePathElevation;
    const starterElevation = 0.25 + Math.min(1, y / 3);
    const hillElevation = getHillElevation(x, y, this.pathY);
    return (noiseElevation + pathElevation) * starterElevation + hillElevation;
  }

  /** Hill elevation contribution at path column (matches mesh * 0.5 scale). */
  getPathHillY(y) {
    return getHillElevation(this.pathX, y, this.pathY) * 0.5;
  }

  /** World-space Y of the path cell surface at absolute row y. */
  getPathWorldY(y) {
    return this.getElevation(this.pathX, Math.floor(y)) * 0.5 - CELL_HEIGHT / 2 + CELL_ELEVATION;
  }

  /**
   * Move values present in the configured deck (unique, ascending).
   * @param {{ includeNegative?: boolean }} [opts] - when false (default), only forward moves
   * @returns {number[]}
   */
  deckMoveValues({ includeNegative = false } = {}) {
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
   * Relative draw weight from a card template (`ratio`, default 1).
   * Higher = more common.
   * @param {{ ratio?: number }} card
   * @returns {number}
   */
  cardRatio(card) {
    const r = card && Number(card.ratio);
    return Number.isFinite(r) && r > 0 ? r : 1;
  }

  /**
   * Weighted pick among configured move-card templates.
   * @param {{ includeNegative?: boolean }} [opts]
   * @returns {{ id?: string, value: number, type: string, ratio?: number } | null}
   */
  pickWeightedDeckCard({ includeNegative = true } = {}) {
    /** @type {Array<{ card: object, w: number }>} */
    const pool = [];
    let total = 0;
    for (const card of props.deckCards) {
      if (!card || card.type !== 'move') continue;
      const v = card.value | 0;
      if (v === 0) continue;
      if (!includeNegative && v < 1) continue;
      const w = this.cardRatio(card);
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
   * Weighted pick of a move value (respects `ratio`).
   * @param {{ includeNegative?: boolean }} [opts]
   * @returns {number | null}
   */
  pickWeightedMoveValue(opts) {
    const card = this.pickWeightedDeckCard(opts);
    return card ? (card.value | 0) : null;
  }

  /**
   * Pick a deck move value to cover `target` steps:
   * smallest card >= target; if none, the highest card.
   * (Never round down below the deficit when a sufficient card exists.)
   * @param {number} target
   * @returns {number}
   */
  closestDeckReward(target) {
    const values = this.deckMoveValues();
    if (!values.length) return Math.max(1, target | 0);

    const goal = Math.max(0, target | 0);
    for (let i = 0; i < values.length; i++) {
      if (values[i] >= goal) return values[i];
    }
    return values[values.length - 1];
  }

  /**
   * All path offsets reachable by playing a subset of move values (in any order).
   * @param {number[]} moveValues
   * @returns {Set<number>}
   */
  reachableOffsets(moveValues) {
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
  offsetsWithOneOrTwoCards(moveValues) {
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
   * If rescue needed (hand sum < distance):
   *   1. Rescue loot on a cell reachable with 1 or 2 cards
   *   2. One extra on any hand-reachable cell
   *   3. 50% chance of another extra anywhere in the section
   *
   * If no rescue:
   *   1–3 extras anywhere in the section
   *
   * @param {number} pawnY
   * @param {number} endY - next section trigger
   * @param {number|Array<{ value?: number, type?: string }|number>} hand - total or cards/values
   * @returns {Map<number, { isRescue: boolean, rewardValue: number }>}
   */
  planSectionLoots(pawnY, endY, hand) {
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
    const deckValues = this.deckMoveValues();
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

    /** Extra loot respects deck `ratio` (including negatives). */
    const randomReward = () => {
      const picked = this.pickWeightedMoveValue({ includeNegative: true });
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
      const rescueOffsets = this.offsetsWithOneOrTwoCards(moveValues);
      const rescueCandidates = ysFromOffsets(rescueOffsets);
      rescueCandidates.sort((a, b) => a - b);
      const rescueY = pickFrom(rescueCandidates);

      if (rescueY != null) {
        const rewardValue = this.closestDeckReward(deficit);
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

      // One extra on any full-hand reachable cell.
      const reachable = this.reachableOffsets(moveValues);
      const reachableExtra = pickFrom(ysFromOffsets(reachable));
      placeExtra(reachableExtra, 'extra (reachable)');

      // 50% chance of another extra anywhere in the section.
      if (Math.random() < 0.5) {
        placeExtra(pickFrom(sectionPool()), 'extra (section 50%)');
      } else if (log) {
        console.log('extra (section 50%): skipped');
      }
    } else {
      if (log) {
        console.log('skip rescue', total <= 0 ? 'empty hand' : 'hand covers distance');
      }
      // 1–3 random extras in the section.
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
  lootFlagsForRows(fromY, count, plan) {
    const flags = [];
    for (let i = 0; i < count; i++) {
      flags.push((plan && plan.get(fromY + i)) || false);
    }
    return flags;
  }

  /** Spawn loot on any path cells that already exist for the given plan. */
  spawnLootsAtYs(plan) {
    if (!plan) return;
    const log = !!props.debugLoot;
    const spawned = [];
    const skipped = [];
    for (const [y, meta] of plan) {
      const cell = this.getCell(this.pathX, y);
      if (!cell) {
        skipped.push({ y, reason: 'row not built yet (will spawn on addRowAhead)', meta });
        continue;
      }
      if (cell.loot) {
        skipped.push({ y, reason: 'cell already has loot', meta });
        continue;
      }
      const loot = this.spawnLoot(cell, meta);
      if (loot) {
        spawned.push({
          y,
          kind: meta.isRescue ? 'RESCUE' : 'extra',
          reward: `+${meta.rewardValue}`,
        });
      }
    }
    if (log && (spawned.length || skipped.length)) {
      console.log('[loot spawn]', { spawned, deferredOrSkipped: skipped });
    }
  }

  /**
   * @param {import('./BoardCell').default} cell
   * @param {{ isRescue?: boolean, rewardValue?: number }} [meta]
   */
  spawnLoot(cell, meta = {}) {
    if (!cell || !cell.isPath || cell.loot) return null;
    const loot = new BoardLoot(cell, meta);
    cell.loot = loot;
    this.loots.push(loot);
    this.group.add(loot.mesh);
    return loot;
  }

  collectLootAt(x, y) {
    const cell = this.grid.getCell(x, y);
    if (!cell || !cell.loot || cell.loot.collected) return null;
    const loot = cell.loot;
    if (!loot.collect()) return null;
    this.loots = this.loots.filter((item) => item !== loot);
    return loot;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {{ loot?: false | true | { isRescue?: boolean, rewardValue?: number } }} [options]
   */
  initCell(x, y, { loot = false } = {}) {
    const elevation = this.getElevation(x, y) * 0.5;
    const position = new Vector3(x, elevation, y);
    const isPath = this.pathX === x;
    const cell = new BoardCell(position, isPath);
    if (isPath && loot) {
      this.spawnLoot(cell, loot === true ? {} : loot);
    }
    this.group.add(cell.mesh);
    this.liveCells.add(cell);
    return cell;
  }

  regenerateNoise() {
    this.parse((cell) => {
      if (!cell || !cell.setElevation) return;
      const newElevation = this.getElevation(cell.x, cell.y) * 0.5;
      cell.setElevation(newElevation);
    });
  }

  /**
   * Tear down every cell/loot and rebuild a board segment in place.
   * @param {number} [row]
   * @param {number} [column]
   * @param {number} [startY=0] absolute row where the new segment begins
   *   (keeps world/camera offset on restart instead of snapping to origin).
   */
  reset(row = props.boardWidth, column = props.boardHeight, startY = 0) {
    for (const cell of [...this.liveCells]) {
      if (!cell || !cell.mesh) continue;
      gsap.killTweensOf(cell.mesh.position);
      if (cell.loot) {
        gsap.killTweensOf(cell.loot);
        if (cell.loot.mesh) gsap.killTweensOf(cell.loot.mesh.position);
      }
      if (cell.mesh.parent) this.group.remove(cell.mesh);
      cell.dispose();
    }
    this.liveCells.clear();
    this.loots = [];

    const originY = Math.max(0, startY | 0);
    this.startY = originY;
    // Keep pathY when resuming mid-run so noise stays continuous with grounds.
    if (originY === 0) this.pathY = 0;

    this.grid.grid = [];
    this.grid.row = row;
    this.grid.column = originY + column;
    for (let y = originY; y < originY + column; y++) {
      this.grid.grid[y] = [];
      for (let x = 0; x < row; x++) {
        this.grid.grid[y][x] = this.initCell(x, y);
      }
    }
  }

  update(time = 0) {
    this.loots.forEach((loot) => loot.update(time));
  }

  moveTo(move = 1) {
    this.pathY += move;
    this.regenerateNoise();
  }

  /**
   * Append one row at the front of the board.
   * @param {boolean | { isRescue?: boolean, rewardValue?: number }} [loot=false]
   */
  addRowAhead(loot = false) {
    const y = this.grid.column;
    this.grid.grid[y] = [];
    for (let x = 0; x < props.boardWidth; x++) {
      const cell = this.initCell(x, y, {
        loot: x === this.pathX ? loot : false,
      });
      cell.animateIn();
      this.grid.grid[y][x] = cell;
    }
    if (props.debugLoot && loot) {
      const meta = loot === true ? {} : loot;
      console.log(
        `[loot row] addRowAhead y=${y}`,
        meta.isRescue ? 'RESCUE' : 'extra',
        meta.rewardValue != null ? `+${meta.rewardValue}` : meta,
      );
    }
    this.grid.column = y + 1;
  }

  removeRowBehind() {
    const row = this.grid.grid[this.startY];
    if (row) {
      row.forEach((cell) => {
        if (!cell || !cell.mesh) return;
        cell.animateOut(() => {
          if (cell.loot) {
            this.loots = this.loots.filter((loot) => loot !== cell.loot);
          }
          this.group.remove(cell.mesh);
          this.liveCells.delete(cell);
          cell.dispose();
        });
      });
      delete this.grid.grid[this.startY];
    }
    this.startY += 1;
  }

  /** Ensure a full row exists at absolute y (for the pawn to land on). */
  ensureRow(y) {
    while (this.grid.column <= y) {
      this.addRowAhead(false);
    }
  }

  /**
   * Drop rows at the front until column === targetColumn.
   * Used to keep visible length at boardHeight after overshoot ensureRow.
   */
  trimRowsFrom(targetColumn) {
    while (this.grid.column > targetColumn) {
      const y = this.grid.column - 1;
      const row = this.grid.grid[y];
      if (row) {
        row.forEach((cell) => {
          if (!cell || !cell.mesh) return;
          if (cell.loot) {
            this.loots = this.loots.filter((loot) => loot !== cell.loot);
          }
          this.group.remove(cell.mesh);
          this.liveCells.delete(cell);
          cell.dispose();
        });
        delete this.grid.grid[y];
      }
      this.grid.column = y;
    }
  }

  get visibleRowCount() {
    return this.grid.column - this.startY;
  }

  /** Fade chevrons on rows before yExclusive (passed section markers). */
  fadeAdvanceIconsBelow(yExclusive, duration = 0.8) {
    this.parse((cell) => {
      if (cell && cell.icon && cell.y < yExclusive) {
        cell.fadeAdvanceIcon(duration);
      }
    });
  }

  /**
   * Path landing for move previews when the row is not built yet.
   * Returns a lightweight stand-in (no mesh / no grid mutation).
   */
  getPathPreviewTarget(x, y) {
    const existing = this.getCell(x, y);
    if (existing) return existing;
    const elevation = this.getElevation(x, y) * 0.5;
    return {
      targetedPosition: new Vector3(
        -props.boardWidth * 0.5 + x,
        elevation - CELL_HEIGHT / 2 + CELL_ELEVATION,
        -props.boardHeight * 0.5 + y,
      ),
    };
  }

  /**
   * Create rows ahead and optionally drop rows behind.
   * @param {number} steps - rows to create ahead
   * @param {number} removeCount - rows to remove behind (defaults to steps)
   */
  advance(steps = 1, removeCount = steps) {
    for (let i = 0; i < steps; i++) {
      this.addRowAhead(false);
    }
    for (let i = 0; i < removeCount; i++) {
      this.removeRowBehind();
    }
  }
}
