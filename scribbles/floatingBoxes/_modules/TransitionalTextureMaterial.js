import { ShaderMaterial } from 'three';
import { TweenLite } from 'gsap';

import fragTextureTransition from './shaders/textureTransition.f.glsl';
import vertTextureTransition from './shaders/textureTransition.v.glsl';

export default class TransitionalTextureMaterial extends ShaderMaterial {
  constructor(texture1, texture2, { isVideo = false, transitionDuration = 1 } = {}) {
    super({
      vertexShader: vertTextureTransition,
      fragmentShader: fragTextureTransition,
      uniforms: {
        u_transition: { value: 0 },
        u_texture1: { value: texture1 },
        u_texture2: { value: texture2 },
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
