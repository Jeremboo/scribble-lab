import {
  HalfFloatType,
  WebGLRenderTarget,
  Color,
  BufferGeometry,
  Mesh,
  Float32BufferAttribute,
  OrthographicCamera,
  NearestFilter,
  LinearFilter,
  ShaderMaterial,
} from 'three';
import {Pass} from 'postprocessing';
import gsap from 'gsap';
import findSurfaces from './surfaceFinder';
import OutlinePassMaterial, {
} from './OutlinePassMaterial';
import SurfaceMaterial from './SurfaceMaterial';

// Multipliers relative to the composer's drawing-buffer size (already includes
// device pixel ratio). >1 supersamples surface-ID / outline, then downsamples.
export const DPR = {
  canvas: 3,
  passRender: 3,
  surfaceRender: 3,
  outlineResolution: 3,
  antialiasing: true,
};

const blitVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const blitFragmentShader = /* glsl */ `
uniform sampler2D tDiffuse;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(tDiffuse, vUv);
}
`;


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
		// Geometry is shared across quads — do not dispose it here.
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

    this.width = 1;
    this.height = 1;

     // A buffer to render the surface we want to outline thanks to the surface material
    this.passRender = new WebGLRenderTarget();
    this.surfaceBuffer = new WebGLRenderTarget();
    // High-res outline composite; blitted down to the composer target when DPR > 1
    this.compositeBuffer = new WebGLRenderTarget();
    this.surfaceOverrideMaterial = new SurfaceMaterial();

  // NOTE 2024-01-04 jeremboo: If we need more outline, it maybe worth it to use this
  // normalOverrideMaterial = new MeshNormalMaterial();

    this.renderScene = scene;
    this.renderCamera = camera;

    this.thickness = props.thickness != null ? props.thickness : 1;
    this.passMaterial = new OutlinePassMaterial({ ...props, thickness: this.thickness });
    this.fsQuad = new FullScreenQuad(this.passMaterial);
    this.blitMaterial = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
      },
      vertexShader: blitVertexShader,
      fragmentShader: blitFragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    this.blitQuad = new FullScreenQuad(this.blitMaterial);

    // this.passRender.texture.format = RGBAFormat;
    // this.passRender.texture.type = HalfFloatType;
    this.passRender.texture.minFilter = LinearFilter;
    this.passRender.texture.magFilter = LinearFilter;
    // this.passRender.texture.generateMipmaps = false;
    // this.passRender.stencilBuffer = false;

    // Discrete surface IDs must not be linearly filtered
    this.surfaceBuffer.texture.type = HalfFloatType;
    this.surfaceBuffer.texture.minFilter = NearestFilter;
    this.surfaceBuffer.texture.magFilter = NearestFilter;
    // this.surfaceBuffer.texture.generateMipmaps = false;
    // this.surfaceBuffer.stencilBuffer = false;

    // Linear filter so the downsample blit softens supersampled edges
    this.compositeBuffer.texture.minFilter = LinearFilter;
    this.compositeBuffer.texture.magFilter = LinearFilter;
    // this.compositeBuffer.texture.generateMipmaps = false;
    // this.compositeBuffer.stencilBuffer = false;
  }

  dispose() {
    this.passRender.dispose();
    this.surfaceBuffer.dispose();
    this.compositeBuffer.dispose();
    this.fsQuad.dispose();
    this.blitQuad.dispose();
    this.blitMaterial.dispose();
    this.surfaceOverrideMaterial.dispose();
    this.passMaterial.dispose();
  }

  setSize(width, height) {
    // `width`/`height` are the composer's drawing-buffer size (CSS × pixelRatio).
    this.width = width;
    this.height = height;

    const passW = Math.max(1, Math.round(width * DPR.passRender));
    const passH = Math.max(1, Math.round(height * DPR.passRender));
    const surfaceW = Math.max(1, Math.round(width * DPR.surfaceRender));
    const surfaceH = Math.max(1, Math.round(height * DPR.surfaceRender));
    const outlineW = Math.max(1, Math.round(width * DPR.outlineResolution));
    const outlineH = Math.max(1, Math.round(height * DPR.outlineResolution));

    this.passRender.setSize(passW, passH);
    this.surfaceBuffer.setSize(surfaceW, surfaceH);
    this.compositeBuffer.setSize(outlineW, outlineH);
    // Neighbor offsets in the outline shader must match the surface-ID texel size
    this.passMaterial.resize(surfaceW, surfaceH);
    this.syncThickness();
  }

  syncThickness() {
    const scale = this.surfaceBuffer.width / Math.max(this.width, 1);
    this.passMaterial.uniforms.thickness.value = this.thickness * scale;
  }

  setDebugMode(isEnabled) {
    this.passMaterial.setDebugMode(isEnabled);
    this.surfaceOverrideMaterial.setDebugMode(isEnabled);
    this.renderScene.traverse((object) => {
      if (object.customSurfaceMaterial && object.customSurfaceMaterial.setDebugMode) {
        object.customSurfaceMaterial.setDebugMode(isEnabled);
      }
    });
  }

  setThickness(thickness) {
    this.thickness = thickness;
    this.syncThickness();
  }

  setColor(color, duration = 0.333) {
    const target = new Color(color).convertLinearToSRGB();
    const current = this.passMaterial.uniforms.outlineColor.value;
    gsap.killTweensOf(current);
    if (duration <= 0) {
      current.copy(target);
      return;
    }
    gsap.to(current, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration,
    });
  }

  setMaxSurfaceId(maxSurfaceId) {
    // TODO 2024-01-04 jeremboo: why +1 ?
    const value = maxSurfaceId + 1;
    this.surfaceOverrideMaterial.uniforms.maxSurfaceId.value = value;
    this.renderScene.traverse((object) => {
      if (object.customSurfaceMaterial && object.customSurfaceMaterial.uniforms.maxSurfaceId) {
        object.customSurfaceMaterial.uniforms.maxSurfaceId.value = value;
      }
    });
  }

  getProps() {
    return {
      color: `#${(
        this.passMaterial.uniforms.outlineColor.value
      ).getHexString()}`,
      thickness: this.thickness,
    };
  }

  /*
   * * *******************
   * * RENDERER
   * * *******************
   */

  render(
    renderer,
    inputBuffer,
    outputBuffer
  ) {
    // RenderPass
    renderer.setRenderTarget(this.passRender);
    renderer.clear();
    renderer.render(this.renderScene, this.renderCamera);

    // TODO 2024-01-04 jeremboo: Use the store for this
    this.setMaxSurfaceId(findSurfaces.surfaceId);

    // 1. Re-render the scene to capture all surface IDs in a texture.
    // Meshes with customSurfaceMaterial (e.g. displaced ground) keep their
    // own surface shader so outlines match the visible geometry.
    renderer.setRenderTarget(this.surfaceBuffer);
    renderer.clear();

    const materialCache = [];
    this.renderScene.traverse((object) => {
      if (!object.isMesh) return;
      materialCache.push([object, object.material]);
      object.material = object.customSurfaceMaterial || this.surfaceOverrideMaterial;
    });
    renderer.render(this.renderScene, this.renderCamera);
    materialCache.forEach(([object, material]) => {
      object.material = material;
    });

    // Update the uniforms
    (this.fsQuad.material).uniforms.surfaceBuffer.value =
      this.surfaceBuffer.texture;
    (this.fsQuad.material).uniforms.sceneColorBuffer.value =
      this.passRender.texture;

    // 2. Draw the outlines at outline/surface resolution, then composite down
    // to the composer target so supersampled silhouettes get a linear resolve.
    const supersampled =
      this.compositeBuffer.width !== this.width ||
      this.compositeBuffer.height !== this.height;

    if (supersampled) {
      renderer.setRenderTarget(this.compositeBuffer);
      renderer.clear();
      this.fsQuad.render(renderer);

      this.blitMaterial.uniforms.tDiffuse.value = this.compositeBuffer.texture;
      if (this.renderToScreen) {
        renderer.setRenderTarget(null);
      } else {
        renderer.setRenderTarget(outputBuffer);
      }
      this.blitQuad.render(renderer);
      return;
    }

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(outputBuffer);
    }
    this.fsQuad.render(renderer);
  }
}
