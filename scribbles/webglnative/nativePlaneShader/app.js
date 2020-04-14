import FullScreenShader from 'FullScreenShader';

const screenShader = new FullScreenShader(
  document.getElementById('c'),
  `
    attribute vec2 position;
    varying vec2 vUv;

    void main() {
      // Compute the UV
      vUv = (position + 1.) * 0.5;

      // Place the triangle (in 2D)
      gl_Position = vec4(position, 0., 1.);
    }
  `,
  `
    precision mediump float;

    uniform vec3 color;

    varying vec2 vUv;

    void main() {
      gl_FragColor = vec4(vec3(vUv, 1.) * color, 1.);
    }
  `
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