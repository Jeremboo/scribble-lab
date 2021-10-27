import Program from "./Program";
import Object3D from "./Object3D";

export const DEFAULT_VERTEX = `
  varying vec2 vUv;

  void main() {
    gl_Position = viewProjectionMatrix * modelMatrix * position;
    vUv = position.xy + 0.5;
  }
`;
export const DEFAULT_FRAGMENT = `
  precision mediump float;

  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(vUv, 1.0, 1.0);
  }
`;
export const DEFAULT_PLANE_POSITION = {
  position: [
    -0.5, -0.5, 0,
     0.5, -0.5, 0,
    -0.5,  0.5, 0,
     0.5,  0.5, 0
  ],
  indices: [0, 1, 2, 2, 3, 1]
};

export default class Mesh extends Object3D {
  constructor(context, camera, {
    vertex = DEFAULT_VERTEX,
    fragment = DEFAULT_FRAGMENT,
    geometry = DEFAULT_PLANE_POSITION,
    positionSize = 3,
    uniforms = {}
  } = {}) {
    super();

    const transformedVextrex = `
      uniform mat4 modelMatrix;
      uniform mat4 viewProjectionMatrix;
      attribute vec4 position;
    ` + vertex;

    this.camera = camera;
    this.program = new Program(context, transformedVextrex, fragment);

    // Add the default position
    this.program.addAttributePosition(
      geometry.position,
      geometry.indices,
      positionSize
    );
    // Add the uniforms and matrix for positionning
    this.program.addUniforms(Object.assign({
      viewProjectionMatrix: this.camera.getViewProjectionMatrix(),
      modelMatrix: this._matrix,
    }, uniforms));
  }

  /**
   * Overwrite the matrix setter to update
   * the modelMatrix uniform each time it's updated.
   */
  set matrix(mat4) {
    this._matrix = mat4;
    this.program.forceUpdateUniform('modelMatrix', this._matrix);
  }

  /**
   * * *******************
   * * CAMERA
   * * *******************
   */
  setCamera(camera) {
    this.camera = camera;
    this.program.forceUpdateUniform('viewProjectionMatrix', this.camera.getViewProjectionMatrix());
  }
}