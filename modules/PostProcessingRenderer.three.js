
import { OrthographicCamera, RawShaderMaterial, Scene, BufferGeometry, BufferAttribute, Vector2, WebGLRenderTarget, RGBFormat, Mesh } from 'three';
import { defaultFragmentShader, defaultVertexShader } from '../utils/glsl';
import Renderer from './Renderer.three';

// Inspired by @lukure work
// https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
export default class PostProcessingRenderer extends Renderer {
  constructor(rendererProps) {
    super(rendererProps);

    // The scene and camera for post processing
    this.postProcessScene = new Scene();
    this.postProcessCamera = new OrthographicCamera();

    // Triangle Mesh expressed in clip space coordinate
    this.geometry = new BufferGeometry();
    const vertices = new Float32Array([
      -1.0, -1.0,
      3.0, -1.0,
      -1.0, 3.0
    ]);
    this.geometry.addAttribute('position', new BufferAttribute(vertices, 2));

    // Render target to push all postprocessing effects
    this.resolution = new Vector2();
    this.getDrawingBufferSize(this.resolution);
    this.target = new WebGLRenderTarget(this.resolution.x, this.resolution.y, {
      format: RGBFormat,
      stencilBuffer: false,
      depthBuffer: true,
    });

    this.material = new RawShaderMaterial({
      fragmentShader: defaultFragmentShader,
      vertexShader: defaultVertexShader,
      uniforms: {
        texture: { value: this.target.texture },
        resolution: { value: this.resolution },
      },
    });

    this.triangle = new Mesh(this.geometry, this.material);
    this.triangle.frustumCulled = false;
    this.postProcessScene.add(this.triangle);

    this.passes = [];
  }

  updateMaterial() {
    let fragmentUniforms = ``;
    let fragmentMain = ``;
    const uniforms = {};
    this.passes.forEach(pass => {
      fragmentUniforms += `${pass.fragmentUniforms}
`;
      fragmentMain += `${pass.fragmentMain}
`;
      Object.assign(uniforms, pass.uniforms);
    });

    this.material.fragmentShader = `
  precision highp float;

  uniform sampler2D texture;
  uniform vec2 resolution;

  ${fragmentUniforms}

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 transformed = texture2D(texture, uv);

    ${fragmentMain}

    gl_FragColor = transformed;
  }
`;
    Object.assign(this.material.uniforms, uniforms);
    this.material.needsUpdate = true;
  }

  addPass(pass) {
    this.passes.push(pass);
    this.updateMaterial();

    // Add the pass update method into the loop
    pass.rendererMaterial = this.material;
    this.addUpdate(pass);
  }

  removePass() {
    console.warn('TODO: PostProcessingRenderer.removePasss');
  }

  resize(props) {
    super.resize(props);

    const { viewportWidth, viewportHeight } = props;

    this.target.setSize(viewportWidth * this.pixelRatio, viewportHeight * this.pixelRatio);

    this.resolution.x = viewportWidth * this.pixelRatio;
    this.resolution.y = viewportHeight * this.pixelRatio;
  }

  update(props) {
    this.setRenderTarget(this.target);
    super.update(props)
    this.setRenderTarget(null);
    this.render(this.postProcessScene, this.postProcessCamera);
  }
}