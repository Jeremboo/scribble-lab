import {
  AmbientLight,
  DirectionalLight,
  Color,
  Group,
  PCFSoftShadowMap,
  Vector3,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry
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
import Board from './Board';
import BoardPawn from './BoardPawn';
import Grounds from './Grounds';
import MainCamera from './MainCamera';
import props from './props';
import DOMRenderer from '../../../modules/Three/DOMRenderer.three';
import gsap from 'gsap';

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
  // renderer.setClearColor(props.bgColor, 1);

  const mainCamera = new MainCamera(renderer.camera);

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

  let pendingAdvance = 0;


  const animateIn  = () => {
    mainCamera.animateCameraProps(props.inGameCameraProps);

    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    setTimeout(() => {
      isAnimatedIn = true;
      pawnBoard.show();
    }, 450);
  }

  const animateAdvance = (steps) => {
    board.ensureRow(pawnBoard.y);
    grounds.onBoardAdvance();
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
