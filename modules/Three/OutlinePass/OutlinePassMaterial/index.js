import {Color, ShaderMaterial, Vector2} from 'three';

import fragmentShader from './frag.glsl';
import vertexShader from './vert.glsl';

// export type OutlinePassMaterialProps = {
//   color?: string;
//   thickness?: number;
// };

export default class OutlinePassMaterial extends ShaderMaterial {
  constructor({
    color = '#000000',
    thickness = 1,
  }) {
    super({
      defines: {
        DEBUG_MODE: 0,
      },
      uniforms: {
        sceneColorBuffer: {value: null},
        surfaceBuffer: {value: null},
        outlineColor: {value: new Color(color)},
        thickness: {value: Math.floor(thickness)},
        screenSize: {value: new Vector2()},
        // depthBuffer: {value: null},
        //4 scalar values packed in one uniform: depth multiplier, depth bias, and same for normals.
        // multiplierParameters: {
        //   value: new Vector4(0.9, 20, 1, 1),
        // },
        // cameraNear: {value: cameraNear},
        // cameraFar: {value: cameraFar},
      },
      vertexShader,
      fragmentShader,
    });
  }

  setDebugMode(isEnabled) {
    // TODO 2024-01-04 jeremboo: Should never be called in production
    this.defines.DEBUG_MODE = isEnabled ? 1 : 0;
    this.needsUpdate = true;
  }

  resize(width, height) {
    this.uniforms.screenSize.value.set(1 / width, 1 / height);
  }
}
