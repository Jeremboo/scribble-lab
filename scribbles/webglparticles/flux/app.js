import {
  Mesh, ShaderMaterial, Color, Fog,ShaderLib, Vector3, Object3D,
} from 'three';
import canvasSketch from 'canvas-sketch';
import dat, { GUI } from 'dat.gui';
import imageController from 'dat.gui.image';
import gsap from 'gsap';

import PostProcessingRenderer from '../../../modules/PostProcessingRenderer.three';
import CameraMouseControl from '../../../modules/CameraMouseControl';
import InstancedGeom, { createPlaneBuffer } from '../../../modules/InstancedGeom';

import { getRandomFloat } from '../../../utils';
import { rotate2D } from '../../../utils/glsl';

import { applyImageToCanvas } from '../../../utils/canvas';

import Pass from './Pass';

const textureUrl = './assets/flow-texture.png';

imageController(dat);

const PROPS = {
  mainColor: '#C8F6F5',
  bgColor: '#030706',
  // mouseMove: [0, 0],
  mouseMove: [-0.2, -0.2],
  mouseVelocity: [0.1, 0.2],
  fogNear: 2,
  fogFar: 20,
  // particle
  scale: 0.005, // 0.0015,
  // flux
  nbr: 50000,
  speed: 0.00005,
  speedVariation: 3,
  origin: new Vector3(3.9, 1.5, 1.5),
  direction: new Vector3(-14, -7.8, 16),
  radius: 2.5,
  variationTexture: textureUrl,
  centralTorsion: 10,
  rotationSpeed: 12,
  waveShift: 1.8,
  waveLength: 5,
  waveStrenght: 1.5,
};

class Flux extends Mesh {
  constructor({
    color = PROPS.mainColor,
    nbr = PROPS.nbr,
    radius = PROPS.radius,
    speed = PROPS.speed,
    rotationSpeed = PROPS.rotationSpeed,
    imageData,
    imageDataSize,
  } = {}) {
    const instanciedGeom = new InstancedGeom(createPlaneBuffer(), nbr);

    // PROPS
    const variationAttribute = instanciedGeom.createAttribute('_variation', 2);
    const progressAttribute = instanciedGeom.createAttribute('_progress', 1);
    const speedAttribute = instanciedGeom.createAttribute('_speed', 1);

    const getPositionFromTexture = () => {
      const x = Math.random();
      const y = Math.random();
      const pixelX = Math.floor(imageDataSize * x);
      const pixelY = Math.floor(imageDataSize * y);
      const pixelIdx = ((pixelY * imageDataSize) + pixelX) * 4
      const color = imageData[pixelIdx] / 255;
      return Math.random() < color ? { x, y: 1 - y } : getPositionFromTexture();
    };

    for (let i = 0; i < nbr; i++) {
      const { x, y } = getPositionFromTexture();
      variationAttribute.setXY(i, x, y);

      // progress
      // TODO 2021-11-01 jeremboo: En mettre un peu plus au début qu'a la fin
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
        radius: { value: radius },
        direction: { value: PROPS.direction },
        centralTorsion: { value: PROPS.centralTorsion },
        rotationSpeed: { value: rotationSpeed },
        waveShift: { value: PROPS.waveShift },
        waveLength: { value: PROPS.waveLength },
        waveStrenght: { value: PROPS.waveStrenght },
        // TRANSITION
        time: { value: 0 },
        fadeOut: { value: 0 },
        particleSpeed: { value: 0 },
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
        uniform vec3 direction;
        uniform float centralTorsion;
        uniform float rotationSpeed;
        uniform float waveShift;
        uniform float waveLength;
        uniform float waveStrenght;
        uniform float radius;

        uniform float particleSpeed;

        uniform float fadeOut;

        varying vec2 vUv;

        #include <fog_pars_vertex>
        ${rotate2D}

        void main () {
          vUv = vec2(
            position.x * 0.5 + 0.5,
            position.y * 0.5 + 0.5
          );

          // The position in the flux from -0.5 to 0.5
          float progress = fadeOut + mod(_progress + time * _speed + (particleSpeed * _speed * 2.), 1.0) - 0.5;

          // Define the transformed position
          vec3 transformed = position;

          // Scale
          transformed *= scale;

          // Apply a unique position in the flux based on progress and the direction needed
          transformed += direction * progress;

          // Rotate around the central axis
          vec2 var = rotate2D(_variation, progress * centralTorsion + (time * rotationSpeed)) * radius;

          // Wavy flux
          var.xy += cos((waveShift + progress) * waveLength) * waveStrenght;

          // Apply the unique variations from X and Y for each particles
          transformed.xy += var;

          // TODO: clearly transform that in a global rotation for the entire tube (I'm sure there is a better whay)
          // transformed.xy += rotate2D(transformed.xy, progress * curveStrength);

          // TODO: recreate a computation to make the particles rotate around the center of the curved line. This line belo doesn't work anymore
          // transformed.xy += rotate2D(spinScale + _variation, progress * spinLength) * spinStrenth;

          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
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

canvasSketch(async ({ context }) => {
  const renderer = new PostProcessingRenderer({ canvas: context.canvas });
  renderer.setClearColor(PROPS.bgColor, 1);
  renderer.scene.fog = new Fog(new Color(PROPS.bgColor), PROPS.fogNear, PROPS.fogFar);

  const cameraControl = new CameraMouseControl(renderer.camera,
    { mouseMove : PROPS.mouseMove, velocity: PROPS.mouseVelocity}
    );

  // Post processing
  const postProcessingPass = new Pass();
  renderer.addPass(postProcessingPass);



  // FLUX
  const wrapper = new Object3D();
  wrapper.position.x = PROPS.origin.x;
  wrapper.position.y = PROPS.origin.y;
  wrapper.position.z = PROPS.origin.z;
  wrapper.update = (props) => {
    for (let i = 0; i < wrapper.children.length; i++) {
      wrapper.children[i].update(props);
    }
  };
  renderer.add(wrapper);

  const { getImageData, canvas } = await applyImageToCanvas(textureUrl);

  const imageData = getImageData();

  const globalProps = {
    imageData: imageData,
    imageDataSize: canvas.width,
    imageDataHeight: canvas.height
  }

  // * START *****
  const flux = new Flux({
    ...globalProps
  });
  wrapper.add(flux);

  const flux2 = new Flux({
    color: '#E35E55',
    nbr: PROPS.nbr * 0.5,
    radius: PROPS.radius * 0.8,
    speed: PROPS.speed * 2,
    rotationSpeed: PROPS.rotationSpeed / 2,
    ...globalProps
  });
  wrapper.add(flux2);

  const flux3 = new Flux({
    color: '#27E0FD',
    nbr: PROPS.nbr * 0.5,
    radius: PROPS.radius * 0.8,
    speed: PROPS.speed * 2,
    rotationSpeed: PROPS.rotationSpeed / 2,
    ...globalProps
  });
  flux3.material.uniforms.fadeOut.value = -1;
  wrapper.add(flux3);


  // * TRANSITION *******

  const duration = 4;
  let tm = gsap.timeline();
  let idx = 0;

  const debugs = {
    transition: () => {
      tm.kill();
      tm = gsap.timeline();

      const currentParticleSpeed = flux.material.uniforms.particleSpeed.value;
      tm.to(flux.material.uniforms.particleSpeed, { value: currentParticleSpeed - 0.04, duration, ease: 'power2.inOut' })

      idx += 1;
      let currentFlux = flux3;
      let nextFlux = flux2;
      if ((idx % 2) === 1) {
        currentFlux = flux2;
        nextFlux = flux3;
      }

      // Change the flux
      tm.set(nextFlux.material.uniforms.fadeOut, { value: 1 }, 0);
      tm.to(currentFlux.material.uniforms.fadeOut, { value: -1, duration, ease: 'power2.inOut'}, 0);
      tm.to(nextFlux.material.uniforms.fadeOut, { value: 0, duration, ease: 'power2.inOut'}, 0);
    }
  }

  document.addEventListener('click', debugs.transition);


  // * GUI *******

  const gui = new GUI();
  gui.hide();
  const fluxFolder = gui.addFolder('Flux');
  const positionFolder = fluxFolder.addFolder('origin');
  positionFolder.add(wrapper.position, 'x', -5, 5);
  positionFolder.add(wrapper.position, 'y', -5, 5);
  positionFolder.add(wrapper.position, 'z', -5, 5);
  const directionFolder = fluxFolder.addFolder('direction');
  directionFolder.add(PROPS.direction, 'x', -15, 0)
  directionFolder.add(PROPS.direction, 'y', -15, 0)
  directionFolder.add(PROPS.direction, 'z', 1, 50)
  fluxFolder
  .addImage(PROPS, 'variationTexture')
  .name('variation texture')
  .listen()
  .onChange((image, firstTime) => {
    console.log('image', image);
    // TODO 2021-11-02 jeremboo: Use the image as transition
    if (firstTime) return;
  });
  fluxFolder.add(flux.material.uniforms.radius, 'value', 1, 3).name('radius');
  fluxFolder.add(flux.material.uniforms.centralTorsion, 'value', 0, 20).name('centralTorsion');
  fluxFolder.add(flux.material.uniforms.rotationSpeed, 'value', 0, 100).name('rotationSpeed');
  fluxFolder.add(flux.material.uniforms.waveShift, 'value', 0, 1).name('waveShift');
  fluxFolder.add(flux.material.uniforms.waveLength, 'value', 0, 30).name('waveLength');
  fluxFolder.add(flux.material.uniforms.waveStrenght, 'value', 0, 1.5).name('waveStrenght');

  return {
    resize(props) {
      renderer.resize(props);
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
