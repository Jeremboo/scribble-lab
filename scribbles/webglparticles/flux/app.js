import {
  Mesh, ShaderMaterial, Color, Fog,ShaderLib, Vector2, Vector3
} from 'three';
import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';
import gsap from 'gsap';

import Renderer from '../../../modules/Renderer.three';
import CameraMouseControl from '../../../modules/CameraMouseControl';
import InstancedGeom, { createPlaneBuffer } from '../../../modules/InstancedGeom';

import { getRandomFloat } from '../../../utils';
import { rotate2D } from '../../../utils/glsl';

const PROPS = {
  mainColor: '#C8F6F5',
  bgColor: '#030706',
  mouseMove: [-1.5, -1],
  mouseVelocity: [0.1, 0.2],
  fogNear: 2,
  fogFar: 20,
  // particle
  scale: 0.015,
  // flux
  nbr: 10000,
  speed: 0.0005,
  speedVariation: 3,
  radius: 1.2,
  origin: new Vector2(5.3, 0.5),
  direction: new Vector3(-7.3, -4, 20),
  curveStrength: 1.2,
  spinLength: 5,
  spinScale: 10,
  spinStrenth: 0.07,
  curveWave: 1,
};

class Flux extends Mesh {
  constructor(color, nbr, scale, speed) {
    const instanciedGeom = new InstancedGeom(createPlaneBuffer(), nbr);

    // PROPS
    const variationAttribute = instanciedGeom.createAttribute('_variation', 2);
    const progressAttribute = instanciedGeom.createAttribute('_progress', 1);
    const speedAttribute = instanciedGeom.createAttribute('_speed', 1);

    for (let i = 0; i < nbr; i++) {
      // position
      const angle = Math.PI * Math.random() * 2;
      const scalar = getRandomFloat(-scale, scale)
      const x = Math.cos(angle) * scalar;
      const y = Math.sin(angle) * scalar;
      // const x = getRandomFloat(-PROPS.radius, PROPS.radius);
      // const y = getRandomFloat(-PROPS.radius, PROPS.radius);
      variationAttribute.setXY(i, x, y);
      // progress
      progressAttribute.setX(i, getRandomFloat(0, 1));
      // speed
      speedAttribute.setX(i, getRandomFloat(1, PROPS.speedVariation));
    }

    // Extract from ShaderLib the necessary uniforms
    const { fogColor, fogDensity, fogFar, fogNear } = ShaderLib.basic.uniforms;

    const material = new ShaderMaterial({
      // wireframe: true,
      fog: true,
      uniforms: {
        fogColor, fogDensity, fogFar, fogNear,
        color: { value: new Color(color) },
        scale: { value: PROPS.scale },
        time: { value: 0 },
        origin: { value: PROPS.origin },
        direction: { value: PROPS.direction },
        spinLength: { value: PROPS.spinLength },
        spinScale: { value: PROPS.spinScale },
        spinStrenth: { value: PROPS.spinStrenth },
        curveStrength: { value: PROPS.curveStrength },
        curveWave: { value: PROPS.curveWave },
        fadeOut: { value: 0 }
      },
      fragmentShader: `
        uniform vec3 color;
        varying vec2 vUv;

        #include <fog_pars_fragment>

        void main() {

          // Circle without texture
          if ( length( vUv - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
				  gl_FragColor = vec4( color, 1.0 );

          #include <fog_fragment>
        }
      `,
      vertexShader: `
        attribute vec2 _variation;
        attribute float _progress;
        attribute float _speed;

        uniform float scale;
        uniform float time;
        uniform vec2 origin;
        uniform vec3 direction;
        uniform float spinLength;
        uniform float spinScale;
        uniform float spinStrenth;
        uniform float curveStrength;
        uniform float curveWave;
        uniform float fadeOut;

        varying vec2 vUv;

        #include <fog_pars_vertex>
        ${rotate2D}

        void main () {
          vUv = vec2(
            position.x * 0.5 + 0.5,
            position.y * 0.5 + 0.5
          );

          // From -0.5 to 0.5
          float progress = fadeOut + mod(_progress + time * _speed, 1.0) - 0.5;

          // vec3 pos = vec3(
          //   cos(progress * 100.) * 0.01,
          //   sin(progress * 100.) * 0.01,
          //   direction.z * progress
          // );
          vec3 pos = direction * progress;
          pos.xy += rotate2D(pos.xy, progress * curveStrength);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          // Scale
          mvPosition.xyz += position * scale;

          // Variation
          mvPosition.xy += origin + _variation;

          // Spin
          // mvPosition.xy += rotate2D(spinScale + _variation, progress * spinLength) * spinStrenth;

          gl_Position = projectionMatrix * mvPosition;

          #include <fog_vertex>
        }
      `,
    });
    super(instanciedGeom, material);

    this.speed = speed;

    this.update = this.update.bind(this);
  }

  update({ playhead }) {
    this.material.uniforms.time.value -= this.speed;
  }
}

canvasSketch(({ context }) => {
  const renderer = new Renderer({ canvas: context.canvas });
  renderer.setClearColor(PROPS.bgColor, 1);
  renderer.scene.fog = new Fog(new Color(PROPS.bgColor), PROPS.fogNear, PROPS.fogFar);

  const cameraControl = new CameraMouseControl(renderer.camera,
    { mouseMove : PROPS.mouseMove, velocity: PROPS.mouseVelocity}
    );

  // * START *****
  const flux = new Flux(PROPS.mainColor, PROPS.nbr, PROPS.radius, PROPS.speed);
  renderer.add(flux);

  const flux2 = new Flux('#E35E55', PROPS.nbr * 0.5, PROPS.radius * 0.4, PROPS.speed * 1.5);
  renderer.add(flux2);

  const flux3 = new Flux('#27E0FD', PROPS.nbr * 0.5, PROPS.radius * 0.4, PROPS.speed * 1.5);
  flux3.material.uniforms.fadeOut.value = -1;
  renderer.add(flux3);


  // * GUI *******

  const duration = 2;
  let tm = gsap.timeline();
  let idx = 0;


  const debugs = {
    transition: () => {
      tm.kill();
      tm = gsap.timeline();
      tm.to(flux, { speed: PROPS.speed * 3, duration: duration * 0.2 }, 0);
      tm.to(flux, { speed: PROPS.speed, duration: duration * 0.5 }, duration * 0.5);

      idx += 1;
      let currentFlux = flux3;
      let nextFlux = flux2;
      if ((idx % 2) === 1) {
        currentFlux = flux2;
        nextFlux = flux3;
      }

      // Change the flux
      tm.set(nextFlux.material.uniforms.fadeOut, { value: 1 }, 0);
      tm.to(currentFlux.material.uniforms.fadeOut, { value: -1, duration, ease: 'power1.in'}, 0);
      tm.to(nextFlux.material.uniforms.fadeOut, { value: 0, duration, ease: 'poser2.out'}, 0);

    }
  }



  const gui = new GUI();
  gui.hide();
  // gui.add(debugs, 'transition');
  const fluxFolder = gui.addFolder('Flux');
  // fluxFolder.open();
  fluxFolder.add(PROPS.origin, 'x', -10, 10).name('originX');
  fluxFolder.add(PROPS.origin, 'y', -10, 10).name('originY');
  fluxFolder.add(PROPS.direction, 'x', -15, 0).name('angleX');
  fluxFolder.add(PROPS.direction, 'y', -15, 0).name('angleY');
  fluxFolder.add(flux.material.uniforms.spinLength, 'value', -5, 5).name('spinLength');
  fluxFolder.add(flux.material.uniforms.spinScale, 'value', -1, 20).name('spinScale');
  fluxFolder.add(flux.material.uniforms.spinStrenth, 'value', -0.5, 0.5).name('spinStrenth');
  fluxFolder.add(flux.material.uniforms.curveStrength, 'value', -50, 50).name('curveStrength');
  fluxFolder.add(flux.material.uniforms.curveWave, 'value', -3, 3).name('curveWave');

  // Interaction
  document.addEventListener('click', debugs.transition);

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.resize(viewportWidth, viewportHeight);
    },
    render(props) {
      cameraControl.update();
      renderer.update(props);
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
}, {
  fps: 15, // 24
  duration: 4,
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
