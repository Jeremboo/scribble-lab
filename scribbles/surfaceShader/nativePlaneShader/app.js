import surfaceVertSource from '../_shaders/surface.v.glsl';
import surfaceFragSource from '../_shaders/surface.f.glsl';

import FullScreenShader from 'FullScreenShader';

const screenShader = new FullScreenShader(
  document.getElementById('c'),
  surfaceVertSource,
  surfaceFragSource
);

const uColor = screenShader.uniformColor('color', '#ff00ff');



// Update an uniform
setTimeout(() => {
  screenShader.setUniformColor(uColor, '#ffff00');
  screenShader.render();
}, 1000);

screenShader.render();

// loop
// screenShader.start();