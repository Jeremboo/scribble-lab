const BEST_CELLS_KEY = 'infiniteBoardGame.bestCells';

/**
 * Tracks a single infinite-board run for the game-over / debug HUD.
 */
export default class RunStats {
  constructor() {
    this.reset();
  }

  reset() {
    this.runStartedAt = 0;
    this.runEndedAt = 0;
    this.turnReadyAt = 0;
    this.isRunning = false;

    this.originY = 0;
    this.cells = 0;
    this.sections = 0;
    this.loots = 0;
    this.cardsPlayed = [];
    this.thinkTimesMs = [];
  }

  start(originY = 0) {
    const now = performance.now();
    this.reset();
    this.isRunning = true;
    this.runStartedAt = now;
    this.turnReadyAt = now;
    this.originY = originY | 0;
    this.cells = 0;
  }

  /** Update score from the pawn's absolute path row (high-water cells from run start). */
  updatePosition(y) {
    if (!this.isRunning) return;
    const progressed = Math.max(0, (y | 0) - this.originY);
    if (progressed > this.cells) this.cells = progressed;
  }

  markTurnReady() {
    if (!this.isRunning) return;
    this.turnReadyAt = performance.now();
  }

  recordCardPlayed(card) {
    if (!this.isRunning || !card) return;
    const now = performance.now();
    if (this.turnReadyAt > 0) {
      this.thinkTimesMs.push(Math.max(0, now - this.turnReadyAt));
    }
    this.cardsPlayed.push({
      id: card.id,
      type: card.type || 'move',
      value: card.value | 0,
    });
  }

  recordSection() {
    if (!this.isRunning) return;
    this.sections += 1;
  }

  recordLoot() {
    if (!this.isRunning) return;
    this.loots += 1;
  }

  stop() {
    if (!this.isRunning) return;
    this.runEndedAt = performance.now();
    this.isRunning = false;
  }

  getBestCells() {
    try {
      const n = parseInt(localStorage.getItem(BEST_CELLS_KEY), 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Persist a new personal best when this run beats it.
   * @returns {{ score: number, best: number, previousBest: number, isNewBest: boolean }}
   */
  commitBestScore() {
    const score = this.cells | 0;
    const previousBest = this.getBestCells();
    const isNewBest = score > previousBest;
    if (isNewBest) {
      try {
        localStorage.setItem(BEST_CELLS_KEY, String(score));
      } catch {
        /* ignore quota / private mode */
      }
    }
    return {
      score,
      best: Math.max(score, previousBest),
      previousBest,
      isNewBest,
    };
  }

  get durationMs() {
    if (!this.runStartedAt) return 0;
    const end = this.runEndedAt || performance.now();
    return Math.max(0, end - this.runStartedAt);
  }

  get cardsUsed() {
    return this.cardsPlayed.length;
  }

  get averageThinkMs() {
    if (!this.thinkTimesMs.length) return 0;
    const sum = this.thinkTimesMs.reduce((a, b) => a + b, 0);
    return sum / this.thinkTimesMs.length;
  }

  cardLabel(card) {
    if (!card) return '?';
    if (card.type === 'move') {
      return card.value > 0 ? `+${card.value}` : String(card.value);
    }
    return `${card.type}${card.value ? ` ${card.value}` : ''}`;
  }

  cardsSummary() {
    if (!this.cardsPlayed.length) return 'none';
    const counts = new Map();
    const order = [];
    for (const card of this.cardsPlayed) {
      const label = this.cardLabel(card);
      if (!counts.has(label)) {
        counts.set(label, 0);
        order.push(label);
      }
      counts.set(label, counts.get(label) + 1);
    }
    return order
      .map((label) => {
        const n = counts.get(label);
        return n > 1 ? `${label} x${n}` : label;
      })
      .join(' : ');
  }

  snapshot() {
    const bestCells = this.getBestCells();
    return {
      cells: this.cells,
      bestCells,
      sections: this.sections,
      cardsUsed: this.cardsUsed,
      cards: this.cardsPlayed.slice(),
      cardsSummary: this.cardsSummary(),
      durationMs: this.durationMs,
      averageThinkMs: this.averageThinkMs,
      loots: this.loots,
    };
  }

  formatCells(n = this.cells) {
    const count = n | 0;
    return `${count} cell${count === 1 ? '' : 's'}`;
  }

  formatDuration(ms = this.durationMs) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m <= 0) return `${s}s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  }

  formatThink(ms = this.averageThinkMs) {
    if (!this.thinkTimesMs.length) return '—';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  formatShareText(bestInfo) {
    const snap = this.snapshot();
    const best = bestInfo || {
      score: snap.cells,
      best: Math.max(snap.cells, snap.bestCells),
      isNewBest: snap.cells > snap.bestCells,
    };
    const lines = [
      `Score: ${this.formatCells(best.score)}${best.isNewBest ? ' (new best!)' : ''}`,
      `Best: ${this.formatCells(best.best)}`,
      `Cards used (${snap.cardsUsed}): ${snap.cardsSummary}`,
      `Time: ${this.formatDuration(snap.durationMs)}`,
      `Avg think / turn: ${this.formatThink(snap.averageThinkMs)}`,
      `Loots: ${snap.loots}`,
    ];
    return lines.join('\n');
  }
}
