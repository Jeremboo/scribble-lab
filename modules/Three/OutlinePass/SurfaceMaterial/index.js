import {ShaderMaterial} from 'three';

import fragmentShader from './frag.glsl';
import vertexShader from './vert.glsl';

export default class SurfaceMaterial extends ShaderMaterial {
  constructor() {
    super({
      defines: {
        // NOTE 2024-01-04 jeremboo: define instead of uniforms because it's not supposed to change in prod
        DEBUG_MODE: 0,
      },
      uniforms: {
        maxSurfaceId: {value: 1},
      },
      vertexShader,
      fragmentShader,
      vertexColors: true,
    });
  }

  setDebugMode(isEnabled) {
    // TODO 2024-01-04 jeremboo: NOT IN PRODUCTION
    this.defines.DEBUG_MODE = isEnabled ? 1 : 0;
    this.needsUpdate = true;
  }
}
