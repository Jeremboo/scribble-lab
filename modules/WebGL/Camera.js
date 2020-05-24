import Object3D from './Object3D';
import { perspective, inverse, multiply } from '../../utils/mat4';

export default class Camera extends Object3D {
  constructor(fov, ratio, near, far) {
    super();
    this.projectionMatrix = perspective(fov, ratio, near, far);
  }

  getViewMatrix() {
    return inverse(this.mat4);
  }

  getViewProjectionMatrix() {
    return multiply(this.projectionMatrix, this.getViewMatrix());
  }
}