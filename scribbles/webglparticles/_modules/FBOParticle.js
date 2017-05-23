import {
  Scene, Mesh, OrthographicCamera,
  NearestFilter, RGBFormat, FloatType, WebGLRenderTarget, BufferGeometry, BufferAttribute,
  Points,
} from 'three';

export default class FBOParticle extends Points {
  constructor(width, height, particleMaterial, renderer) {
    /** *********
     * PARTICLE
     */
    // Create a vertex buffer of size width * height with normalized coordinates
    const l = width * height;
    const vertices = new Float32Array(l * 3);
    for (let i = 0; i < l; i++) {
      const i3 = i * 3;
      vertices[i3] = (i % width) / height;
      vertices[i3 + 1] = (i / width) / height;
    }

    const geometry = new BufferGeometry();
    geometry.addAttribute('position', new BufferAttribute(vertices, 3));
    super(geometry, particleMaterial);

    /** *********
     * FBO
     */
    this.fbos = [];
    this.renderer = renderer;
    this.scene = new Scene();
    this.orthoCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);
    this.rtt = new WebGLRenderTarget(width, height, {
      minFilter: NearestFilter, // Important as we want to sample square pixels
      magFilter: NearestFilter,
      format: RGBFormat, // Could be RGBAFormat
      type: FloatType, // important as we need precise coordinates (not ints) // ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) ? HalfFloatType : FloatType,
    });

    this.update = this.update.bind(this);
  }

  createFBO(name, simulationMaterial) {
    const geom = new BufferGeometry();
    geom.addAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    geom.addAttribute('uv', new BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]), 2));
    const mesh = new Mesh(geom, simulationMaterial);
    this.fbos[name] = mesh
    this.scene.add(mesh);
  }

  updateFBOUniform(fboName, uniformName, value) {
    this.fbos[fboName].material.uniforms[uniformName].value = value;
  }

  update() {
    this.renderer.render(this.scene, this.orthoCamera, this.rtt, true);
    this.material.uniforms.positions.value = this.rtt.texture;
  }
}
