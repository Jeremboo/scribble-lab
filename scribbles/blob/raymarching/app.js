import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading,
} from 'three';

import rm from 'RayMarcher';
import { GUI } from 'dat-gui';

import blobFrag from './shaders/blob.f.glsl';

/**
 * DOCS
 *
 * Nicoptere :
 * - http://barradeau.com/blog/?p=575
 * - https://github.com/nicoptere/raymarching-for-THREE
 *
 * Inigo Quillez :
 * - http://iquilezles.org/www/articles/distfunctions/distfunctions.htm
 * - http://iquilezles.org/www/articles/smin/smin.htm
 * - http://iquilezles.org/www/material/nvscene2008/rwwtt.pdf
 *
 * Inspirations:
 * - https://www.shadertoy.com/view/4tXSDl
 * - https://www.shadertoy.com/view/4llGDH
 * - https://www.shadertoy.com/view/ld2GRz
 * - https://www.shadertoy.com/view/4dj3zV
 */

const props = {
  // Sinusoide Turbulence
  sinuzoide: {
    ampl: 0.2,
    frequency: 3,
    speed: 0.01,
  },
  // Perlin noise
  perlinNoise: {
    ampl: 0.2,
    frequency: 0.74,
    speed: -0.01,
  },
  // Colors
  color: {
    brightness: 0.1,
    ambienColor: new Color('#ffffff'),
    // light position ?
    lightColor1: new Color('#00ff00'),
    lightColor2: new Color('#0000ff'),
  },
  // Rotation
};

function animate() {
  requestAnimationFrame(animate);
  rm.update();
  rm.render();
}
function onFragmentLoaded(scope) {
  scope.setTexture("map", "img/matcap.png");
  animate();
}
function init()  {
  rm.setFragmentShader(blobFrag, onFragmentLoaded);
  document.body.appendChild(rm.domElement);

  window.addEventListener("resize", onResize, false);
  onResize();
}
function onResize(e) {
  rm.setSize(window.innerWidth, window.innerHeight);
}
init();

// GUI
const gui = new GUI();

const sinFolder = gui.addFolder('Sinuzoide');
sinFolder.open();
sinFolder.add(props.sinuzoide, 'ampl', 0, 2).onChange(() => {
  rm.material.uniforms.sinAmpl.value = props.sinuzoide.ampl;
});
sinFolder.add(props.sinuzoide, 'frequency', 0, 10).onChange(() => {
  rm.material.uniforms.sinFrequency.value = props.sinuzoide.frequency;
});
sinFolder.add(props.sinuzoide, 'speed', -0.2, 0.2).onChange(() => {
  rm.sinSpeed = props.sinuzoide.speed;
});

const perlinNoiseFolder = gui.addFolder('Perlin Noise');
perlinNoiseFolder.add(props.perlinNoise, 'ampl', 0, 0.5).onChange(() => {
  rm.material.uniforms.pNoiseAmpl.value = props.perlinNoise.ampl;
});
perlinNoiseFolder.add(props.perlinNoise, 'frequency', 0, 4).onChange(() => {
  rm.material.uniforms.pNoiseFrequency.value = props.perlinNoise.frequency;
});
perlinNoiseFolder.add(props.perlinNoise, 'speed', -0.05, 0.05).onChange(() => {
  rm.pNoiseSpeed = props.perlinNoise.speed;
});
