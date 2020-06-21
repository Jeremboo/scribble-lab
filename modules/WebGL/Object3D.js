import { mat4, translate, scale, rotateX, rotateY, rotateZ, lookAt } from '../../utils/mat4';

export default class Object3D {
  constructor() {
    this._matrix = mat4();
  }

  get matrix() { return this._matrix; }
  set matrix(mat4) { this._matrix = mat4; }

  get x()  { return this._matrix[12]; }
  set x(x) { this._matrix[12] = x; }

  get y()  { return this._matrix[13]; }
  set y(y) { this._matrix[13] = y; }

  get z() { return this._matrix[14]; }
  set z(z) { this._matrix[14] = z; }

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
  scale(x, y, z) {
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
    this.matrix = lookAt(this.getPosition(), target, up);
  }
}