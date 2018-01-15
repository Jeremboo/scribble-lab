import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading,
} from 'three';

import rm from 'RayMarcher';

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
 * Inspiration:
 * - https://www.shadertoy.com/view/4tXSDl
 * - https://www.shadertoy.com/view/4llGDH
 * - https://www.shadertoy.com/view/ld2GRz
 * - https://www.shadertoy.com/view/4dj3zV
 */

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