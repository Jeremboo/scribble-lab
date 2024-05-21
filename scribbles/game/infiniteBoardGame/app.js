import {
  MeshBasicMaterial,
  PlaneGeometry,
 Vector3,
 Mesh,
 AmbientLight,
 DirectionalLight
} from 'three';
import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import OrthographicRenderer from '../../../modules/OrthographicRenderer.three';
import Board from './Board';
import props from './props';

canvasSketch(({ context }) => {
  const renderer = new OrthographicRenderer({ canvas: context.canvas, zoom: props.boardHeight });
  renderer.setClearColor(props.bgColor, 1);

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
  directionalLight.position.set(10, 10, -4);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.top = 2;
  directionalLight.shadow.camera.bottom = - 2;
  directionalLight.shadow.camera.left = - 2;
  directionalLight.shadow.camera.right = 2;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 40;
  renderer.add(directionalLight);


  // * START *****
  const plane = new Mesh(new PlaneGeometry(props.boardHeight * 2, props.boardHeight * 2), new MeshBasicMaterial({
    // color: 0x00ffff
    color: props.bgColor
  }));
  plane.rotation.x = -Math.PI * 0.5;
  plane.position.y = 0;

  renderer.add(plane);

  const board = new Board(props.boardWidth, props.boardHeight);
  renderer.add(board.group);
  updateCameraPosition();


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
    },
    render(props) {
      renderer.update(props);
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
  dimensions: [1024, 1024],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
