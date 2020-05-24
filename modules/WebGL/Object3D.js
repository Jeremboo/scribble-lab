import { mat4, translate, rotateX, rotateY, rotateZ, lookAt } from '../../utils/mat4';

export default class Object3D {
  constructor() {
    this.mat4 = mat4();
  }

  get x()  { return this.mat4[12]; }
  set x(x) { this.mat4[12] = x; }

  get y()  { return this.mat4[13]; }
  set y(y) { this.mat4[13] = y; }

  get z() { return this.mat4[14]; }
  set z(z) { this.mat4[14] = z; }

  setPosition(x, y, z) {
    this.mat4[12] = x;
    this.mat4[13] = y;
    this.mat4[14] = z;
  }
  getPosition() {
    return [
      this.mat4[12],
      this.mat4[13],
      this.mat4[14]
    ]
  }

  translate(x, y, z) {
    this.mat4 = translate(this.mat4, x, y, z);
  }
  rotateX(rad) {
    this.mat4 = rotateX(this.mat4, rad);
  }
  rotateY(rad) {
    this.mat4 = rotateY(this.mat4, rad);
  }
  rotateZ(rad) {
    this.mat4 = rotateZ(this.mat4, rad);
  }
  lookAt(target, up) {
    this.mat4 = lookAt(this.getPosition(), target, up);
  }
}