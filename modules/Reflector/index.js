/**
 * @author Slayvin / http://slayvin.net
 * https://bitbucket.org/reflektor-digital/36daysoftype/src/master/m/src/
 */

import {
  WebGLRenderTarget, ShaderMaterial,
  Mesh, Color, Plane, Vector3, Vector4, Vector2, Matrix4,
  PerspectiveCamera, LinearFilter, RGBFormat
} from 'three';

import reflectorVert from './shaders/reflector.v.glsl';
import reflectorFrag from './shaders/reflector.f.glsl';

// TODO create a reflector material
// TODO support DoubleSide
export default class ReflectorMesh extends Mesh {
  constructor(geometry, {
    color = 0xFFFFFF,
    textureWidth = 512,
    textureHeight = 512,
    clipBias = 0,
    recursion = 0
  } = {}) {
    const parameters = {
      minFilter     : LinearFilter,
      magFilter     : LinearFilter,
      format        : RGBFormat,
      stencilBuffer : false
    };

    const material = new ShaderMaterial({
      uniforms : {
        color         : { value : new Color(color) },
        tDiffuse      : { value : null },
        textureMatrix : { value : null },
        ty            : { value : 1.0 },
        tx            : { value : 1.0 }
      },
      fragmentShader : reflectorFrag,
      vertexShader   : reflectorVert
    });

    super(geometry, material);

    this.type = 'Reflector';

    this.recursion = recursion;
    this.clipBias = clipBias;

    this.reflectorPlane = new Plane();
    this.normal = new Vector3();
    this.reflectorWorldPosition = new Vector3();
    this.cameraWorldPosition = new Vector3();
    this.rotationMatrix = new Matrix4();
    this.lookAtPosition = new Vector3(0, 0, - 1);
    this.clipPlane = new Vector4();
    this.viewport = new Vector4();

    this.view = new Vector3();
    this.target = new Vector3();
    this.q = new Vector4();
    this.size = new Vector2();

    this.textureMatrix = new Matrix4();
    this.virtualCamera = new PerspectiveCamera();

    this.renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, parameters);

    // if (! Math.isPowerOfTwo(textureWidth) || ! Math.isPowerOfTwo(textureHeight)) {
    //   this.renderTarget.texture.generateMipmaps = false;
    // }

    // Set the attribute to the material
    this.material.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.material.uniforms.textureMatrix.value = this.textureMatrix;
  }

  onBeforeRender(renderer, scene, camera) {
    if ('recursion' in camera.userData) {
      if (camera.userData.recursion === this.recursion) return;
      camera.userData.recursion += 1;
    }

    this.reflectorWorldPosition.setFromMatrixPosition(this.matrixWorld);
    this.cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

    this.rotationMatrix.extractRotation(this.matrixWorld);

    this.normal.set(0, 0, 1);
    this.normal.applyMatrix4(this.rotationMatrix);

    this.view.subVectors(this.reflectorWorldPosition, this.cameraWorldPosition);

    // Avoid rendering when reflector is facing away

    if (this.view.dot(this.normal) > 0) return;

    this.view.reflect(this.normal).negate();
    this.view.add(this.reflectorWorldPosition);

    this.rotationMatrix.extractRotation(camera.matrixWorld);

    this.lookAtPosition.set(0, 0, - 1);
    this.lookAtPosition.applyMatrix4(this.rotationMatrix);
    this.lookAtPosition.add(this.cameraWorldPosition);

    this.target.subVectors(this.reflectorWorldPosition, this.lookAtPosition);
    this.target.reflect(this.normal).negate();
    this.target.add(this.reflectorWorldPosition);

    this.virtualCamera.position.copy(this.view);
    this.virtualCamera.up.set(0, 1, 0);
    this.virtualCamera.up.applyMatrix4(this.rotationMatrix);
    this.virtualCamera.up.reflect(this.normal);
    this.virtualCamera.lookAt(this.target);

    this.virtualCamera.far = camera.far; // Used in WebGLBackground

    this.virtualCamera.updateMatrixWorld();
    this.virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    this.virtualCamera.userData.recursion = 0;

    // Update the texture matrix
    this.textureMatrix.set(
      0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0);
    this.textureMatrix.multiply(this.virtualCamera.projectionMatrix);
    this.textureMatrix.multiply(this.virtualCamera.matrixWorldInverse);
    this.textureMatrix.multiply(this.matrixWorld);

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    this.reflectorPlane.setFromNormalAndCoplanarPoint(this.normal, this.reflectorWorldPosition);
    this.reflectorPlane.applyMatrix4(this.virtualCamera.matrixWorldInverse);

    this.clipPlane.set(
      this.reflectorPlane.normal.x,
      this.reflectorPlane.normal.y,
      this.reflectorPlane.normal.z,
      this.reflectorPlane.constant);

    const projectionMatrix = this.virtualCamera.projectionMatrix;
    this.q.x = (
      Math.sign(this.clipPlane.x) + projectionMatrix.elements[8] / projectionMatrix.elements[0]
    );
    this.q.y = (
      (Math.sign(this.clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    );
    this.q.z = - 1.0;
    this.q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    // Calculate the scaled plane vector
    this.clipPlane.multiplyScalar(2.0 / this.clipPlane.dot(this.q));

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = this.clipPlane.x;
    projectionMatrix.elements[6] = this.clipPlane.y;
    projectionMatrix.elements[10] = this.clipPlane.z + 1.0 - this.clipBias;
    projectionMatrix.elements[14] = this.clipPlane.w;

    // Render
    this.visible = false;

    const currentRenderTarget = renderer.getRenderTarget();

    const currentVrEnabled = renderer.vr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    renderer.vr.enabled = false; // Avoid camera modification and recursion
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    renderer.setRenderTarget(this.renderTarget);
    renderer.clear();
    renderer.render(scene, this.virtualCamera);

    renderer.vr.enabled = currentVrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

    renderer.setRenderTarget(currentRenderTarget);

    //   this.viewport

    const bounds = camera.bounds;

    if (bounds !== undefined) {
      renderer.getSize(this.size);
      const pixelRatio = renderer.getPixelRatio();

      viewport.x = bounds.x * this.size.width * pixelRatio;
      viewport.y = bounds.y * this.size.height * pixelRatio;
      viewport.z = bounds.z * this.size.width * pixelRatio;
      viewport.w = bounds.w * this.size.height * pixelRatio;

      renderer.state.viewport(viewport);
    }

    this.visible = true;
  }

  getRenderTarget() {
    return this.renderTarget;
  }
}
