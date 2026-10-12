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
import { ensurePlayer, submitRun } from './Analytics';
import { applyBoardCellTheme } from './BoardCell';
import { GameController, GameEvents, EndReason, getSectionTriggerOffset } from './game';

const GAME_OVER_COPY = {
  [EndReason.EMPTY_HAND]: {
    title: 'Game over',
    subtitle: 'No cards left',
  },
  [EndReason.FORBIDDEN]: {
    title: 'Game over',
    subtitle: 'You fall in the void',
  },
};

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
  const game = new GameController({ startPawnY: START_PAWN_Y });
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

  let isAnimatedIn = false;
  let gameState = GameState.INTRO;
  /** View-only input lock while section / card presentation animates. */
  let viewBusy = false;
  /** Bumped on restart / game-over so stale view timeouts no-op. */
  let runId = 0;
  let lastStyleWidth = 0;
  let lastStyleHeight = 0;
  let mobileLandscapeActive = null;
  /** Keeps dat.GUI hand sliders aligned with the active desktop/mobile preset. */
  let refreshHandLayoutGui = null;
  let unlockTimer = null;

  const runStats = game.stats;
  const debugStatsEl = document.getElementById('run-stats-debug');
  const gameOverEl = document.getElementById('game-over');
  const gameOverTitleEl = document.getElementById('game-over-title');
  const gameOverSubtitleEl = document.getElementById('game-over-subtitle');
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
      if (game.phase === 'gameOver') {
        updateStatsUi(true, lastBestInfo);
        return;
      }
      updateStatsUi(false);
      debugStatsRaf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(debugStatsRaf);
    debugStatsRaf = requestAnimationFrame(tick);
  };

  let debugStatsRaf = 0;

  const setViewBusy = (busy) => {
    viewBusy = !!busy;
  };

  /** If a drag is in progress, rebuild the move preview (e.g. after section unlock). */
  const refreshDragPreviewIfNeeded = () => {
    if (!cardHand || !cardHand.draggingCardId) return;
    const card = cardHand.getCard(cardHand.draggingCardId);
    if (card) showMovePreview(card);
  };

  const scheduleViewUnlock = (delayMs) => {
    clearTimeout(unlockTimer);
    const id = runId;
    unlockTimer = setTimeout(() => {
      if (id !== runId) return;
      setViewBusy(false);
      unlockTimer = null;
      refreshDragPreviewIfNeeded();
    }, Math.max(0, delayMs));
  };

  const syncPawnMesh = () => {
    pawnBoard.x = game.pawn.x;
    pawnBoard.y = game.pawn.y;
    const cell = board.getCell(pawnBoard.x, pawnBoard.y);
    if (cell) {
      board.addPawn(pawnBoard);
      pawnBoard.applyRulesFromCellLanded(cell);
    } else {
      const preview = board.getPathPreviewTarget(pawnBoard.x, pawnBoard.y);
      pawnBoard.applyRulesFromCellLanded(preview);
    }
  };

  const presentGameOver = (endReason = EndReason.EMPTY_HAND) => {
    runId += 1;
    setViewBusy(false);
    clearTimeout(unlockTimer);
    unlockTimer = null;
    hideMovePreview();
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

    const copy = GAME_OVER_COPY[endReason] || GAME_OVER_COPY[EndReason.EMPTY_HAND];
    if (gameOverTitleEl) gameOverTitleEl.textContent = copy.title;
    if (gameOverSubtitleEl) gameOverSubtitleEl.textContent = copy.subtitle;

    updateStatsUi(true, lastBestInfo);
    if (gameOverEl) {
      gameOverEl.classList.remove('hidden');
      gameOverEl.setAttribute('aria-hidden', 'false');
    }
  };

  // ── Card hand (renderer-agnostic engine + DomCardRenderer) ──
  const cardUiRoot = document.getElementById('card-ui');
  let domCardRenderer = null;

  const cardHand = new CardHand({
    layout: props.handLayout,
    onCardPlayed: (card) => {
      if (!isAnimatedIn || game.phase !== 'playing') {
        // CardHand already removed it — put it back if the play is rejected.
        if (card && card.data) cardHand.addCard(card.data, { animate: false });
        else if (card) cardHand.addCard(card, { animate: false });
        return;
      }
      hideMovePreview();
      const result = game.playCard(card);
      if (!result) {
        if (card && card.data) cardHand.addCard(card.data, { animate: false });
        else if (card) cardHand.addCard(card, { animate: false });
        return;
      }
      syncPawnMesh();
      if (result.section) {
        setViewBusy(true);
      }
    },
    onCardDragStart: (card) => {
      if (!isAnimatedIn || game.phase !== 'playing') return;
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
    const landing = game.getMoveLanding(card);
    if (!landing) {
      hideMovePreview();
      return;
    }
    // Prefer live cells; fall back to stand-ins while section rows are still rising.
    const fromCell = board.getCell(landing.x, landing.fromY)
      || board.getPathPreviewTarget(landing.x, landing.fromY);
    const toCell = board.getPathPreviewTarget(landing.x, landing.toY);
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
    label: (card) => (
      card.type === 'move'
        ? `Move ${formatMoveLabel(card.value)}`
        : `Play ${card.type}`
    ),
    canAccept: () => isAnimatedIn && game.phase === 'playing',
  });
  cardHand.addDropTarget(playZone);

  /**
   * Present granted cards in the DOM hand after an optional delay,
   * then staggered. Each card becomes playable as soon as it is added.
   */
  const presentHandCards = (cards, { delay = 0, staggerMs = 175 } = {}) => {
    if (!cards || !cards.length) return;
    const id = runId;
    const start = () => {
      if (id !== runId) return;
      cards.forEach((data, i) => {
        const add = () => {
          if (id !== runId || game.phase === 'gameOver') return;
          cardHand.addCard(data);
        };
        if (i === 0 || staggerMs <= 0) add();
        else setTimeout(add, staggerMs * i);
      });
    };
    if (delay > 0) setTimeout(start, delay);
    else start();
  };

  const presentSectionAdvance = (section) => {
    if (!section) return;
    const id = runId;
    grounds.onBoardAdvance();

    const {
      steps,
      targetStartY,
      rowsToAdd,
      sectionCards,
      lootPlan,
      lootPlanFlags,
      forbiddenPlan,
      forbiddenPlanFlags,
    } = section;

    presentHandCards(sectionCards, { delay: 500, staggerMs: 200 });
    animateCameraTarget(targetStartY);
    board.fadeAdvanceIconsBelow(targetStartY + getSectionTriggerOffset());
    board.spawnLootsAtYs(lootPlan);
    board.markForbiddenAtYs(forbiddenPlan);

    for (let i = 0; i < steps; i++) {
      const stepDelay = props.cellCreationStagger * i;
      setTimeout(() => {
        if (id !== runId) return;
        if (board.startY < targetStartY) {
          board.removeRowBehind();
        }
      }, stepDelay);
    }

    for (let i = 0; i < rowsToAdd; i++) {
      const stepDelay = props.cellCreationStagger * i;
      setTimeout(() => {
        if (id !== runId) return;
        const y = board.grid.column;
        const flag = (lootPlanFlags && lootPlanFlags[i]) || false;
        const forbidden = !!(forbiddenPlanFlags && forbiddenPlanFlags[i]);
        board.addRowAhead(flag, forbidden);
        if (y === game.pawn.y) {
          syncPawnMesh();
          refreshDragPreviewIfNeeded();
        }
      }, stepDelay + 250);
    }

    const unlockAfter = props.cellCreationStagger * Math.max(steps, rowsToAdd) + 250 + 80;
    scheduleViewUnlock(unlockAfter);
  };

  const fadeInCardHandVeil = () => {
    if (!cardUiRoot) return;
    cardUiRoot.classList.remove('card-hand-veil-on');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cardUiRoot.classList.contains('hidden')) return;
        cardUiRoot.classList.add('card-hand-veil-on');
      });
    });
  };

  const ensureDomCardRenderer = () => {
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
  };

  const beginRunPresentation = ({ opening, lootPlan, forbiddenPlan }) => {
    ensureDomCardRenderer();
    cardHand.setCards([]);
    board.spawnLootsAtYs(lootPlan);
    board.markForbiddenAtYs(forbiddenPlan);
    presentHandCards(opening);
  };

  // Controller → view bindings
  game.on(GameEvents.RUN_STARTED, ({ opening, lootPlan, forbiddenPlan, snapshot }) => {
    lastBestInfo = null;
    beginRunPresentation({ opening, lootPlan, forbiddenPlan });
    updateStatsUi(false);
  });

  game.on(GameEvents.SECTION_ADVANCED, (payload) => {
    presentSectionAdvance(payload);
    updateStatsUi(false);
  });

  game.on(GameEvents.PAWN_MOVED, () => {
    syncPawnMesh();
  });

  game.on(GameEvents.LOOT_COLLECTED, ({ loot }) => {
    if (!loot) return;
    board.collectLootAt(loot.x, loot.y);
  });

  game.on(GameEvents.HAND_CHANGED, ({ added, reason }) => {
    // Opening is presented from RUN_STARTED; section cards from presentSectionAdvance.
    if (reason === 'opening' || reason === 'section') return;
    presentHandCards(added, { delay: 250 });
  });

  game.on(GameEvents.STATS_CHANGED, ({ snapshot }) => {
    if (snapshot && snapshot.phase === 'gameOver') {
      updateStatsUi(true, snapshot.lastBest || lastBestInfo);
    } else {
      updateStatsUi(false);
    }
  });

  game.on(GameEvents.GAME_OVER, ({ lastBest, endReason, snapshot }) => {
    lastBestInfo = lastBest || (snapshot && snapshot.lastBest) || null;
    submitRun(runStats.snapshot(), { isNewBest: !!(lastBestInfo && lastBestInfo.isNewBest) });
    presentGameOver(endReason || (snapshot && snapshot.endReason) || EndReason.EMPTY_HAND);
  });

  const resetWorldForNewRun = () => {
    hideMovePreview();
    board.removePawn(pawnBoard);

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
    board.fadeAdvanceIconsBelow(resumeY + getSectionTriggerOffset(), 0);

    pawnBoard.x = board.pathX;
    pawnBoard.y = resumeY;
    pawnBoard.setJumpPreview(false);
    pawnBoard.ampl = 0;
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
    return resumeY;
  };

  const restartGame = () => {
    if (game.phase !== 'gameOver') return;

    runId += 1;
    isAnimatedIn = false;
    setViewBusy(false);
    clearTimeout(unlockTimer);
    unlockTimer = null;

    if (gameOverEl) {
      gameOverEl.classList.add('hidden');
      gameOverEl.setAttribute('aria-hidden', 'true');
    }

    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    const resumeY = resetWorldForNewRun();

    lastBestInfo = null;
    collapseStatsDetails();
    startDebugStatsLoop();

    setTimeout(() => {
      game.restartRun({ resumeY, pathX: board.pathX });
    }, 200);

    setTimeout(() => {
      isAnimatedIn = true;
      pawnBoard.show();
      updateStatsUi(false);
    }, 500);
  };

  const animateIn = () => {
    applyView(GameState.IN_GAME, { cameraDuration: 3 });

    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    lastBestInfo = null;
    collapseStatsDetails();
    startDebugStatsLoop();
    updateStatsUi(false);

    setTimeout(() => {
      game.startRun({ pathX: board.pathX });
      // Keep visual pawn aligned with logical start.
      syncPawnMesh();
    }, 500);

    setTimeout(() => {
      isAnimatedIn = true;
    }, 1000);
  };

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
