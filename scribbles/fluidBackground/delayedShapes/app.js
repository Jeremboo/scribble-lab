import FullScreenShader from 'FullScreenShader';
import { GUI } from 'dat.gui';

import surfaceVertSource from './shaders/surface.v.glsl';
import surfaceFragSource from './shaders/surface.f.glsl';

import shapeTextureUrl from 'line.jpg';

// INIT
const screenShader = new FullScreenShader(
  document.getElementById('c'),
  surfaceVertSource,
  surfaceFragSource
);

/**
 * * *******************
 * * CREATIVE ZONE
 */

// PROPS
const PROPS = {
  debug: true,
  speed: { x: 0.01, y: 0.01 },
  color: '#ff00ff',
  perlinForce: 0.15,
  perlinDimension: 2.5,
}

// UNIFORMS
// color
const uColor = screenShader.uniformColor('color', PROPS.color);
// texture
let shapeTexture = null;
const uShapeTexture = screenShader.uniformTexture('texture', 0);
// const uRecursiveTexture = screenShader.uniformTexture('recursiveTexture', 1);

// time
let time = [0, 0];
const uTime = screenShader.uniform2f('time', ...time);
// perlin
const uForce = screenShader.uniformFloat('perlinForce', PROPS.perlinForce);
const uDimension = screenShader.uniformFloat('perlinDimension', PROPS.perlinDimension);

// RENDER TARGET
// const renderTarget = screenShader.createRenderTarget({ width: 1024, height: 1024 });

// GUI
if (PROPS.debug) {
  const gui = new GUI();
  gui.add(PROPS.speed, 'x', -0.1, 0.1);
  gui.add(PROPS.speed, 'y', -0.1, 0.1);
  gui.add(PROPS, 'perlinForce', 0, 1).onChange((value) => {
    screenShader.setUniformFloat(uForce, value);
  });
  gui.add(PROPS, 'perlinDimension', 0, 5).onChange((value) => {
    screenShader.setUniformFloat(uDimension, value);
  })
}

// LOOP
function update() {
  time[0] += PROPS.speed.x;
  time[1] += PROPS.speed.y;
  screenShader.setUniform2f(uTime, ...time);
}

// START
async function start () {
  // Create the textures
  shapeTexture = await screenShader.createTextureFromUrl(shapeTextureUrl);

  // ONce all texture are created, bind them
  screenShader.gl.activeTexture(screenShader.gl.TEXTURE0);
  screenShader.gl.bindTexture(screenShader.gl.TEXTURE_2D, shapeTexture);
  // screenShader.gl.activeTexture(screenShader.gl.TEXTURE1);
  // screenShader.gl.bindTexture(screenShader.gl.TEXTURE_2D, renderTarget.texture);

  screenShader.start(update);
}

start();


