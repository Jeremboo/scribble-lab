import {
  Mesh, ShaderMaterial, Color, BoxBufferGeometry
} from 'three';
import canvasSketch from 'canvas-sketch';
import glslify from 'glslify';
import { GUI } from 'dat.gui';

import Renderer from '../../../modules/Renderer.three';
import OrbitControls from '../../../modules/OrbitControls';

const PROPS = {
  speed: 0.03,
  mainColor: '#C9F0FF',
};

class CustomMesh extends Mesh {
  constructor() {
    const geometry = new BoxBufferGeometry(1, 1, 1);
    const material = new ShaderMaterial({
      wireframe: true,
      uniforms: {
        color: { value: new Color(PROPS.mainColor) }
      },
      fragmentShader: glslify(`
        uniform vec3 color;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(color * vec3(vUv, 1.0), 1.0);
        }
      `),
      vertexShader: glslify(`
        varying vec2 vUv;
        void main () {
          vUv = uv;
          vec3 transformed = position.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `),
    });
    super(geometry, material);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.x += PROPS.speed;
    this.rotation.y += PROPS.speed;
  }
}

canvasSketch(({ context }) => {
  const renderer = new Renderer({ canvas: context.canvas });
  const controls = new OrbitControls(renderer.camera, context.canvas);

  // * START *****
  const mesh = new CustomMesh();
  renderer.add(mesh);

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'speed', 0, 0.1);

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.resize(viewportWidth, viewportHeight);
    },
    render({ time, playhead }) {
      // rendere.scene.rotation.y = playhead * (Math.PI * 2);
      renderer.update();
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
}, {
  // fps: 30,
  // duration: 3,
  // scaleToView: true,
  // dimensions: [1024, 1024],
  animate: true,
  context: 'webgl',
});
