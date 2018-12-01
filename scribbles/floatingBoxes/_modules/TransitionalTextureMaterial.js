import { ShaderMaterial, Vector2 } from 'three';
import { TweenLite } from 'gsap';

import fragTextureTransition from './shaders/textureTransition.f.glsl';
import vertTextureTransition from './shaders/textureTransition.v.glsl';

export default class TransitionalTextureMaterial extends ShaderMaterial {
  constructor(texture1, texture2, distortionTexture, { isVideo = false, transitionDuration = 5 } = {}) {
    super({
      vertexShader: vertTextureTransition,
      fragmentShader: fragTextureTransition,
      uniforms: {
        u_transition: { value: 0 },
        u_texture1: { value: texture1 },
        u_texture2: { value: texture2 },

        u_distortionForce: { value: 0 },
        u_distortionMap: { value: distortionTexture },
        u_distortionOrientation: { value: new Vector2(1, 1) },
      },
      // depthWrite: false,
    });

    this.isVideo = isVideo;
    this.toggled = false;
    this.animation = TweenLite.to(this.uniforms.u_transition, transitionDuration, {
      value: 1,
      paused: true,
      onComplete: () => {
        if (this.isVideo) this.uniforms.u_texture1.value.image.pause(0);
      },
      onReverseComplete: () => {
        if (this.isVideo) this.uniforms.u_texture2.value.image.pause(0);
      },
    });
  }

  switch() {
    if (this.toggled) {
      if (this.isVideo) this.uniforms.u_texture1.value.image.play();
      this.animation.reverse();
    } else {
      if (this.isVideo) this.uniforms.u_texture2.value.image.play();
      this.animation.play();
    }
    this.toggled = !this.toggled;
  }
}
