import {
  AmbientLight,
  DirectionalLight,
  Color,
  PCFSoftShadowMap,
  Vector3,
} from 'three';

import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import {
  EffectComposer,
  EffectPass,
  SMAAEffect,
} from 'postprocessing';

import PerspectiveRenderer from '../../../modules/PerspectiveRenderer.three';
import OutlinePass, { DPR } from '../../../modules/Three/OutlinePass';
import DepthPass from '../../../modules/Three/DepthPass';
import AtmosphereFogPass from '../../../modules/Three/AtmosphereFogPass';
import Board from './Board';
import BoardPawn from './BoardPawn';
import Grounds from './Grounds';
import MainCamera from './MainCamera';
import props, {
  GameState,
  isMobileLandscapeSize,
  resolveHandLayout,
  resolveView,
} from './props';
import gsap from 'gsap';
import { CardHand, DropTarget, getHandSize } from '../_modules/cardEngine';
import DomCardRenderer from './DomCardRenderer';
import MovePreview from './MovePreview';
import RunStats from './RunStats';
import { ensurePlayer, submitRun } from './Analytics';
import { getSectionStride, getSectionTriggerOffset, getNextSectionTriggerY, applyBoardCellTheme } from './BoardCell';

//  https://www.freepik.com/free-vector/board-game-collection-isometric-design_10363610.htm
canvasSketch(({ context }) => {
  const renderer = new PerspectiveRenderer({
    canvas: context.canvas,
    antialias: false,
    stencil: false,
    depth: true
  }, 15, window.innerWidth / window.innerHeight, 1, 1000);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const atmosphereNear = new Color(props.fogNearColor);
  const atmosphereFar = new Color(props.fogFarColor);
  renderer.setClearColor(atmosphereFar, 1);

  const mainCamera = new MainCamera(renderer.camera);

  const uiWrapper = document.getElementById('ui-wrapper');

  const composer = new EffectComposer(renderer);
  const outlinePass = new OutlinePass(renderer.scene, renderer.camera, {
    color: new Color(props.outlineColors[0]),
    thickness: 0.5,
  });
  // outlinePass.setDebugMode(true);
  composer.addPass(outlinePass);

  // Shared scene depth — own pass so fog / DOF / etc. can all call setDepthTexture.
  const depthPass = new DepthPass(renderer.scene, renderer.camera);
  composer.addPass(depthPass);

  const fogPass = new AtmosphereFogPass(renderer.camera, {
    ...props,
    fogNear: props.views[GameState.INTRO].fogNear,
    fogFar: props.views[GameState.INTRO].fogFar,
  });
  fogPass.setDepthTexture(depthPass.getDepthTexture());
  composer.addPass(fogPass);
  if (!DPR.antialiasing) {
    fogPass.renderToScreen = true;
  }

  const setAtmosphereColor = (nearColor, farColor, duration = 0) => {
    const targetNear = nearColor != null ? new Color(nearColor) : null;
    const targetFar = farColor != null ? new Color(farColor) : null;
    gsap.killTweensOf(atmosphereNear);
    gsap.killTweensOf(atmosphereFar);

    const applyClear = () => {
      renderer.setClearColor(atmosphereFar, 1);
      document.documentElement.style.setProperty(
        '--fog-far',
        `#${atmosphereFar.getHexString()}`,
      );
    };

    if (duration <= 0) {
      if (targetNear) atmosphereNear.copy(targetNear);
      if (targetFar) atmosphereFar.copy(targetFar);
      applyClear();
      fogPass.setAtmosphere(
        targetNear ? '#' + atmosphereNear.getHexString() : null,
        targetFar ? '#' + atmosphereFar.getHexString() : null,
        0,
      );
      return;
    }

    if (targetNear) {
      gsap.to(atmosphereNear, {
        r: targetNear.r,
        g: targetNear.g,
        b: targetNear.b,
        duration,
      });
    }
    if (targetFar) {
      gsap.to(atmosphereFar, {
        r: targetFar.r,
        g: targetFar.g,
        b: targetFar.b,
        duration,
        onUpdate: applyClear,
      });
    }
    fogPass.setAtmosphere(
      targetNear ? '#' + targetNear.getHexString() : null,
      targetFar ? '#' + targetFar.getHexString() : null,
      duration,
    );
  };

  if (DPR.antialiasing) {
    const areaImage = new Image();
    const searchImage = new Image();
    areaImage.addEventListener('load', () => {
      searchImage.addEventListener('load', () => {
        const smaaEffect = new SMAAEffect(searchImage, areaImage);
        smaaEffect.setEdgeDetectionThreshold(0.05);
        const smaaPass = new EffectPass(renderer.camera, smaaEffect);
        smaaPass.renderToScreen = true;
        composer.addPass(smaaPass);
      });
      searchImage.src = SMAAEffect.searchImageDataURL;
    });
    areaImage.src = SMAAEffect.areaImageDataURL;
  }

  // light
  const ambientLight = new AmbientLight(0xffffff, 0.5);
  renderer.add(ambientLight);
  const directionalLight = new DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(-10, 23, -7);
  directionalLight.castShadow = true;
  const shadowExtent = Math.max(props.boardWidth, props.boardHeight) * 1.5;
  directionalLight.shadow.camera.top = shadowExtent;
  directionalLight.shadow.camera.bottom = -shadowExtent;
  directionalLight.shadow.camera.left = -shadowExtent;
  directionalLight.shadow.camera.right = shadowExtent;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 80;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.bias = -0.002;
  directionalLight.target.position.set(0, 0, 0);
  renderer.add(directionalLight);
  renderer.add(directionalLight.target);


  // * START *****
  const board = new Board(props.boardWidth, props.boardHeight);
  renderer.add(board.group);

  const START_PAWN_Y = 3; // 5th path cell (0-indexed)
  const pawnBoard = new BoardPawn({ x: board.pathX, y: START_PAWN_Y });
  renderer.add(pawnBoard.mesh);

  board.addPawn(pawnBoard);
  pawnBoard.currentPosition.copy(pawnBoard.targetedPosition);

  const animateCameraTarget = (cellNbr, duration = 1.5, delay = 0.25) => {
    const pos = new Vector3(
      0,
      board.getAverageWorldY(cellNbr, cellNbr + props.boardHeight),
      cellNbr
    );
    mainCamera.animateCameraTarget(
      pos,
      duration,
      delay,
    );
  };

  // Bake noise pathY once at init (pawn already placed on START_PAWN_Y).
  // Doing this in animateIn used to snap the heightfield; with the diagonal
  // camera that read as a lateral jump on the ground.
  board.moveTo();
  const grounds = new Grounds(renderer.scene);
  grounds.setPathY(board.pathY);
  animateCameraTarget(0, 0, 0);
  setAtmosphereColor(props.fogNearColor, props.fogFarColor);

  let pendingAdvance = 0;
  let isAnimatedIn = false;
  let isGameOver = false;
  let gameState = GameState.INTRO;
  let endOfTurnTimer = null;
  let debugStatsRaf = 0;
  /** Bumped on restart so stale advance/draw timeouts no-op. */
  let runId = 0;
  let lastStyleWidth = 0;
  let lastStyleHeight = 0;
  let mobileLandscapeActive = null;
  /** Keeps dat.GUI hand sliders aligned with the active desktop/mobile preset. */
  let refreshHandLayoutGui = null;

  const runStats = new RunStats();
  const debugStatsEl = document.getElementById('run-stats-debug');
  const gameOverEl = document.getElementById('game-over');
  /** @type {{ score: number, best: number, previousBest: number, isNewBest: boolean } | null} */
  let lastBestInfo = null;

  const setScoreHighlight = (scoreEl, bestEl, { isNewBest, best }) => {
    if (!scoreEl || !bestEl) return;
    const scoreRow = scoreEl.closest('li');
    const bestRow = bestEl.closest('li');
    if (scoreRow) scoreRow.classList.toggle('is-best', !!isNewBest);
    if (bestRow) bestRow.classList.toggle('is-best', !isNewBest && best > 0);
    const badge = document.getElementById('go-new-best');
    if (badge) badge.hidden = !isNewBest;
  };

  const updateStatsUi = (final = false, bestInfo = null) => {
    const snap = runStats.snapshot();
    const duration = final ? snap.durationMs : runStats.durationMs;
    const score = bestInfo ? bestInfo.score : snap.cells;
    // During a run, show the stored best as the target to beat.
    // After game over, use the committed best (may include a new record).
    const best = bestInfo ? bestInfo.best : snap.bestCells;
    const isNewBest = bestInfo
      ? bestInfo.isNewBest
      : snap.cells > 0 && snap.cells > snap.bestCells;
    const scoreLabel = runStats.formatCells(score);
    const bestLabel = best > 0 ? runStats.formatCells(best) : '—';
    const cardsLabel = snap.cardsUsed
      ? `${snap.cardsUsed} · ${snap.cardsSummary}`
      : '0';
    const timeLabel = runStats.formatDuration(duration);
    const thinkLabel = runStats.formatThink(snap.averageThinkMs);
    const lootsLabel = `${snap.loots}`;

    if (debugStatsEl) {
      document.getElementById('debug-score').textContent = scoreLabel;
      document.getElementById('debug-best').textContent = bestLabel;
      document.getElementById('debug-cards-used').textContent = String(snap.cardsUsed);
      document.getElementById('debug-time').textContent = timeLabel;
      document.getElementById('debug-think').textContent = thinkLabel;
      document.getElementById('debug-loots').textContent = lootsLabel;
      document.getElementById('debug-cards-list').textContent = snap.cardsSummary
        ? snap.cardsSummary
        : '';
    }

    if (final) {
      const goScore = document.getElementById('go-score');
      const goBest = document.getElementById('go-best');
      if (goScore) goScore.textContent = scoreLabel;
      if (goBest) goBest.textContent = bestLabel;
      setScoreHighlight(goScore, goBest, { isNewBest, best });
      document.getElementById('go-cards').textContent = cardsLabel;
      document.getElementById('go-time').textContent = timeLabel;
      document.getElementById('go-think').textContent = thinkLabel;
      document.getElementById('go-loots').textContent = lootsLabel;
    }
  };

  const collapseStatsDetails = () => {
    const runDetails = document.getElementById('run-stats-details');
    const goDetails = document.getElementById('game-over-details');
    if (runDetails) runDetails.open = false;
    if (goDetails) goDetails.open = false;
  };

  const showRunStatsHud = (visible) => {
    if (!debugStatsEl) return;
    debugStatsEl.classList.toggle('hidden', !visible);
    debugStatsEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
  };

  const startDebugStatsLoop = () => {
    if (!debugStatsEl) return;
    showRunStatsHud(true);
    const tick = () => {
      if (!runStats.isRunning && isGameOver) {
        updateStatsUi(true, lastBestInfo);
        return;
      }
      updateStatsUi(false);
      debugStatsRaf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(debugStatsRaf);
    debugStatsRaf = requestAnimationFrame(tick);
  };

  const triggerGameOver = () => {
    if (isGameOver) return;
    isGameOver = true;
    // Stop mid-flight section advances so the board freezes at this offset.
    runId += 1;
    pendingAdvance = 0;
    pendingDrawAdds = 0;
    runStats.updatePosition(pawnBoard.y);
    runStats.stop();
    lastBestInfo = runStats.commitBestScore();
    submitRun(runStats.snapshot(), { isNewBest: lastBestInfo.isNewBest });
    clearTimeout(endOfTurnTimer);
    endOfTurnTimer = null;
    hideMovePreview();
    // Hide remaining section-advance chevrons under the overlay.
    board.fadeAdvanceIconsBelow(Infinity, 0.35);
    pawnBoard.hide();
    showRunStatsHud(false);
    collapseStatsDetails();
    applyView(GameState.GAME_OVER);

    if (cardUiRoot) {
      cardUiRoot.classList.remove('card-hand-veil-on');
      cardUiRoot.classList.add('hidden');
      cardUiRoot.setAttribute('aria-hidden', 'true');
    }

    updateStatsUi(true, lastBestInfo);
    if (gameOverEl) {
      gameOverEl.classList.remove('hidden');
      gameOverEl.setAttribute('aria-hidden', 'false');
    }
  };

  const resolveEndOfTurn = () => {
    if (isGameOver || !isAnimatedIn) return;
    // Wait until every scheduled reward/hand add has landed.
    if (pendingDrawAdds > 0) return;
    if (cardHand.cards.length === 0) {
      triggerGameOver();
      return;
    }
    runStats.markTurnReady();
    updateStatsUi(false);
  };

  /** Wait for loot / section draw settle, then check empty hand. */
  const scheduleEndOfTurnCheck = () => {
    if (isGameOver) return;
    clearTimeout(endOfTurnTimer);
    // Reward draws are queued at 500ms; card adds stagger +150ms each.
    // If pending adds still remain when this fires, resolveEndOfTurn no-ops
    // and drawCards calls it again when the last add lands.
    endOfTurnTimer = setTimeout(() => {
      endOfTurnTimer = null;
      resolveEndOfTurn();
    }, turnMayDraw ? 600 : 80);
  };

  // ── Card hand (renderer-agnostic engine + DomCardRenderer) ──
  const cardUiRoot = document.getElementById('card-ui');
  let turnMayDraw = false;
  let pendingDrawAdds = 0;
  let nextCardId = 1;
  const cardHand = new CardHand({
    layout: props.handLayout,
    onCardPlayed: (card) => {
      if (isGameOver) return;
      runStats.recordCardPlayed(card);
      turnMayDraw = false;
      const steps = card.type === 'move' ? (card.value | 0) : 1;
      if (steps !== 0) advancePawn(steps);
      scheduleEndOfTurnCheck();
      updateStatsUi(false);
    },
    onCardDragStart: (card) => {
      if (isGameOver) return;
      showMovePreview(card);
    },
    onCardReturned: () => hideMovePreview(),
  });

  const getActiveView = (state = gameState) => resolveView(state, lastStyleWidth, lastStyleHeight);

  const applyView = (state, { cameraDuration = 0.45, applyFog = true } = {}) => {
    gameState = state;
    const view = getActiveView(state);
    if (cameraDuration != null) {
      mainCamera.animateCameraProps(view.camera, cameraDuration);
    }
    if (applyFog) {
      fogPass.animateFogRange(view.fogNear, view.fogFar, cameraDuration || 0);
    }
    return view;
  };

  const applyResponsiveHandLayout = () => {
    const layout = resolveHandLayout(lastStyleWidth, lastStyleHeight);
    cardHand.setLayout(layout);
    playZone.handSize = getHandSize(layout);
    if (domCardRenderer) {
      domCardRenderer.refreshCardSizes();
      cardHand.syncRenderer();
    }
  };

  const applyResponsiveCamera = (duration = 0.45) => {
    applyView(gameState, { cameraDuration: duration });
  };

  const movePreview = new MovePreview(board.group);

  const hideMovePreview = () => {
    movePreview.hide();
    pawnBoard.setJumpPreview(false);
    const cell = board.getCell(pawnBoard.x, pawnBoard.y);
    if (cell) pawnBoard.applyRulesFromCellLanded(cell);
  };

  const showMovePreview = (card) => {
    if (!isAnimatedIn || !card || card.type !== 'move') {
      hideMovePreview();
      return;
    }
    const steps = card.value | 0;
    if (steps === 0) {
      hideMovePreview();
      return;
    }
    const targetY = Math.max(board.startY, pawnBoard.y + steps);
    // Do not create rows here — off-board landings are built staggered by
    // animateAdvance when the card is actually played.
    const fromCell = board.getCell(pawnBoard.x, pawnBoard.y);
    const toCell = board.getPathPreviewTarget(pawnBoard.x, targetY);
    if (!fromCell || !toCell) {
      hideMovePreview();
      return;
    }
    movePreview.show(fromCell, toCell);
    pawnBoard.setJumpPreview(true, { fromCell, toCell, progress: 1 / 5 });
  };

  const formatMoveLabel = (value) => (value > 0 ? `+${value}` : String(value));

  const playZone = new DropTarget({
    id: 'play-zone',
    handSize: getHandSize(props.handLayout),
    // debug: props.debug,
    label: (card) => (
      card.type === 'move'
        ? `Move ${formatMoveLabel(card.value)}`
        : `Play ${card.type}`
    ),
  });
  cardHand.addDropTarget(playZone);

  let domCardRenderer = null;
  /** Remaining draw pile after the opening hand is dealt. */
  let deck = [];

  const shuffle = (cards) => {
    const next = cards.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
    }
    return next;
  };

  /** Pick any configured move value (including negatives), weighted by `ratio`. */
  const pickDeckMoveValue = () => {
    const picked = board.pickWeightedMoveValue({ includeNegative: true });
    return picked != null ? picked : 1 + Math.floor(Math.random() * 6);
  };

  const makeMoveCard = (value = pickDeckMoveValue(), extra = {}) => ({
    id: `c${nextCardId++}`,
    value,
    type: 'move',
    ...extra,
  });

  /**
   * Build a draw pile from templates: each card is cloned `ratio` times
   * (rounded, min 1), then shuffled. Higher ratio → more copies → more common.
   */
  const buildWeightedDeck = () => {
    const bag = [];
    for (const card of props.deckCards) {
      if (!card) continue;
      const copies = Math.max(1, Math.round(board.cardRatio(card)));
      for (let i = 0; i < copies; i++) {
        bag.push({
          id: `c${nextCardId++}`,
          value: card.value,
          type: card.type,
          ratio: card.ratio,
        });
      }
    }
    return shuffle(bag);
  };

  const refillDeck = () => {
    deck = buildWeightedDeck();
  };

  /** Plan + apply section loots from hand reach vs. next trigger. */
  const planAndApplySectionLoots = (cards, pawnY = pawnBoard.y) => {
    const endY = getNextSectionTriggerY(pawnY);
    const plan = board.planSectionLoots(pawnY, endY, cards);
    board.spawnLootsAtYs(plan);
    return plan;
  };

  const takeDeckCards = (count) => {
    const taken = [];
    for (let i = 0; i < count; i++) {
      if (!deck.length) refillDeck();
      taken.push(deck.length ? deck.shift() : makeMoveCard());
    }
    return taken;
  };

  const enqueueHandCards = (cards) => {
    if (!cards.length) return;
    const id = runId;
    cards.forEach((data, i) => {
      pendingDrawAdds += 1;
      setTimeout(() => {
        if (id !== runId) return;
        if (!isGameOver) {
          cardHand.addCard(data);
        }
        pendingDrawAdds = Math.max(0, pendingDrawAdds - 1);
        if (pendingDrawAdds === 0 && endOfTurnTimer === null) {
          resolveEndOfTurn();
        }
      }, 150 * i);
    });
  };

  const drawCards = (count) => {
    if (!count || count < 1) return 0;
    const drawn = takeDeckCards(count);
    enqueueHandCards(drawn);
    return drawn.length;
  };

  const applyLoot = (loot) => {
    if (!loot) return;
    const id = runId;
    runStats.recordLoot();

    turnMayDraw = true;
    setTimeout(() => {
      if (id !== runId) return;
      const drawCount = Math.max(1, props.cardDrawnPerLoot | 0);

      if (loot.rewardValue != null) {
        // Guaranteed reward first (rescue needs this value), then fill from deck.
        const cards = [makeMoveCard(loot.rewardValue, {
          isRescue: !!loot.isRescue && props.debugLoot,
        })];
        const extras = drawCount - 1;
        if (extras > 0) cards.push(...takeDeckCards(extras));
        if (props.debugLoot) {
          console.log(
            '[loot collect]',
            loot.isRescue ? 'RESCUE' : 'extra',
            `y=${loot.cell ? loot.cell.y : '?'}`,
            `→ ${cards.length} card(s)`,
            cards.map((c) => (c.value > 0 ? `+${c.value}` : String(c.value))).join(', '),
          );
        }
        enqueueHandCards(cards);
      } else {
        if (props.debugLoot) {
          console.log('[loot collect] no rewardValue — drawing from deck', drawCount);
        }
        drawCards(drawCount);
      }
    }, 500);
  };

  const placePawnAtCurrentCell = () => {
    const cell = board.getCell(pawnBoard.x, pawnBoard.y);
    if (cell) {
      board.addPawn(pawnBoard);
      return cell;
    }
    // Row not built yet — aim at a stand-in; animateAdvance creates it staggered.
    const preview = board.getPathPreviewTarget(pawnBoard.x, pawnBoard.y);
    pawnBoard.applyRulesFromCellLanded(preview);
    return null;
  };

  const advancePawn = (steps = 1) => {
    if (!isAnimatedIn || isGameOver || steps === 0) return;
    hideMovePreview();

    const dir = steps > 0 ? 1 : -1;
    const count = Math.abs(steps | 0);
    let shouldAdvance = false;

    for (let i = 0; i < count; i++) {
      if (dir < 0 && pawnBoard.y <= board.startY) break;

      board.removePawn(pawnBoard);
      pawnBoard.moveTo(dir);
      placePawnAtCurrentCell();

      if (dir > 0 && pawnBoard.y >= board.startY + pendingAdvance + getSectionTriggerOffset()) {
        shouldAdvance = true;
      }
    }

    runStats.updatePosition(pawnBoard.y);

    // New section rows are created (staggered) only by animateAdvance — never
    // ensureRow here, or their animateIn would fire before the stagger.
    if (shouldAdvance) {
      animateAdvance(getSectionStride());
    }

    // Loot only on the card's final landing cell (not cells jumped over).
    // If the landing row is still pending (section advance), collect when it appears.
    applyLoot(board.collectLootAt(pawnBoard.x, pawnBoard.y));
  };

  const fadeInCardHandVeil = () => {
    if (!cardUiRoot) return;
    cardUiRoot.classList.remove('card-hand-veil-on');
    // Double rAF so the browser commits opacity: 0 before transitioning to 1.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cardUiRoot.classList.contains('hidden')) return;
        cardUiRoot.classList.add('card-hand-veil-on');
      });
    });
  };

  const initCardHandUi = () => {
    if (!domCardRenderer) {
      cardUiRoot.classList.remove('hidden');
      cardUiRoot.setAttribute('aria-hidden', 'false');
      domCardRenderer = new DomCardRenderer({
        root: cardUiRoot,
        hand: cardHand,
        renderLabel: (card) => (card.value > 0 ? `+${card.value}` : String(card.value)),
      });
    } else {
      cardUiRoot.classList.remove('hidden');
      cardUiRoot.setAttribute('aria-hidden', 'false');
    }
    fadeInCardHandVeil();

    cardHand.setCards([]);
    nextCardId = 1;
    deck = buildWeightedDeck();
    const opening = takeDeckCards(props.startingHandSize);
    // First-section loots use the dealt hand (before cards animate in).
    planAndApplySectionLoots(opening, pawnBoard.y);
    enqueueHandCards(opening);
  };

  const resetWorldForNewRun = () => {
    hideMovePreview();
    board.removePawn(pawnBoard);

    // Freeze the camera where it is — no tween back from the final section.
    gsap.killTweensOf(mainCamera.target);
    const resumeY = Math.max(0, Math.round(mainCamera.target.z));

    board.reset(props.boardWidth, props.boardHeight, resumeY);
    if (resumeY === 0) {
      board.moveTo();
      grounds.reset();
      grounds.setPathY(board.pathY);
    } else {
      board.regenerateNoise();
      grounds.setPathY(board.pathY);
    }
    // Same as post-advance: passed-section markers sit on the first padding
    // rows of this window — strip them so only the upcoming chevrons remain.
    board.fadeAdvanceIconsBelow(resumeY + getSectionTriggerOffset(), 0);

    pawnBoard.x = board.pathX;
    pawnBoard.y = resumeY;
    pawnBoard.setJumpPreview(false);
    pawnBoard.ampl = 0;
    // Already hidden on game over — keep scale at 0 until show() on restart.
    pawnBoard.isVisible = false;
    pawnBoard.targetedScale = 0;
    pawnBoard.currentScale = 0;
    pawnBoard.mesh.scale.setScalar(0);
    board.addPawn(pawnBoard);

    const cell = board.getCell(pawnBoard.x, pawnBoard.y);
    if (cell) {
      pawnBoard.applyRulesFromCellLanded(cell);
      pawnBoard.currentPosition.copy(pawnBoard.targetedPosition);
    }

    setAtmosphereColor(props.fogNearColor, props.fogFarColor);
  };

  const restartGame = () => {
    if (!isGameOver) return;

    runId += 1;
    isGameOver = false;
    isAnimatedIn = false;
    pendingAdvance = 0;
    pendingDrawAdds = 0;
    turnMayDraw = false;
    clearTimeout(endOfTurnTimer);
    endOfTurnTimer = null;

    if (gameOverEl) {
      gameOverEl.classList.add('hidden');
      gameOverEl.setAttribute('aria-hidden', 'true');
    }

    // Stay on the game page — never return to home.
    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    resetWorldForNewRun();

    lastBestInfo = null;
    runStats.start(pawnBoard.y);
    collapseStatsDetails();
    startDebugStatsLoop();
    updateStatsUi(false);

    setTimeout(() => {
      initCardHandUi();
    }, 200);

    setTimeout(() => {
      isAnimatedIn = true;
      pawnBoard.show();
      runStats.markTurnReady();
      updateStatsUi(false);
      // applyView(GameState.IN_GAME);
    }, 500);
  };

  const animateIn  = () => {
    applyView(GameState.IN_GAME, { cameraDuration: 3 });

    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    lastBestInfo = null;
    runStats.start(pawnBoard.y);
    collapseStatsDetails();
    startDebugStatsLoop();
    updateStatsUi(false);

    setTimeout(() => {
      initCardHandUi();
    }, 500);

    setTimeout(() => {
      isAnimatedIn = true;
      runStats.markTurnReady();
    }, 1000);
  }

  const animateAdvance = (steps) => {
    const id = runId;
    grounds.onBoardAdvance();
    runStats.recordSection();
    updateStatsUi(false);

    // Take section rewards now so loot planning sees the full upcoming hand,
    // then animate them into the hand after the usual delay.
    const sectionCards = takeDeckCards(props.cardDrawnPerSection);
    turnMayDraw = true;
    setTimeout(() => {
      if (id !== runId) return;
      enqueueHandCards(sectionCards);
    }, 500);

    pendingAdvance += steps;
    const targetStartY = board.startY + pendingAdvance;
    const targetEndY = Math.max(
      targetStartY + props.boardHeight,
      pawnBoard.y + 1,
    );
    animateCameraTarget(targetStartY);

    // Fade chevrons from the section just passed; keep the next padding markers.
    board.fadeAdvanceIconsBelow(targetStartY + getSectionTriggerOffset());

    const rowsToAdd = Math.max(0, targetEndY - board.grid.column);

    // Plan with remaining hand + section draws (complete hand for this section).
    const handForLoot = cardHand.cards.concat(sectionCards);
    const lootPlanMap = board.planSectionLoots(
      pawnBoard.y,
      getNextSectionTriggerY(pawnBoard.y),
      handForLoot,
    );
    board.spawnLootsAtYs(lootPlanMap);
    const lootPlan = board.lootFlagsForRows(board.grid.column, rowsToAdd, lootPlanMap);

    for (let i = 0; i < steps; i++) {
      const stepDelay = props.cellCreationStagger * i;
      setTimeout(() => {
        if (id !== runId) return;
        if (pawnBoard.y > board.startY) {
          board.removeRowBehind();
          pendingAdvance = Math.max(0, pendingAdvance - 1);
        }
      }, stepDelay);
    }

    for (let i = 0; i < rowsToAdd; i++) {
      const stepDelay = props.cellCreationStagger * i;
      setTimeout(() => {
        if (id !== runId) return;
        const y = board.grid.column;
        board.addRowAhead(lootPlan[i]);
        // Attach pawn (and any loot) once its landing row rises in.
        if (y === pawnBoard.y) {
          board.addPawn(pawnBoard);
          applyLoot(board.collectLootAt(pawnBoard.x, pawnBoard.y));
        }
      }, stepDelay + 250);
    }
  }

  // INTRO ANIMATION
  setTimeout(() => {
    applyView(GameState.INTRO, { cameraDuration: 1.5 });
    gsap.to(
      document.body.querySelectorAll('#home-page > .home-brand, #home-page > .home-nav, #home-page > .home-footer'),
      { autoAlpha: 1, duration: 0.75, y: 0, delay: 0.5, stagger: 0.2 },
    );

    setTimeout(() => {
      isAnimatedIn = true;
      pawnBoard.show();
    }, 1000);

    // Anonymous player doc in Atlas (no-op until ANALYTICS_API_URL is set).
    ensurePlayer();

    const howtoPanel = document.getElementById('howto-panel');
    const openHowto = () => {
      if (!howtoPanel) return;
      howtoPanel.classList.remove('hidden');
      howtoPanel.setAttribute('aria-hidden', 'false');
    };
    const closeHowto = () => {
      if (!howtoPanel) return;
      howtoPanel.classList.add('hidden');
      howtoPanel.setAttribute('aria-hidden', 'true');
    };
    // document.getElementById('howto-button').addEventListener('click', openHowto);
    // document.getElementById('howto-close').addEventListener('click', closeHowto);
    // howtoPanel.addEventListener('click', (event) => {
    //   if (event.target === howtoPanel) closeHowto();
    // });

    document.getElementById('start-button').addEventListener('click', () => {
      closeHowto();
      animateIn();
    });

    document.getElementById('restart-button').addEventListener('click', () => {
      restartGame();
    });

    const shareButton = document.getElementById('share-button');
    if (shareButton) {
      shareButton.addEventListener('click', async () => {
        const text = runStats.formatShareText(lastBestInfo);
        const shareData = {
          title: 'Infinite Board Game',
          text,
          // url: window.location.href,
        };
        try {
          if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
            await navigator.share(shareData);
            return;
          }
        } catch (err) {
          if (err && err.name === 'AbortError') return;
        }
        try {
          await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
          const prev = shareButton.textContent;
          shareButton.textContent = 'Copied!';
          setTimeout(() => { shareButton.textContent = prev; }, 1600);
        } catch (_) {
          window.prompt('Copy your run stats:', `${text}\n${window.location.href}`);
        }
      });
    }
  }, 200);

  // * GUI *******

  const applyTheme = (index, duration = 0.45) => {
    const i = applyBoardCellTheme(index);
    props.themeIndex = i;
    board.applyThemeIcons();
    pawnBoard.setThemeColor(props.pawnColors[i]);
    outlinePass.setColor(props.outlineColors[i], duration);
    grounds.setBgColor(props.bgColors[i], duration);
  };

  if (props.debug) {
    const regenerateNoise = () => {
      board.regenerateNoise();
      grounds.syncFromProps();
      animateCameraTarget(board.startY);
    };

    const gui = new GUI();
    const themeGui = gui.addFolder('themes');
    themeGui.open();
    const themeLabels = ['1 · crimson', '2 · teal', '3 · gold', '4 · moss'];

    for (let i = 0; i < props.pathColors.length; i++) {
      const themeIndex = i;
      const folder = themeGui.addFolder(themeLabels[i] || `theme ${i + 1}`);
      const colors = {
        bg: props.bgColors[i],
        outline: props.outlineColors[i],
        neutral: props.neutralColors[i],
        path: props.pathColors[i],
        pawn: props.pawnColors[i],
      };

      const syncThemeColors = () => {
        props.bgColors[themeIndex] = colors.bg;
        props.outlineColors[themeIndex] = colors.outline;
        props.neutralColors[themeIndex] = colors.neutral;
        props.pathColors[themeIndex] = colors.path;
        props.pawnColors[themeIndex] = colors.pawn;
        if (props.themeIndex === themeIndex) {
          applyTheme(themeIndex, 0);
        }
      };

      folder.addColor(colors, 'bg').name('ground').onChange(syncThemeColors);
      folder.addColor(colors, 'outline').name('outline').onChange(syncThemeColors);
      folder.addColor(colors, 'neutral').name('cells').onChange(syncThemeColors);
      folder.addColor(colors, 'path').name('path').onChange(syncThemeColors);
      folder.addColor(colors, 'pawn').name('pawn').onChange(syncThemeColors);
      folder.add({
        activate: () => applyTheme(themeIndex),
      }, 'activate').name('use theme');
    }

    gui.add(props, 'debugLoot').name('debug loot');
    const debugGridEl = document.getElementById('debug-grid-3x3');
    const syncDebugGrid = (visible = props.debugGrid) => {
      if (!debugGridEl) return;
      props.debugGrid = !!visible;
      debugGridEl.classList.toggle('hidden', !props.debugGrid);
      debugGridEl.setAttribute('aria-hidden', props.debugGrid ? 'false' : 'true');
    };
    syncDebugGrid();
    gui.add(props, 'debugGrid').name('debug grid').onChange(syncDebugGrid);
    gui.add(props, 'noiseX', -50, 50).onChange(regenerateNoise);
    gui.add(props, 'noiseY', -50, 50).onChange(regenerateNoise);
    gui.add(props, 'noiseScaleX', 0.01, 1).onChange(regenerateNoise);
    gui.add(props, 'noiseScaleY', 0.01, 1).onChange(regenerateNoise);
    gui.add(props, 'noiseAmpl', 1, 10).onChange(regenerateNoise);
    const hillGui = gui.addFolder('hills');
    hillGui.add(props, 'hillNoiseX', -500, 500).onChange(regenerateNoise);
    hillGui.add(props, 'hillNoiseY', -500, 500).onChange(regenerateNoise);
    hillGui.add(props, 'hillNoiseScaleX', 0.001, 0.01).onChange(regenerateNoise);
    hillGui.add(props, 'hillNoiseScaleY', 0.001, 0.01).onChange(regenerateNoise);
    hillGui.add(props, 'hillNoiseAmpl', 0, 120).onChange(regenerateNoise);
    gui.add(props, 'groundCurveHeightLeft', 0, 30).onChange(regenerateNoise);
    gui.add(props, 'groundCurveHeightRight', 0, 30).onChange(regenerateNoise);
    gui.add(props, 'groundCurveRadiusLeft', 1, 40).onChange(regenerateNoise);
    gui.add(props, 'groundCurveRadiusRight', 1, 40).onChange(regenerateNoise);
    gui.add(props, 'groundNoiseAmplSideLeft', 1, 8).onChange(regenerateNoise);
    gui.add(props, 'groundNoiseAmplSideRight', 1, 8).onChange(regenerateNoise);
    const cameraGui = gui.addFolder('camera');
    cameraGui.open();
    cameraGui.add(mainCamera.camera, 'fov', 1, 120).onChange((fov) => {
      renderer.setFov(fov);
    }).step(0.001);
    cameraGui.add(mainCamera.props, 'y', 0, 1.5).onChange(mainCamera.update).step(0.001).listen();
    cameraGui.add(mainCamera.props, 'rotation', -Math.PI, Math.PI).onChange(mainCamera.update).step(0.001);
    cameraGui.add(mainCamera.props, 'distance', 0, 100).onChange(mainCamera.update).step(0.1).listen();
    cameraGui.add(mainCamera.props.offset, 'x', -10, 10).name('offsetX').onChange(mainCamera.update).step(0.01);
    cameraGui.add(mainCamera.props.offset, 'y', -10, 10).name('offsetY').onChange(mainCamera.update).step(0.01);
    cameraGui.add(mainCamera.props.offset, 'z', -10, 10).name('offsetZ').onChange(mainCamera.update).step(0.01);
    const lightGui = gui.addFolder('light');
    lightGui.add(directionalLight.position, 'x', -10, 10);
    lightGui.add(directionalLight.position, 'y', -10, 100);
    lightGui.add(directionalLight.position, 'z', -10, 10);
    const fogGui = gui.addFolder('atmosphere');
    fogGui.open();
    const atmosphereGui = {
      colorNear: '#' + atmosphereNear.getHexString(),
      colorFar: '#' + atmosphereFar.getHexString(),
    };
    fogGui.addColor(atmosphereGui, 'colorNear').name('color near').onChange((v) => {
      props.fogNearColor = v;
      setAtmosphereColor(v, null, 0);
    });
    fogGui.addColor(atmosphereGui, 'colorFar').name('color far').onChange((v) => {
      props.fogFarColor = v;
      setAtmosphereColor(null, v, 0);
    });
    const fogRangeGui = props.views[GameState.IN_GAME];
    fogGui.add(fogRangeGui, 'fogNear', 0, 100).onChange((v) => {
      fogPass.animateFogRange(v, fogRangeGui.fogFar);
    });
    fogGui.add(fogRangeGui, 'fogFar', 0, 100).onChange((v) => {
      fogPass.animateFogRange(fogRangeGui.fogNear, v);
    });

    const handGui = gui.addFolder('hand layout');
    handGui.open();
    // Proxy so we always edit the *active* layout (desktop vs mobileLandscape),
    // not props.handLayout alone — resolveHandLayout would otherwise overwrite
    // GUI tweaks with mobileLandscape.handLayout and nothing would appear to change.
    const handLayoutGui = { ...resolveHandLayout(lastStyleWidth, lastStyleHeight) };
    const handLayoutControllers = [];
    const getMutableHandLayout = () => (
      isMobileLandscapeSize(
        lastStyleWidth,
        lastStyleHeight,
        props.mobileLandscape.maxHeight,
      )
        ? props.mobileLandscape.handLayout
        : props.handLayout
    );
    const syncHandLayout = () => {
      Object.assign(getMutableHandLayout(), handLayoutGui);
      applyResponsiveHandLayout();
    };
    refreshHandLayoutGui = () => {
      Object.assign(handLayoutGui, resolveHandLayout(lastStyleWidth, lastStyleHeight));
      for (const c of handLayoutControllers) c.updateDisplay();
    };
    handLayoutControllers.push(
      handGui.add(handLayoutGui, 'handY', -1, 0).step(0.01).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'handWidth', 0.2, 1.5).step(0.01).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'cardWidth', 0.05, 0.4).step(0.005).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'cardHeight', 0.05, 0.5).step(0.005).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'maxFanAngle', 0, 1).step(0.01).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'curveAmount', 0, 0.2).step(0.001).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'maxOverlap', 0, 0.9).step(0.01).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'minGap', 0.1, 1).step(0.01).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'hoverRaise', 0, 0.2).step(0.005).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'hoverScale', 1, 2).step(0.01).onChange(syncHandLayout),
      handGui.add(handLayoutGui, 'neighborPush', 0, 0.3).step(0.005).onChange(syncHandLayout),
    );

    gui.close();
    gui.hide();
  }

  return {
    resize(sketchProps) {
      lastStyleWidth = sketchProps.styleWidth;
      lastStyleHeight = sketchProps.styleHeight;
      if (uiWrapper) {
        uiWrapper.style.width = `${sketchProps.styleWidth}px`;
        uiWrapper.style.height = `${sketchProps.styleHeight}px`;
        // em base: 12px at design height 440; never grow past 12px on large desktops.
        const uiFont = Math.min(12, (sketchProps.styleHeight * 12) / 440);
        uiWrapper.style.fontSize = `${Math.max(9, uiFont)}px`;
      }

      const nextMobile = isMobileLandscapeSize(
        sketchProps.styleWidth,
        sketchProps.styleHeight,
        props.mobileLandscape.maxHeight,
      );
      if (mobileLandscapeActive !== nextMobile) {
        const wasUnset = mobileLandscapeActive == null;
        mobileLandscapeActive = nextMobile;
        applyResponsiveHandLayout();
        if (refreshHandLayoutGui) refreshHandLayoutGui();
        // Skip the first layout: MainCamera starts zoomed out and the intro
        // timeout owns the first move into INTRO view. Snapping here
        // (duration 0) cancelled that fade-in.
        if (!wasUnset) applyResponsiveCamera(0.45);
      } else {
        applyResponsiveHandLayout();
      }

      if (domCardRenderer) domCardRenderer.resize();
      renderer.resize(sketchProps);
      // Pass drawing-buffer size into OutlinePass (CSS size × pixelRatio).
      // updateStyle=false: canvas-sketch owns the canvas CSS size.
      composer.setSize(sketchProps.viewportWidth, sketchProps.viewportHeight, false);
      outlinePass.setPixelRatio(sketchProps.pixelRatio);
    },
    render(_props) {
      // renderer.update(props);
      composer.render();

      board.update(_props.time);
      pawnBoard.update();

      cardHand.update(_props.deltaTime);
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
}, {
  // fps: 15,
  // duration: 4,
  dimensions: [960, 540],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
