import {
  Vector3,
  AmbientLight,
  DirectionalLight,
  Color,
  Group,
  PCFSoftShadowMap
} from 'three';

import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import {
  EffectComposer
} from 'postprocessing';

import OrthographicRenderer from '../../../modules/OrthographicRenderer.three';
import OutlinePass from '../../../modules/Three/OutlinePass';
import Board from './Board';
import BoardPawn from './BoardPawn';
import Grounds from './Grounds';
import props from './props';
import DOMRenderer from '../../../modules/Three/DOMRenderer.three';
import gsap from 'gsap';

//  https://www.freepik.com/free-vector/board-game-collection-isometric-design_10363610.htm
canvasSketch(({ context }) => {
  let targetedZoom = props.cameraZoomOut;
  let currentZoom = props.cameraZoomOut * 2;
  const renderer = new OrthographicRenderer({
    canvas: context.canvas,
    zoom: currentZoom,
    antialias: false,
    stencil: false,
    depth: true
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  // renderer.setClearColor(props.bgColor, 1);

  // DOM RENDERER
  const wrapper3d = document.getElementById('wrapper-3d');
  const domRenderer = new DOMRenderer(wrapper3d, renderer.camera);
  domRenderer.group.position.set(-props.boardWidth * 0.5 - 6, 0, -0.5);

  const composer = new EffectComposer(renderer);
  const outlinePass = new OutlinePass(renderer.scene, renderer.camera, {
    color: new Color(props.outlineColor),
    thickness: 1,
  });
  // outlinePass.setDebugMode(true);
  composer.addPass(outlinePass);


  // TODO 2024-05-21 jeremboo: Add antilaliasing
  // https://github.com/pmndrs/postprocessing/blob/main/demo/src/demos/OutlineDemo.js
  // if (DPR.antialiasing) {
    // const AApass = new SMAAPass(
    //   window.innerWidth * window.devicePixelRatio,
    //   window.innerHeight * window.devicePixelRatio
    // );
    // const effect = new SMAAEffect();
    // console.log('effect', effect);
    // const SMAAPass = new EffectPass(_camera, effect);
    // console.log('SMAAPass', SMAAPass);
    // SMAAPass.renderToScreen = true;
    // composer.addPass(SMAAPass);
  // }


  let angle = -Math.PI * 0.75;

  // Camera position (fixed look target — scroll the board instead so DOM UI stays put)
  let targetedCameraY = props.initialCameraY;
  let currentCameraY = targetedCameraY;
  let targetedCameraOffsetY = props.initialCameraOffsetY;
  let currentCameraOffsetY = targetedCameraOffsetY;
  let targetedHillY = 0;
  let currentHillY = 0;
  const updateCameraPosition = (camY = currentCameraY, camOffsetY = currentCameraOffsetY, hillY = currentHillY) => {
    const offsetY = camOffsetY - (props.boardWidth * 0.01) + hillY;
    const dist = 40; // orbit camera distance
    // Scale height with distance so the viewing angle stays the same as when dist was 20
    const elev = camY * (dist / 20);
    renderer.camera.position.set(Math.cos(angle) * dist, offsetY + elev, Math.sin(angle) * dist);
    renderer.camera.lookAt(new Vector3(0, offsetY, 0));
  }

  // Board scroll (moves world under the fixed camera)
  let targetedScrollZ = 0;
  let currentScrollZ = 0;
  const scrollGroup = new Group();
  renderer.add(scrollGroup);

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
  scrollGroup.add(board.group);

  const pawnBoard = new BoardPawn({ x: board.pathX, y: board.pathY });
  scrollGroup.add(pawnBoard.mesh);

  board.addPawn(pawnBoard);

  // Bake noise pathY once at init (pawn already placed on row 0).
  // Doing this in animateIn used to snap the heightfield; with the diagonal
  // camera that read as a lateral jump on the ground.
  board.moveTo();
  const grounds = new Grounds(scrollGroup);
  grounds.setPathY(board.pathY);

  updateCameraPosition(props.initialCameraY, props.initialCameraOffsetY);

  let pendingAdvance = 0;

  const updateCameraHillFromBoard = (extraSteps = 0) => {
    const midY = board.startY + pendingAdvance + extraSteps + Math.floor(props.boardHeight * 0.5);
    targetedHillY = board.getPathHillY(midY);
  };

  const animateIn  = () => {
    targetedCameraOffsetY = props.cameraOffsetY;
    targetedCameraY = props.cameraY;
    updateCameraHillFromBoard();

    targetedZoom = props.cameraZoom;

    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    setTimeout(() => {
      isAnimatedIn = true;
      pawnBoard.show();
    }, 450);
  }

  const animateAdvance = (steps) => {
    board.ensureRow(pawnBoard.y);
    updateCameraHillFromBoard(steps);
    pendingAdvance += steps;

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
        targetedScrollZ -= 1;
        pendingAdvance -= 1;
      }, stepDelay + inOutDelay);
    }
  }

  setTimeout(() => {
    // INTRO
    gsap.to(document.body.querySelectorAll('#home-page > *'), { autoAlpha: 1, duration: 0.5, y: 0, delay: 0.5, stagger: 0.15 });

    document.getElementById('start-button').addEventListener('click', () => {
      animateIn();
    });
  }, 200);

  let isAnimatedIn = false;

  document.body.addEventListener('click', () => {
    if (!isAnimatedIn) return;

    // Move the pawn
    board.removePawn(pawnBoard);
    pawnBoard.moveTo(1);
    // Advance before the pawn reaches the last cells
    if (pawnBoard.y >= board.startY + pendingAdvance + props.boardHeight - props.boardPadding) {
      animateAdvance(Math.floor(props.boardHeight - props.boardPadding - 1));
    }
    board.ensureRow(pawnBoard.y);
    board.addPawn(pawnBoard);

    const loot = board.collectLootAt(pawnBoard.x, pawnBoard.y);
    if (!loot) return;

    if (loot.effect === 'path') {
      board.changeColorPath(loot.color, 0.333);
      board.setAppliedColor('path', loot.color);
    } else if (loot.effect === 'pawn') {
      pawnBoard.changeColor(loot.color, 0.333);
      board.setAppliedColor('pawn', loot.color);
    }
  });

  // * GUI *******

  if (props.debug) {
    const regenerateNoise = () => {
      board.regenerateNoise();
      grounds.syncFromProps();
      updateCameraHillFromBoard();
    };

    const regenerateCamera = () => {
      updateCameraPosition();
      regenerateNoise();
    };

    const gui = new GUI();
    gui.add(props, 'noiseX', -50, 50).onChange(regenerateNoise);
    gui.add(props, 'noiseY', -50, 50).onChange(regenerateNoise);
    gui.add(props, 'noiseScaleX', 0.01, 1).onChange(regenerateNoise);
    gui.add(props, 'noiseScaleY', 0.01, 1).onChange(regenerateNoise);
    gui.add(props, 'noiseAmpl', 1, 10).onChange(regenerateNoise);
    gui.add(props, 'noisePathElevation', 0.01, 1).onChange(regenerateCamera);
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
    gui.add(props, 'cameraOffsetY', 0.01, 10).onChange(() => {
      targetedCameraOffsetY = props.cameraOffsetY;
    }).step(0.001);
    gui.add(props, 'cameraY', 1, 30).onChange(() => {
      targetedCameraY = props.cameraY;
    }).step(0.001);
    gui.add(props, 'cameraZoom', 5, 60).onChange(() => {
      targetedZoom = props.cameraZoom;
    }).step(0.1);
    const lightGui = gui.addFolder('light');
    lightGui.add(directionalLight.position, 'x', -10, 10);
    lightGui.add(directionalLight.position, 'y', -10, 100);
    lightGui.add(directionalLight.position, 'z', -10, 10);
  }

  return {
    resize(props) {
      wrapper3d.style.width = `${props.styleWidth}px`;
      wrapper3d.style.height = `${props.styleHeight}px`;
      domRenderer.resize(props);
      renderer.resize(props);

      // composer.resize(props.viewportWidth, props.viewportHeight);
    },
    render(_props) {

      // camera update
      const fCamera = (targetedCameraY - currentCameraY);
      let updateCam = false;
      if (Math.abs(fCamera) > 0.01) {
        currentCameraY += fCamera * props.velocity * 0.5;
        updateCam = true;
      }

      const fCOffset = targetedCameraOffsetY - currentCameraOffsetY;
      if (Math.abs(fCOffset) > 0.01) {
        updateCam = true;
        currentCameraOffsetY += fCOffset * props.velocity * 0.5;
      }

      const fHillY = targetedHillY - currentHillY;
      if (Math.abs(fHillY) > 0.01) {
        updateCam = true;
        currentHillY += fHillY * props.velocity * 0.15;
      }

      if (updateCam) {
        updateCameraPosition();
      }

      const fScrollZ = targetedScrollZ - currentScrollZ;
      if (Math.abs(fScrollZ) > 0.01) {
        currentScrollZ += fScrollZ * props.velocity * 0.25;
        scrollGroup.position.z = currentScrollZ;
        grounds.update(currentScrollZ);
      }

      const fZoom = targetedZoom - currentZoom;
      if (Math.abs(fZoom) > 0.01) {
        currentZoom += (fZoom) * props.velocity * 0.5;
        renderer.setZoom(currentZoom);
      }

      // renderer.update(props);
      composer.render();

      domRenderer._render();

      board.update(_props.time);
      pawnBoard.update();

      if (props.rotationSpeed > 0) {
        angle += props.rotationSpeed;
        updateCameraPosition();
      }
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
}, {
  // fps: 15,
  // duration: 4,
  dimensions: [2048, 2048],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
