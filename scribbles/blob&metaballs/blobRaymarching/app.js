import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading,
} from 'three';

import rm from 'RayMarcher';
import { GUI } from 'dat.gui';

import { getRandomFloat } from 'utils';

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
  // Sinusoide
  sinuzoide: {
    ampl: 0, // 0.5,
    frequency: 0.7,
    speed: 0.1,
  },
  // Perlin noise
  perlinNoise: {
    ampl: 0, // 0.21,
    frequency: 0.4,
    speed: 0.01,
  },
  // Scatter: throw in various random directions
  scatter: {
    scale: 0.3,
    ampl: 0, // 3,
    speed: 0.1,
  },
  // Blend Distance
  blendDistance: 7, // 2
  // Colors
  colors: {
    diffuse: '#d16e6e',
    intensity: 0.1,
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

  rm.material.uniforms.sinSpeed.value += props.sinuzoide.speed;
  rm.material.uniforms.pNoiseSpeed.value += props.perlinNoise.speed;
  rm.material.uniforms.scatterSpeed.value += props.scatter.speed;

  rm.render();
}

function onResize(e) {
  rm.setSize(window.innerWidth, window.innerHeight);
}

function init()  {
  rm.setFragmentShader(blobFrag);
  // rm.setTexture('map', 'img/matcap.png");

  // Update uniforms
  Object.assign(rm.mesh.material.uniforms, {
    // sinuzoide
    sinAmpl: { type: 'f', value: props.sinuzoide.ampl },
    sinFrequency: { type: 'f', value: props.sinuzoide.frequency },
    sinSpeed: { type: 'f', value: Math.random() },
    // perlinNoise
    pNoiseAmpl: { type: 'f', value: props.perlinNoise.ampl },
    pNoiseFrequency: { type: 'f', value: props.perlinNoise.ampl },
    pNoiseSpeed: { type: 'f', value: Math.random() },
    // scatter
    scatterSeed: { type: 'f', value: Math.random() },
    scatterScale: { type: 'f', value: props.scatter.scale },
    scatterSpeed: { type: 'f', value: props.scatter.speed },
    scatterAmpl: { type: 'f', value: props.scatter.ampl },
    // blendDistance
    blendDistance: { type: 'f', value: props.blendDistance },
    // Seeds
    seed_1: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_2: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_3: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_4: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_5: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_6: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_7: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_8: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_9: { type: 'f', value: getRandomFloat(-1, 1) },
    seed_10: { type: 'f', value: getRandomFloat(-1, 1) },
    // colors
    diffuseColor: { type: 'v3', value: new Color(props.colors.diffuse) },
    intensityColor: { type: 'float', value: props.colors.intensity },
  });
  rm.update();

  window.addEventListener('resize', onResize, false);
  onResize();
  document.body.appendChild(rm.domElement);

  // start the loop
  animate();
}

init();

// GUI
const gui = new GUI();

// Blend Distance
gui.add(props, 'blendDistance', 0.01, 5).onChange(() => {
  rm.material.uniforms.blendDistance.value = props.blendDistance;
});

// Sinuzoide
const sinFolder = gui.addFolder('Sinuzoide');
sinFolder.open();
sinFolder.add(props.sinuzoide, 'ampl', 0, 2).onChange(() => {
  rm.material.uniforms.sinAmpl.value = props.sinuzoide.ampl;
});
sinFolder.add(props.sinuzoide, 'frequency', 0, 10).onChange(() => {
  rm.material.uniforms.sinFrequency.value = props.sinuzoide.frequency;
});
sinFolder.add(props.sinuzoide, 'speed', -0.2, 0.2);

// PerlinNoise
const perlinNoiseFolder = gui.addFolder('Perlin Noise');
perlinNoiseFolder.add(props.perlinNoise, 'ampl', 0, 2).onChange(() => {
  rm.material.uniforms.pNoiseAmpl.value = props.perlinNoise.ampl;
});
perlinNoiseFolder.add(props.perlinNoise, 'frequency', 0, 4).onChange(() => {
  rm.material.uniforms.pNoiseFrequency.value = props.perlinNoise.frequency;
});
perlinNoiseFolder.add(props.perlinNoise, 'speed', -0.05, 0.05);

// Scatter
const scatterFolder = gui.addFolder('Scatter');
scatterFolder.add(props.scatter, 'scale', 0, 0.8).onChange(() => {
  rm.material.uniforms.scatterScale.value = props.scatter.scale;
});
scatterFolder.add(props.scatter, 'ampl', 0, 10).onChange(() => {
  rm.material.uniforms.scatterAmpl.value = props.scatter.ampl;
});
scatterFolder.add(props.scatter, 'speed', 0, 0.5);

// Colors
const colorsFolder = gui.addFolder('Colors');
colorsFolder.addColor(props.colors, 'diffuse').onChange(() => {
  rm.material.uniforms.diffuseColor.value = new Color(props.colors.diffuse);
});
colorsFolder.add(props.colors, 'intensity', 0, 1).onChange(() => {
  rm.material.uniforms.intensityColor.value = props.colors.intensity;
});
