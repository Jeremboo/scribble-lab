import { mat4, translate, scale, rotateX, rotateY, rotateZ, lookAt } from '../../utils/mat4';
import { vec3 } from '../../utils/vec3';
export default class Object3D {
  constructor() {
    this._matrix = mat4();
    this._scale = vec3();
  }

  get matrix() { return this._matrix; }
  set matrix(mat4) { this._matrix = mat4; }

  get x()  { return this._matrix[12]; }
  set x(x) { this._matrix[12] = x; }

  get y()  { return this._matrix[13]; }
  set y(y) { this._matrix[13] = y; }

  get z() { return this._matrix[14]; }
  set z(z) { this._matrix[14] = z; }

  get scale() { return this._scale; }
  set scale(vec3) { this._scale(vec3[0], vec3[1], vec3[2]); }

  setPosition(x, y, z) {
    this._matrix[12] = x;
    this._matrix[13] = y;
    this._matrix[14] = z;
  }
  getPosition() {
    return [
      this._matrix[12],
      this._matrix[13],
      this._matrix[14]
    ]
  }

  translate(x, y, z) {
    this.matrix = translate(this._matrix, x, y, z);
  }
  rescale(x, y, z) {
    this._scale[0] = x;
    this._scale[1] = y;
    this._scale[2] = z;
    this.matrix = scale(this._matrix, x, y, z);
  }
  rotateX(rad) {
    this.matrix = rotateX(this._matrix, rad);
  }
  rotateY(rad) {
    this.matrix = rotateY(this._matrix, rad);
  }
  rotateZ(rad) {
    this.matrix = rotateZ(this._matrix, rad);
  }
  lookAt(target, up) {
    // TODO 2020-06-22 jeremboo: have to apply the scale again. Find another solution with quaternion
    // TODO 2020-06-22 jeremboo: quaternion.applyRotationFromMatrix()
    this.matrix = scale(
      lookAt(this.getPosition(), target, up),
      this._scale[0],
      this._scale[1],
      this._scale[2]
    );
  }
}