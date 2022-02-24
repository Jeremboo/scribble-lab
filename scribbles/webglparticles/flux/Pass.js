import { Vector2 } from 'three';
import { drawRadialGradient } from '../../../utils/glsl';

// TODO 2021-11-02 jeremboo: Create a global Pass.three.js file
export default class PostProcessingPass {
  constructor() {

    this.uniforms = {
      mousePosition: { value: new Vector2(-1, -1) },
      mouseRadius: { value: 1000 },
      mouseIntensity: { value: 0.5 },

      gridSize: { value: 3.5 },
      gridTexture: { value: null },
      shiftTexture: { value: null },
    };

    this.fragmentUniforms = `
    uniform vec2 mousePosition;
    uniform float mouseRadius;
    uniform float mouseIntensity;
    uniform sampler2D shiftTexture;
    uniform sampler2D gridTexture;

    uniform float gridSize;

    ${drawRadialGradient}
`;
    this.fragmentBefore = `
    // Gratient circle based on mouse position
    float distance = drawRadialGradient(mousePosition * resolution, gl_FragCoord.xy, mouseRadius) * mouseIntensity;

    // Get the grid texture
    vec2 squaredUv = uv;
    squaredUv.x *= resolution.x / resolution.y;
    squaredUv *= gridSize;
    vec2 shift = texture2D(shiftTexture, squaredUv).xy - 0.5;

    // Get visible grid
    float grid = texture2D(gridTexture, squaredUv).x;

    if (distance > 0.0) {
      // Change the uv
      uv.y += shift.x * 0.1 * distance;
      uv.x += shift.y * 0.1 * distance;
    }
`;
    this.fragmentAfter = `
    // transformed += distance;

    transformed.xyz += vec3(grid) * distance;
    transformed.xyz += distance * shift.x * 0.5;

    // transformed.xyz = grid;
`;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e) {
    const x = e.x / window.innerWidth;
    const y = e.y / window.innerHeight;

    // TODO 2021-11-02 jeremboo: Interpolate it
    // TODO 2021-11-02 jeremboo: use the camera interpolation directly?
    this.uniforms.mousePosition.value.x = x;
    this.uniforms.mousePosition.value.y = 1 - y;
  }

  // Add some props into the GUI from this pass
  gui(guiFolder) {
    guiFolder.add(this.uniforms.mouseRadius, 'value', 0, 5000).name('mouseRadius');
    guiFolder.add(this.uniforms.mouseIntensity, 'value', 0, 5000).name('mouseIntensity');
  }

  // update() {
  //   // NOTE 2021-11-02 jeremboo: No update loop for now
  // }
}