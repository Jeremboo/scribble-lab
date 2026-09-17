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
import props from './props';
import DOMRenderer from '../../../modules/Three/DOMRenderer.three';
import gsap from 'gsap';
import { CardHand, DropTarget, getHandSize } from '../_modules/cardEngine';
import DomCardRenderer from './DomCardRenderer';
import MovePreview from './MovePreview';
import RunStats from './RunStats';

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

  // DOM RENDERER
  const wrapper3d = document.getElementById('wrapper-3d');
  const domRenderer = new DOMRenderer(wrapper3d, renderer.camera);
  domRenderer.group.position.set(-props.boardWidth * 0.5 - 6, 0, -0.5);

  const composer = new EffectComposer(renderer);
  const outlinePass = new OutlinePass(renderer.scene, renderer.camera, {
    color: new Color(props.outlineColors[0]),
    thickness: 1,
  });
  // outlinePass.setDebugMode(true);
  composer.addPass(outlinePass);

  // Shared scene depth — own pass so fog / DOF / etc. can all call setDepthTexture.
  const depthPass = new DepthPass(renderer.scene, renderer.camera);
  composer.addPass(depthPass);

  const fogPass = new AtmosphereFogPass(renderer.camera, props);
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

  const pawnBoard = new BoardPawn({ x: board.pathX, y: board.pathY });
  renderer.add(pawnBoard.mesh);

  board.addPawn(pawnBoard);

  const animateCameraTarget = (cellNbr, duration = 1.5, delay = 0.25) => {
    const pos = new Vector3(
      0,
      board.getPathWorldY(cellNbr + props.boardHeight / 2),
      cellNbr
    );
    mainCamera.animateCameraTarget(
      pos,
      duration,
      delay,
    );
  };

  // Bake noise pathY once at init (pawn already placed on row 0).
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
  let endOfTurnTimer = null;
  let debugStatsRaf = 0;

  const runStats = new RunStats();
  const debugStatsEl = document.getElementById('run-stats-debug');
  const gameOverEl = document.getElementById('game-over');

  const updateStatsUi = (final = false) => {
    const snap = runStats.snapshot();
    const duration = final ? snap.durationMs : runStats.durationMs;
    const sectionsLabel = `${snap.sections}`;
    const cardsLabel = snap.cardsUsed
      ? `${snap.cardsUsed} · ${snap.cardsSummary}`
      : '0';
    const timeLabel = runStats.formatDuration(duration);
    const thinkLabel = runStats.formatThink(snap.averageThinkMs);
    const lootsLabel = `${snap.loots}`;

    if (props.debug && debugStatsEl) {
      document.getElementById('debug-sections').textContent = sectionsLabel;
      document.getElementById('debug-cards-used').textContent = String(snap.cardsUsed);
      document.getElementById('debug-time').textContent = timeLabel;
      document.getElementById('debug-think').textContent = thinkLabel;
      document.getElementById('debug-loots').textContent = lootsLabel;
      document.getElementById('debug-cards-list').textContent = snap.cardsSummary
        ? snap.cardsSummary
        : '';
    }

    if (final) {
      document.getElementById('go-sections').textContent =
        `${snap.sections} section${snap.sections === 1 ? '' : 's'}`;
      document.getElementById('go-cards').textContent = cardsLabel;
      document.getElementById('go-time').textContent = timeLabel;
      document.getElementById('go-think').textContent = thinkLabel;
      document.getElementById('go-loots').textContent = lootsLabel;
    }
  };

  const startDebugStatsLoop = () => {
    if (!props.debug || !debugStatsEl) return;
    debugStatsEl.classList.remove('hidden');
    debugStatsEl.setAttribute('aria-hidden', 'false');
    const tick = () => {
      if (!runStats.isRunning && isGameOver) {
        updateStatsUi(true);
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
    runStats.stop();
    clearTimeout(endOfTurnTimer);
    endOfTurnTimer = null;
    hideMovePreview();

    if (cardUiRoot) {
      cardUiRoot.classList.add('hidden');
      cardUiRoot.setAttribute('aria-hidden', 'true');
    }

    updateStatsUi(true);
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

  // ── Card hand prototype (renderer-agnostic engine + DOM renderer) ──
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
      const steps = card.type === 'move' ? Math.max(1, card.value | 0) : 1;
      advancePawn(steps);
      scheduleEndOfTurnCheck();
      updateStatsUi(false);
    },
    onCardDragStart: (card) => {
      if (isGameOver) return;
      showMovePreview(card);
    },
    onCardReturned: () => hideMovePreview(),
  });

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
    const steps = Math.max(1, card.value | 0);
    const targetY = pawnBoard.y + steps;
    // Do not ensureRow here — off-board landings only create rows / next
    // section when the card is actually played (advancePawn / animateAdvance).
    const fromCell = board.getCell(pawnBoard.x, pawnBoard.y);
    const toCell = board.getPathPreviewTarget(pawnBoard.x, targetY);
    if (!fromCell || !toCell) {
      hideMovePreview();
      return;
    }
    movePreview.show(fromCell, toCell);
    pawnBoard.setJumpPreview(true, { fromCell, toCell, progress: 1 / 5 });
  };

  const playZone = new DropTarget({
    id: 'play-zone',
    handSize: getHandSize(props.handLayout),
    // debug: props.debug,
    label: (card) => (
      card.type === 'move'
        ? `Move +${card.value}`
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

  const makeMoveCard = (value = 1 + Math.floor(Math.random() * 6)) => ({
    id: `c${nextCardId++}`,
    value,
    type: 'move',
  });

  const drawCards = (count) => {
    if (!count || count < 1) return 0;
    let drawn = 0;
    for (let i = 0; i < count; i++) {
      const data = deck.length ? deck.shift() : makeMoveCard();
      drawn += 1;
      pendingDrawAdds += 1;
      setTimeout(() => {
        // Always deliver rewarded cards even if a premature check raced;
        // only skip if the run already ended for real.
        if (!isGameOver) {
          cardHand.addCard(data);
        }
        pendingDrawAdds = Math.max(0, pendingDrawAdds - 1);
        if (pendingDrawAdds === 0 && endOfTurnTimer === null) {
          resolveEndOfTurn();
        }
      }, 150 * i);
    }
    return drawn;
  };

  const applyLoot = (loot) => {
    if (!loot) return;
    runStats.recordLoot();

    turnMayDraw = true;
    setTimeout(() => {
      drawCards(1);
    }, 500);
  };

  const advancePawn = (steps = 1) => {
    if (!isAnimatedIn || isGameOver || steps < 1) return;
    hideMovePreview();

    for (let i = 0; i < steps; i++) {
      board.removePawn(pawnBoard);
      pawnBoard.moveTo(1);

      if (pawnBoard.y >= board.startY + pendingAdvance + props.boardHeight - props.boardPadding) {
        animateAdvance(Math.floor(props.boardHeight - props.boardPadding - 1));
      }
      board.ensureRow(pawnBoard.y);
      board.addPawn(pawnBoard);
    }

    // Loot only on the card's final landing cell (not cells jumped over)
    applyLoot(board.collectLootAt(pawnBoard.x, pawnBoard.y));
  };

  const initCardHandUi = () => {
    if (domCardRenderer) return;
    cardUiRoot.classList.remove('hidden');
    cardUiRoot.setAttribute('aria-hidden', 'false');
    domCardRenderer = new DomCardRenderer({
      root: cardUiRoot,
      hand: cardHand,
      renderLabel: (card) => (card.value > 0 ? `+${card.value}` : String(card.value)),
    });

    deck = shuffle(props.deckCards.map((card) => ({ ...card })));
    nextCardId = deck.reduce((max, card) => {
      const n = parseInt(String(card.id).replace(/\D/g, ''), 10);
      return Number.isFinite(n) ? Math.max(max, n + 1) : max;
    }, 1);
    drawCards(props.startingHandSize);
  };

  const animateIn  = () => {
    mainCamera.animateCameraProps(props.inGameCameraProps);

    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    runStats.start();
    startDebugStatsLoop();
    updateStatsUi(false);

    setTimeout(() => {
      initCardHandUi();
    }, 500);

    setTimeout(() => {
      isAnimatedIn = true;
      pawnBoard.show();
      runStats.markTurnReady();
    }, 1000);
  }

  const animateAdvance = (steps) => {
    board.ensureRow(pawnBoard.y);
    grounds.onBoardAdvance();
    runStats.recordSection();
    updateStatsUi(false);

    turnMayDraw = true;
    setTimeout(() => {
      drawCards(3);
    }, 500);

    pendingAdvance += steps;
    animateCameraTarget(board.startY + pendingAdvance);

    const inOutDelay = 100;
    for (let i = 0; i < steps; i++) {
      const stepDelay = props.nextBoardDuration * i;

      // Remove row
      if (pawnBoard.y > board.startY + i) {
        setTimeout(() => {
          board.removeRowBehind();
        }, stepDelay);
      }

      // Add Row
      setTimeout(() => {
        board.addRowAhead();
        pendingAdvance -= 1;
      }, stepDelay + inOutDelay);
    }
  }

  // INTRO ANIMATION
  setTimeout(() => {
    mainCamera.animateCameraProps({
      y: props.initialCameraProps.y,
      distance: props.initialCameraProps.distance,
    }, 1.5);
    gsap.to(document.body.querySelectorAll('#home-page > *'), { autoAlpha: 1, duration: 0.5, y: 0, delay: 0.5, stagger: 0.15 });

    document.getElementById('start-button').addEventListener('click', () => {
      animateIn();
    });

    document.getElementById('restart-button').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('share-button').addEventListener('click', async () => {
      const text = runStats.formatShareText();
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
        const btn = document.getElementById('share-button');
        if (btn) {
          const prev = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = prev; }, 1600);
        }
      } catch (_) {
        window.prompt('Copy your run stats:', `${text}\n${window.location.href}`);
      }
    });
  }, 200);

  // * GUI *******

  if (props.debug) {
    const regenerateNoise = () => {
      board.regenerateNoise();
      grounds.syncFromProps();
      animateCameraTarget(board.startY);
    };

    const gui = new GUI();
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
    cameraGui.add(mainCamera.props, 'y', 0, 1.5).onChange(mainCamera.update).step(0.001);
    cameraGui.add(mainCamera.props, 'rotation', -Math.PI, Math.PI).onChange(mainCamera.update).step(0.001);
    cameraGui.add(mainCamera.props, 'distance', 0, 100).onChange(mainCamera.update).step(0.1);
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
    fogGui.add(props, 'fogNear', 0, 100).onChange((v) => {
      fogPass.setFogRange(v, props.fogFar);
    });
    fogGui.add(props, 'fogFar', 0, 100).onChange((v) => {
      fogPass.setFogRange(props.fogNear, v);
    });

    const handGui = gui.addFolder('hand layout');
    handGui.open();
    const syncHandLayout = () => {
      cardHand.setLayout(props.handLayout);
      if (domCardRenderer) {
        domCardRenderer.refreshCardSizes();
      }
    };
    handGui.add(props.handLayout, 'handY', -1, 0).step(0.01).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'handWidth', 0.2, 1.5).step(0.01).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'cardWidth', 0.05, 0.4).step(0.005).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'cardHeight', 0.05, 0.5).step(0.005).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'maxFanAngle', 0, 1).step(0.01).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'curveAmount', 0, 0.2).step(0.001).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'maxOverlap', 0, 0.9).step(0.01).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'minGap', 0.1, 1).step(0.01).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'hoverRaise', 0, 0.2).step(0.005).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'hoverScale', 1, 2).step(0.01).onChange(syncHandLayout);
    handGui.add(props.handLayout, 'neighborPush', 0, 0.3).step(0.005).onChange(syncHandLayout);

    gui.close();
  }

  return {
    resize(props) {
      wrapper3d.style.width = `${props.styleWidth}px`;
      wrapper3d.style.height = `${props.styleHeight}px`;
      domRenderer.resize(props);
      renderer.resize(props);
      // Pass drawing-buffer size into OutlinePass (CSS size × pixelRatio).
      // updateStyle=false: canvas-sketch owns the canvas CSS size.
      composer.setSize(props.viewportWidth, props.viewportHeight, false);
    },
    render(_props) {
      // renderer.update(props);
      composer.render();

      domRenderer._render();

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
  // dimensions: [2048, 2048],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
