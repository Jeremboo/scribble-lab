
import { Uniform, WebGLRenderTarget, LinearFilter, RGBAFormat } from "three";

import { Effect, EffectAttribute, RenderPass } from 'postprocessing';

import {
  BlendFunction,
  KernelSize
} from 'postprocessing';


const fragmentShader = `
  uniform sample2D maskTexture;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    outputColor = vec4(inputColor.rgb * weights, inputColor.a);

    if (inputColor.r > 0.5) {
      outputColor = texture2D(maskTexture, uv);
    } else {
      outputColor = vec4(0.0);
    }
  }
`;

export default class SelectiveBloomEffect extends Effect {
	constructor(selectiveScene, camera, {
    blendFunction = BlendFunction.NORMAL,
  }) {

    super('SelectiveBloomEffect', fragmentShader, {

      // attributes: EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH,

      uniforms : new Map([
        ['maskTexture', new Uniform(null)],
      ]),

		});

    this.selectiveScene = selectiveScene;
    this.camera = camera;


    // TODO limit the format if necessary
    this.renderTargetMask = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false,
			format: RGBAFormat
    });
    this.uniforms.get('maskTexture').value = this.renderTargetMask.texture;



    // Create the mask texture
    // The blured zones have to be in white.
    // The overs in black
    this.maskPass = new RenderPass(this.selectiveScene, this.camera);

    // // renderPass.renderToScreen = true;
    // this._composer.addPass(renderPass);

    // Add Bloom Effect
    // const bloomEffect = new BloomEffect({
		// 	blendFunction: BlendFunction.ADD,
    //   kernelSize: KernelSize.VERY_LARGE,
		// 	resolutionScale: 0.3,
    //   distinction: 1,
		// });
    // bloomEffect.blendMode.opacity.value = 2.1;



  }

  update(renderer, inputBuffer, deltaTime) {
    this.maskPass.render(renderer, this.renderTargetMask);
  }
}