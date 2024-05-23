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

//  https://www.freepik.com/free-vector/board-game-collection-isometric-design_10363610.htm
canvasSketch(({ context }) => {
  const renderer = new OrthographicRenderer({
    canvas: context.canvas,
    zoom: props.boardHeight,
    antialias: false,
    stencil: false,
    depth: false
  });
  renderer.setClearColor(props.bgColor, 1);

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
  const updateCameraPosition =  () => {
    const offsetY = props.cameraOffsetY - (props.boardWidth * 0.5);
    renderer.camera.position.set(Math.cos(angle) * 10, offsetY + props.cameraY, -Math.sin(angle) * -10);
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
  const plane = new OutlinableMesh(new PlaneBufferGeometry(props.boardHeight * 3, props.boardHeight * 3), new MeshBasicMaterial({
    // color: 0x00ffff
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
  updateCameraPosition();
  board.moveTo();

  document.addEventListener('click', () => {
      board.removePawn(pawnBoard);
      pawnBoard.moveTo(1);

      if (pawnBoard.y >= props.boardHeight) {
        const moveBack = Math.floor(props.boardHeight * 0.75);
        pawnBoard.moveTo(-moveBack);

        // HACK 2024-05-22 jeremboo: Move back the board elevation with delay
        for (let i = 0; i < moveBack; i++) {
          setTimeout(() => {
            board.moveTo(1);
          }, 20 * i);
        }
      }

      board.addPawn(pawnBoard);
  });

  // * GUI *******

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
  gui.add(props, 'cameraOffsetY', 0.01, 10).onChange(updateCameraPosition).step(0.001);
  gui.add(props, 'cameraY', 1, 10).onChange(updateCameraPosition).step(0.001);
  const lightGui = gui.addFolder('light');
  lightGui.add(directionalLight.position, 'x', -10, 10);
  lightGui.add(directionalLight.position, 'y', -10, 100);
  lightGui.add(directionalLight.position, 'z', -10, 10);

  return {
    resize(props) {
      renderer.resize(props);
      // composer.resize(props.viewportWidth, props.viewportHeight);
    },
    render(_props) {

      // renderer.update(props);
      composer.render();

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
