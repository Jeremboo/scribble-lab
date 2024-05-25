import {
  MeshBasicMaterial,
 Vector3,
 AmbientLight,
 DirectionalLight,
 PlaneBufferGeometry,
 Color
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
import props from './props';
import OutlinableMesh from '../../../modules/Three/OutlinePass/OutlinableMesh';
import DOMRenderer from '../../../modules/Three/DOMRenderer.three';

//  https://www.freepik.com/free-vector/board-game-collection-isometric-design_10363610.htm
canvasSketch(({ context }) => {
  let targetedZoom = props.cameraZoomOut;
  let currentZoom = targetedZoom;
  const renderer = new OrthographicRenderer({
    canvas: context.canvas,
    zoom: currentZoom,
    antialias: false,
    stencil: false,
    depth: false
  });
  // renderer.setClearColor(props.bgColor, 1);

  // DOM RENDERER
  const wrapper3d = document.getElementById('wrapper-3d');
  const domRenderer = new DOMRenderer(wrapper3d, renderer.camera);
  domRenderer.group.position.set(-props.boardWidth * 0.5 - 6, 0, -0.5);

  const composer = new EffectComposer(renderer);
  const outlinePass = new OutlinePass(renderer.scene, renderer.camera, {
    color: new Color(props.outlineColor),
    thickness: 2,
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

  // Camera position
  let targetedCameraY = props.initialCameraY;
  let currentCameraY = targetedCameraY;
  let targetedCameraOffsetY = props.initialCameraOffsetY;
  let currentCameraOffsetY = targetedCameraOffsetY;
  const updateCameraPosition =  (camY = currentCameraY, camOffsetY = currentCameraOffsetY) => {
    const offsetY = camOffsetY - (props.boardWidth * 0.5);
    renderer.camera.position.set(Math.cos(angle) * 20, offsetY + camY, -Math.sin(angle) * -20);
    renderer.camera.lookAt(new Vector3(0, offsetY, 0));
  }

  // light
  const ambientLight = new AmbientLight(0xffffff, 0.5);
  renderer.add(ambientLight);
  const directionalLight = new DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(-10, 23, -7);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.top = 2;
  directionalLight.shadow.camera.bottom = - 2;
  directionalLight.shadow.camera.left = - 2;
  directionalLight.shadow.camera.right = 2;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 40;
  renderer.add(directionalLight);


  // * START *****
  const plane = new OutlinableMesh(new PlaneBufferGeometry(props.boardHeight * 5, props.boardHeight * 5), new MeshBasicMaterial({
    color: props.bgColor
  }));
  plane.rotation.x = -Math.PI * 0.5;
  plane.position.y = 0;

  renderer.add(plane);

  const board = new Board(props.boardWidth, props.boardHeight);
  renderer.add(board.group);

  const pawnBoard = new BoardPawn({ x: board.pathX, y: board.pathY });
  renderer.add(pawnBoard.mesh);

  board.addPawn(pawnBoard);
  updateCameraPosition(props.initialCameraY, props.initialCameraOffsetY);

  const animateIn  = () => {
    board.moveTo();
    targetedCameraOffsetY = props.cameraOffsetY;
    targetedCameraY = props.cameraY;

    targetedZoom = props.boardHeight + 0.5;

    document.getElementById('home-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');

    setTimeout(() => {
      isAnimatedIn = true;
      pawnBoard.show();
    }, 450);
  }

  const animateOut = () => {
    props.velocity *= 0.2;
    props.rotationSpeed = 0.002;
    targetedZoom = props.cameraZoomOut;

    document.getElementById('game-page').classList.add('hidden');
    document.getElementById('end-page').classList.remove('hidden');
  }

  const animateMoveBack = (moveBack) => {
    pawnBoard.moveTo(-moveBack);

      // HACK 2024-05-22 jeremboo: Move back the board elevation with delay
      for (let i = 0; i < moveBack; i++) {
        setTimeout(() => {
          board.moveTo(1);
        }, 20 * i);
      }
  }

  setTimeout(() => {
    document.getElementById('start-button').addEventListener('click', () => {
      animateIn();
    });
  }, 200);

  let count = 0;
  let isAnimatedIn = false, isAnimatedOut = false;
  let colorPathIdx = 0, colorPawnIdx = 0;
  let isBtn1Unlocked = false, isBtn2Unlocked = false, isBtn3Unlocked = false;
  document.body.addEventListener('click', () => {
    if (!isAnimatedIn) return;
    count ++;

    // End
    if (count > props.maxCount) {
      if (!isAnimatedOut) {
        isAnimatedOut = true;
        animateOut();
        board.removePawn(pawnBoard);
        animateMoveBack(Math.floor(props.boardHeight * 0.5))
        board.addPawn(pawnBoard);
      }
      return;
    }

    // Move the pawn
    board.removePawn(pawnBoard);
    pawnBoard.moveTo(1);
    if (pawnBoard.y >= props.boardHeight) {
      animateMoveBack(Math.floor(props.boardHeight * 0.75))
    }
    board.addPawn(pawnBoard);

    const progress = count / props.maxCount;
    const unlock = progress * 6;
    if (unlock > 1 && !isBtn1Unlocked) {
      isBtn1Unlocked = true;
      document.getElementById('button-1').classList.remove('disabled');
      document.getElementById('button-1').addEventListener('click', (e) => {
        colorPathIdx = (colorPathIdx + 1) % 4;
        board.changeColorPath(props.pathColors[colorPathIdx]);
        e.stopPropagation();
      });
    } else if (unlock > 3 && !isBtn2Unlocked) {
      isBtn2Unlocked = true;
      document.getElementById('button-2').classList.remove('disabled');
      document.getElementById('button-2').addEventListener('click', () => {
        colorPawnIdx = (colorPawnIdx + 1) % 4;
        pawnBoard.changeColor(props.pawnColors[colorPawnIdx]);
        e.stopPropagation();
      });
    } else if (unlock > 5 && !isBtn3Unlocked) {
      isBtn3Unlocked = true;
      document.getElementById('button-3').classList.remove('disabled');
      document.getElementById('button-3').addEventListener('click', () => {
        props.noisePathElevation = Math.random();
        props.noiseAmpl = Math.random() * 10;
        board.regenerateNoise();
        e.stopPropagation();
      });
    }
    document.getElementById('bar').style.transform = `scaleX(${progress})`;
  });

  // * GUI *******

  if (props.debug) {
    const regenerateCamera = () => {
      updateCameraPosition();
      board.regenerateNoise();
    };

    const gui = new GUI();
    gui.add(props, 'noiseX', -5, 5).onChange(board.regenerateNoise);
    gui.add(props, 'noiseY', -5, 5).onChange(board.regenerateNoise);
    gui.add(props, 'noiseScaleX', 0.01, 1).onChange(board.regenerateNoise);
    gui.add(props, 'noiseScaleY', 0.01, 1).onChange(board.regenerateNoise);
    gui.add(props, 'noiseAmpl', 1, 10).onChange(board.regenerateNoise);
    gui.add(props, 'noisePathElevation', 0.01, 1).onChange(regenerateCamera);
    gui.add(props, 'cameraOffsetY', 0.01, 10).onChange(() => {
      targetedCameraOffsetY = props.cameraOffsetY;
    }).step(0.001);
    gui.add(props, 'cameraY', 1, 30).onChange(() => {
      targetedCameraY = props.cameraY;
    }).step(0.001);
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

      if (updateCam) {
        updateCameraPosition();
      }

      const fZoom = targetedZoom - currentZoom;
      if (Math.abs(fZoom) > 0.01) {
        currentZoom += (fZoom) * props.velocity * 0.5;
        renderer.setZoom(currentZoom);
      }

      // renderer.update(props);
      composer.render();

      domRenderer._render();

      board.update();
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
  fps: 15, // 24
  duration: 4,
  dimensions: [2048, 2048],
  // scaleToView: true,
  animate: true,
  context: 'webgl',
});
