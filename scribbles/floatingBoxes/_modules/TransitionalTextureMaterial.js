import { ShaderMaterial, Vector2 } from 'three';
import { TweenLite } from 'gsap';

export default class TransitionalTextureMaterial extends ShaderMaterial {
  constructor(texture1, texture2, distortionTexture, { isVideo = false, transitionDuration = 5 } = {}) {
    super({
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float u_transition;

        uniform sampler2D u_texture1;
        uniform sampler2D u_texture2;

        uniform float u_distortionForce;
        uniform vec2 u_distortionOrientation;
        uniform sampler2D u_distortionMap;

        varying vec2 vUv;

        // https://www.shadertoy.com/view/MsX3DN
        // 	uvw.z = 1 - abs(1 - 2 * progress);
        // https://catlikecoding.com/unity/tutorials/flow/texture-distortion

        void main() {
          // https://stackoverflow.com/questions/19664777/threejs-rotate-texture-using-fragment-shader
          // float mid = 0.5;
          // float u_rotation = -1.;
          // float sinFactor = sin(u_rotation);
          // float cosFactor = cos(u_rotation);
          // vec2 rotatedUv = vec2(
          //   cosFactor * (vUv.x - mid) + sinFactor * (vUv.y - mid) + mid,
          //   cosFactor * (vUv.y - mid) - sinFactor * (vUv.x - mid) + mid
          // );


          // distor part
          vec2 distortionMap = texture2D(u_distortionMap, vUv).xy;
          vec2 distordedUv = vUv * distortionMap;
          vec4 video1 = texture2D(u_texture1, vUv + (distordedUv * u_distortionForce * u_distortionOrientation));
          vec4 video2 = texture2D(u_texture2, vUv + (distordedUv * u_distortionForce * u_distortionOrientation));
          // vec4 video1 = texture2D(u_texture1, vUv + (distordedUv * u_transition * u_distortionOrientation));
          // vec4 video2 = texture2D(u_texture2, vUv + (distordedUv * (1. - u_transition) * u_distortionOrientation));

          gl_FragColor = mix(video1, video2, u_transition);
          // gl_FragColor = distortionMap;
        }
      `,
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
