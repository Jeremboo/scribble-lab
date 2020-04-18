import {
  Mesh, ShaderMaterial, Color, BoxBufferGeometry
} from 'three';
import canvasSketch from 'canvas-sketch';
import glslify from 'glslify';
import { GUI } from 'dat.gui';

import Renderer from '../../../modules/Renderer.three';
import OrbitControls from '../../../modules/OrbitControls';

const PROPS = {
  speed: 1,
  mainColor: '#C9F0FF',
  bgColor: '#ffffff',
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

  update({ playhead }) {
    this.rotation.x = playhead * (Math.PI * 2) * PROPS.speed;
    this.rotation.y = playhead * (Math.PI * 2) * PROPS.speed;
  }
}

canvasSketch(({ context }) => {
  const renderer = new Renderer({ canvas: context.canvas });
  renderer.setClearColor(PROPS.bgColor, 1);
  const controls = new OrbitControls(renderer.camera, context.canvas);

  // * START *****
  const mesh = new CustomMesh();
  renderer.add(mesh);

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'speed', 1, 10);

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.resize(viewportWidth, viewportHeight);
    },
    render(props) {
      renderer.update(props);
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
}, {
  fps: 24,
  duration: 4,
  dimensions: [1024, 1024],
  // scaleToView: true,
  animate: true,
  context: 'webgl',
});
