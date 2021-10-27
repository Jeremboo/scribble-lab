import canvasSketch from 'canvas-sketch';
import { TweenLite } from 'gsap';
import dat, { GUI } from 'dat.gui';
import imageController from './dat.gui.image';
imageController(dat);

import Mesh from '../../../modules/WebGL/Mesh';
import Camera from '../../../modules/WebGL/Camera';
import Renderer from '../../../modules/WebGL/Renderer';
import Texture from '../../../modules/WebGL/Texture';
import { createPlane } from '../../../utils/webgl';
import { radians } from '../../../utils';

// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

const PROPS = {
  intensity: 2,
  texture: './texture.png',
  speed: 0.5,
};

const VERTEX = `
  uniform sampler2D texture;
  uniform float intensity;

  varying vec2 vUv;
  varying vec4 vTexture;

  void main() {
    vUv = position.xy + 0.5;
    vUv.y = 1.0 - vUv.y;
    vec4 img = texture2D(texture, vUv);
    vTexture = img;

    vec4 mvPosition = modelMatrix * position;
    mvPosition.z += img.x * intensity - (intensity * 0.5);

    gl_Position = viewProjectionMatrix * mvPosition;
  }
`;

const FRAGMENT = `
  precision mediump float;
  uniform sampler2D texture;

  varying vec2 vUv;
  varying vec4 vTexture;

  void main() {
    vec4 img = texture2D(texture, vUv);
    gl_FragColor = img;
  }
`;

canvasSketch(({ width, height, styleWidth, styleHeight, context, canvas }) => {
  // * Camera
  const camera = new Camera(45, width / height, 1, 1000);
  camera.setPosition(0, 0, 2);

  // * Renderer
  const renderer = new Renderer(context);

  // * Texture
  const planeTexture = new Texture(context, PROPS.texture, {});

  const planeGeometry = createPlane(2, 2, 1, 1);

  // * Mesh
  // TODO 2020-06-23 jeremboo: add custom position
  // TODO 2020-06-23 jeremboo: DoubleSide?
  const plane = new Mesh(context, camera, {
    geometry: planeGeometry,
    vertex: VERTEX,
    fragment: FRAGMENT,
    uniforms: {
      texture: planeTexture,
      intensity: PROPS.intensity
    }
  });
  plane.translate(0.1, -0.05, -1.5);
  plane.rotateY(radians(30));
  renderer.addProgram(plane.program);

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'intensity', -10, 10)
  .onChange(value => {
    plane.program.uniforms.intensity.value = value;
    // plane.program.forceUpdateUniform('intensity', value);
  })
  .listen();

  gui
  .addImage(PROPS, 'texture')
  .name('super texture')
  .listen()
  .onChange((image, firstTime) => {
    if (firstTime) return;
    TweenLite.to(plane.program.uniforms.intensity, 0.3, {
      value: 0,
      ease: Power2.easeIn,
      onUpdate: () => {
        PROPS.intensity = plane.program.uniforms.intensity.value;
      },
      onComplete: () => {
        plane.program.uniforms.texture.value.needsUpdate = true;
        plane.program.uniforms.texture.value.image = image;

        TweenLite.to(plane.program.uniforms.intensity, 0.5, {
          value: 2,
          ease: Power2.easeOut,
          onUpdate: () => {
            PROPS.intensity = plane.program.uniforms.intensity.value;
          }
        });
      }
    });
  });

  return ({
    resize() {
      context.viewport(0, 0, canvas.width, canvas.height);
      context.clearColor(1, 1, 1, 1);
      context.clear(context.COLOR_BUFFER_BIT);
    },
    render({ context, playhead }) {
      renderer.render();
    }
  });
}, {
  fps: 15,
  duration: 4,
  dimensions: [1024, 1024],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});