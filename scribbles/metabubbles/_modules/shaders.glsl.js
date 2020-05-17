import { drawRadialGradient } from '../../../modules/utils.glsl';

export const bubbleVert = `
  uniform sampler2D canvasTexture;

  varying vec2 vUv;

  void main()	{
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const bubbleFrag = `
  uniform sampler2D backgroundTexture;
  uniform vec2 littleBubblePosition;
  uniform vec3 color;

  varying vec2 vUv;

  ${drawRadialGradient}

  void main() {
    vec2 center = vec2(0.5, 0.5);

    float alpha = drawRadialGradient(center, vUv, 0.4) + drawRadialGradient(littleBubblePosition, vUv, 0.3);
    // ---
    // if (alpha <= 0.0) discard;
    // gl_FragColor = texture2D(backgroundTexture, vUv);
    // --- OR MORE OPTI
    // http://theorangeduck.com/page/avoiding-shader-conditionals
    // gl_FragColor = texture2D(backgroundTexture, vUv) * max(sign(alpha), 0.0);

    gl_FragColor = vec4(color, 1.) * max(sign(alpha), 0.0);
    // ---
  }
`;