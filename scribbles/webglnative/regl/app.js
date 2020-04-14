import Regl from 'regl';
import testImage from 'texture.jpg';

const image = new Image();
image.src = testImage;

image.onload = () => {

  // Update the scale of the wrapper
  const domWrapper = document.getElementById('wrapper');
  domWrapper.width = image.width;
  domWrapper.height = image.height;

  const regl = Regl({
    canvas: domWrapper,
  });

  // Create the gl system
  const render = regl({
    frag: `
    precision mediump float;
    uniform sampler2D texture;
    uniform float darkness;
    varying vec2 uv;
    void main () {
      gl_FragColor = vec4(texture2D(texture, uv).xyz * darkness, 1.0);
    }`,

    vert: `
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;
    void main () {
      uv = position;
      gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
    }`,

    attributes: {
      position: [
        -2, 0,
        0, -2,
        2, 2],
    },

    uniforms: {
      texture: regl.texture(image),
      darkness: regl.prop('darkness'),
    },

    count: 3,
  });

  const tick = regl.frame((context) => {
    render({ darkness: Math.abs(Math.sin(context.time)) });
  });
  // tick.cancel()
};
