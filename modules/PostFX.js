import {
  Scene, OrthographicCamera, BufferGeometry, BufferAttribute,
  Vector2, WebGLRenderTarget, RawShaderMaterial, Mesh,
  RGBFormat,
} from 'three';

// Author:  @lukure
// https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
export default class PostFX {
  constructor(renderer, fragmentShader, vertexShader, uniforms = {}) {
    this.renderer = renderer;
    this.scene = new Scene();
    // three.js for .render() wants a camera, even if we're not using it :(
    this.dummyCamera = new OrthographicCamera();
    this.geometry = new BufferGeometry();

    // Triangle expressed in clip space coordinates
    const vertices = new Float32Array([
      -1.0, -1.0,
      3.0, -1.0,
      -1.0, 3.0
    ]);

    this.geometry.addAttribute('position', new BufferAttribute(vertices, 2));

    this.resolution = new Vector2();
    this.renderer.getDrawingBufferSize(this.resolution);

    this.target = new WebGLRenderTarget(this.resolution.x, this.resolution.y, {
      format: RGBFormat,
      stencilBuffer: false,
      depthBuffer: true,
    });

    this.material = new RawShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        newFrame: { value: this.target.texture },
        resolution: { value: this.resolution },
        ...uniforms
      },
    });

    // TODO: handle the resize -> update uResolution uniform and this.target.setSize()

    this.triangle = new Mesh(this.geometry, this.material);
    // Our triangle will be always on screen, so avoid frustum culling checking
    this.triangle.frustumCulled = false;
    this.scene.add(this.triangle);
  }

  render(scene, camera) {
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.dummyCamera);
  }
}