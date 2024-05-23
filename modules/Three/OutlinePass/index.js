import {
  HalfFloatType,
  WebGLRenderTarget,
  Color,
  BufferGeometry,
  Mesh,
  Float32BufferAttribute,
  OrthographicCamera
} from 'three';
import {Pass} from 'postprocessing';
import findSurfaces from './surfaceFinder';
import OutlinePassMaterial, {
} from './OutlinePassMaterial';
import SurfaceMaterial from './SurfaceMaterial';

export const DPR = {
  canvas: 3,
  passRender: 3,
  surfaceRender: 3,
  outlineResolution: 3,
  antialiasing: true,
};


// TODO 2024-05-21 jeremboo: SHOULD BE ACCESSIBLE VIA POSTPROCESSING !!!!
class FullscreenTriangleGeometry extends BufferGeometry {

	constructor() {

		super();

		this.setAttribute( 'position', new Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
		this.setAttribute( 'uv', new Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

	}

}

const _geometry = new FullscreenTriangleGeometry();
const _camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );


class FullScreenQuad {

	constructor( material ) {

		this._mesh = new Mesh( _geometry, material );

	}

	dispose() {

		this._mesh.geometry.dispose();

	}

	render( renderer) {
		renderer.render( this._mesh, _camera);
	}

	get material() {

		return this._mesh.material;

	}

	set material( value ) {

		this._mesh.material = value;

	}

}


// Follows the structure of
// https://github.com/mrdoob/js/blob/master/examples/jsm/postprocessing/OutlinePass.js
// https://discourse.threejs.org/t/how-to-render-full-outlines-as-a-post-process-tutorial/22674
export default class OutlinePass extends Pass {
  constructor(scene, camera, props) {
    super();

     // A buffer to render the surface we want to outline thanks to the surface material
    this.passRender = new WebGLRenderTarget();
    this.surfaceBuffer = new WebGLRenderTarget();
    this.surfaceOverrideMaterial = new SurfaceMaterial();

  // NOTE 2024-01-04 jeremboo: If we need more outline, it maybe worth it to use this
  // normalOverrideMaterial = new MeshNormalMaterial();

    this.renderScene = scene;
    this.renderCamera = camera;

    this.passMaterial = new OutlinePassMaterial(props);
    this.fsQuad = new FullScreenQuad(this.passMaterial);

    // this.passRender.texture.format = RGBAFormat;
    // this.passRender.texture.type = HalfFloatType;
    // this.passRender.texture.minFilter = NearestFilter;
    // this.passRender.texture.magFilter = NearestFilter;
    this.passRender.texture.generateMipmaps = false;
    this.passRender.stencilBuffer = false;

    // this.surfaceBuffer.texture.format = RGBAFormat;
    this.surfaceBuffer.texture.type = HalfFloatType;
    // this.surfaceBuffer.texture.minFilter = NearestFilter;
    // this.surfaceBuffer.texture.magFilter = NearestFilter;
    this.surfaceBuffer.texture.generateMipmaps = false;
    this.surfaceBuffer.stencilBuffer = false;
  }

  dispose() {
    this.surfaceBuffer.dispose();
    this.fsQuad.dispose();
    this.surfaceOverrideMaterial.dispose();
    this.passMaterial.dispose();
  }

  setSize(width, height) {
    this.passRender.setSize(
      window.innerWidth * DPR.passRender,
      window.innerHeight * DPR.passRender
    );
    this.surfaceBuffer.setSize(
      window.innerWidth * DPR.surfaceRender,
      window.innerHeight * DPR.surfaceRender
    );
    this.passMaterial.resize(
      window.innerWidth * DPR.outlineResolution,
      window.innerHeight * DPR.outlineResolution
    );
  }

  setDebugMode(isEnabled) {
    this.passMaterial.setDebugMode(isEnabled);
    this.surfaceOverrideMaterial.setDebugMode(isEnabled);
  }

  setThickness(thickness) {
    this.passMaterial.uniforms.thickness.value = thickness;
  }

  setColor(color) {
    this.passMaterial.uniforms.outlineColor.value = new Color(
      color
    ).convertLinearToSRGB();
  }

  setMaxSurfaceId(maxSurfaceId) {
    // TODO 2024-01-04 jeremboo: why +1 ?
    this.surfaceOverrideMaterial.uniforms.maxSurfaceId.value = maxSurfaceId + 1;
  }

  getProps() {
    return {
      color: `#${(
        this.passMaterial.uniforms.outlineColor.value
      ).getHexString()}`,
      thickness: this.passMaterial.uniforms.thickness.value,
    };
  }

  /*
   * * *******************
   * * RENDERER
   * * *******************
   */

  render(
    renderer,
    writeBuffer
    // readBuffer: WebGLRenderTarget
  ) {
    // RenderPass
    renderer.setRenderTarget(this.passRender);
    renderer.clear();
    renderer.render(this.renderScene, this.renderCamera);

    // TODO 2024-01-04 jeremboo: Use the store for this
    this.setMaxSurfaceId(findSurfaces.surfaceId);

    // Turn off writing to the depth buffer
    // because we need to read from it in the subsequent passes.
    // const cachedDepthBufferValue = writeBuffer.depthBuffer;
    // writeBuffer.depthBuffer = false;

    // 1. Re-render the scene to capture all surface IDs in a texture.
    renderer.setRenderTarget(this.surfaceBuffer);
    renderer.clear();
    // const cachedOverrideMat = this.renderScene.overrideMaterial;
    this.renderScene.overrideMaterial = this.surfaceOverrideMaterial;
    renderer.render(this.renderScene, this.renderCamera);
    this.renderScene.overrideMaterial = null;

    // Update the uniforms
    (this.fsQuad.material).uniforms.surfaceBuffer.value =
      this.surfaceBuffer.texture;
    (this.fsQuad.material).uniforms.sceneColorBuffer.value =
      this.passRender.texture;

    // 2. Draw the outlines using the depth texture and normal texture
    // and combine it with the scene color
    if (this.renderToScreen) {
      // If this is the last effect, then renderToScreen is true.
      // So we should render to the screen by setting target null
      // Otherwise, just render into the writeBuffer that the next effect will use as its read buffer.
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
    }
    this.fsQuad.render(renderer, this.renderCamera);

    // Reset the depthBuffer value so we continue writing to it in the next render.
    // writeBuffer.depthBuffer = cachedDepthBufferValue;
  }
}
