import { ShaderMaterial, Color, TextureLoader } from 'three'
import { TweenLite } from 'gsap'
import { GUI } from 'dat.gui'

import blobFragmentShader from './fragment.glsl'

import { getRandomFloat, getRandomInt, mixColors, getRandomColor } from '../../../modules/utils'

const texture = './assets/texture.jpg'

const TRANSITION_DURATION = 0.5;
const PARAMS = [
  {
    name: 'sinAmpl',
    min: -1.5,
    max: 2.2,
  },
  {
    name: 'sinFrequency',
    min: -2,
    max: 8,
  },
  {
    name: 'sin',
    min: -0.2,
    max: 0.2,
    type: 'speed',
  },
  {
    name: 'pNoiseAmpl',
    min: -1,
    max: 2,
  },
  {
    name: 'pNoiseFrequency',
    min: -2,
    max: 3,
  },
  {
    name: 'pNoise',
    min: -0.1,
    max: 0.1,
    type: 'speed',
  },
  {
    name: 'scatterAmpl',
    min: -1,
    max: 6,
  },
  {
    name: 'scatterScale',
    min: -0.1,
    max: 0.8,
  },
  {
    name: 'scatter',
    min: -0.1,
    max: 0.1,
    type: 'speed',
  },
  {
    name: 'diffuse',
    min: -0.5,
    max: 0.5,
    type: 'color',
  },
  {
    name: 'pink',
    type: 'color',
  },
  {
    name: 'blue',
    type: 'color',
  },
  {
    name: 'intensityColor',
    min: 0.4,
    max: 1.5,
  },
  {
    name: 'mixColorGauge',
    min: -2,
    max: 1,
  },
  {
    name: 'noisyColor',
    min: -0.5,
    max: 0.03,
  },
  {
    name: 'rotation',
    min: -0.05,
    max: 0.05,
    type: 'speed',
  },
  {
    name: 'rotationX',
    min: -20,
    max: 20,
  },
  {
    name: 'blendDistance',
    min: 0.1,
    max: 6,
  },
];


const COLORS = {
  diffuse: '#ffffff',
  blue: '#5E5E5E',
  pink: '#DFDFDF',
};
const SPEED = {
  sin: 0.01,
  pNoise: 0.01,
  scatter: 0.03,
  rotation: 0.0001,
};
const BLOB_VALUES = {
  sinAmpl: 0,
  sinFrequency: 2.1,
  sinSpeed: 0.015,
  // perlinNoise
  pNoiseAmpl: 0,
  pNoiseFrequency: 0.401,
  pNoiseSpeed: 0.001,
  // scatter
  scatterAmpl: 4.5,
  scatterScale: 0.05,
  scatterSpeed: 0,
  // blendDistance
  blendDistance: 3,
  // Colors
  diffuseColor: COLORS.diffuse,
  intensityColor: 1.3,
  pinkColor: COLORS.pink,
  blueColor: COLORS.blue,
  mixColorGauge: 1,
  noisyColor: -0.02,
  // Rotation
  rotationSpeed: 0.01,
  rotationX: 0.001,
};

export default class Blob {
  constructor() {
    this.timer = 0;
    this.speed = Object.assign({}, SPEED)
    this.colors = Object.assign({}, COLORS)

    this.material = new ShaderMaterial({
      fragmentShader: blobFragmentShader,
      vertexShader: 'void main() {gl_Position =  vec4( position, 1.0 );}',
      uniforms: {
        map: { type: 't', value: null },
        // Seeds
        seed_1: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_2: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_3: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_4: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_5: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_6: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_7: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_8: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_9: { type: 'f', value: getRandomFloat(-1, 1) },
        seed_10: { type: 'f', value: getRandomFloat(-1, 1) },
        // cameraRadius
        cameraRadius: { type: 'float', value: 30 },
        // sinuzoide
        sinAmpl: { type: 'f', value: BLOB_VALUES.sinAmpl },
        sinFrequency: { type: 'f', value: BLOB_VALUES.sinFrequency },
        sinSpeed: { type: 'f', value: BLOB_VALUES.sinSpeed },
        // perlinNoise
        pNoiseAmpl: { type: 'f', value: BLOB_VALUES.pNoiseAmpl },
        pNoiseFrequency: { type: 'f', value: BLOB_VALUES.pNoiseFrequency },
        pNoiseSpeed: { type: 'f', value: BLOB_VALUES.pNoiseSpeed },
        // scatter
        scatterAmpl: { type: 'f', value: BLOB_VALUES.scatterAmpl },
        scatterScale: { type: 'f', value: BLOB_VALUES.scatterScale },
        scatterSpeed: { type: 'f', value: BLOB_VALUES.scatterSpeed },
        // blendDistance
        blendDistance: { type: 'f', value: BLOB_VALUES.blendDistance },
        // Colors
        diffuseColor: { type: 'v3', value: new Color(COLORS.diffuse) },
        intensityColor: { type: 'float', value: BLOB_VALUES.intensityColor },
        pinkColor: { type: 'v3', value: new Color(COLORS.pink) },
        blueColor: { type: 'v3', value: new Color(COLORS.blue) },
        mixColorGauge: { type: 'float', value: BLOB_VALUES.mixColorGauge },
        noisyColor: { type: 'float', value: BLOB_VALUES.noisyColor },
        // Rotation
        rotationSpeed: { type: 'float', value: BLOB_VALUES.rotationSpeed },
        rotationX: { type: 'float', value: BLOB_VALUES.rotationX },
      },
    })

    const loader = new TextureLoader()
    loader.load(texture, (textr) => {
      this.material.uniforms.map.value = textr
    }, (e) => { console.log(e); })

    this.update = this.update.bind(this)

    // this.initAllRandomly();
  }

  initGUI() {
    // GUI
    const gui = new GUI()
    gui.close()

    // Blend Distance
    gui.add(this.material.uniforms.blendDistance, 'value', 0.001, 5).name('blendDistance').listen()

    // Sinuzoide
    const sinFolder = gui.addFolder('Sinuzoide')
    sinFolder.open()
    sinFolder.add(this.material.uniforms.sinAmpl, 'value', 0, 2).name('Ampl').listen()
    sinFolder.add(this.material.uniforms.sinFrequency, 'value', 0, 10).name('Frequency').listen()
    sinFolder.add(this.speed, 'sin', -0.2, 0.2).name('speed').listen()

    // PerlinNoise
    const perlinNoiseFolder = gui.addFolder('Perlin Noise')
    perlinNoiseFolder.open()
    perlinNoiseFolder.add(this.material.uniforms.pNoiseAmpl, 'value', 0, 2).name('Ampl').listen()
    perlinNoiseFolder.add(this.material.uniforms.pNoiseFrequency, 'value', 0, 4).name('Frequency').listen()
    perlinNoiseFolder.add(this.speed, 'pNoise', -0.05, 0.05).name('speed').listen()

    // Scatter
    const scatterFolder = gui.addFolder('Scatter')
    scatterFolder.open()
    scatterFolder.add(this.material.uniforms.scatterAmpl, 'value', 0.01, 10).name('Ampl').listen()
    scatterFolder.add(this.material.uniforms.scatterScale, 'value', 0, 0.8).name('Scale').listen()
    scatterFolder.add(this.speed, 'scatter', 0, 0.5).name('speed').listen()

    // Colors
    const colorsFolder = gui.addFolder('Colors')
    colorsFolder.open()
    colorsFolder.addColor(this.colors, 'diffuse').listen().onChange(() => {
      this.material.uniforms.diffuseColor.value = new Color(this.colors.diffuse)
    })
    colorsFolder.addColor(this.colors, 'pink').listen().onChange(() => {
      this.material.uniforms.pinkColor.value = new Color(this.colors.pink)
    })
    colorsFolder.addColor(this.colors, 'blue').listen().onChange(() => {
      this.material.uniforms.blueColor.value = new Color(this.colors.blue)
    })
    colorsFolder.add(this.material.uniforms.intensityColor, 'value', 0.6, 1.5).name('intensity').listen()
    colorsFolder.add(this.material.uniforms.mixColorGauge, 'value', -2, 1).name('mixGauge').listen()
    colorsFolder.add(this.material.uniforms.noisyColor, 'value', -0.5, 0.03).name('noisyColor').listen()

    // Rotation
    const rotationFolder = gui.addFolder('Rotation')
    rotationFolder.open()
    rotationFolder.add(this.speed, 'rotation', -0.05, 0.05).name('speed').listen()
    rotationFolder.add(this.material.uniforms.rotationX, 'value', -20, 20).name('y').listen()
  }

  /**
   * *********
   * INCREMENTATION
   * *********
   */
  incrementSpeed(attributeName, value, props) {
    const targetedValue = this.speed[attributeName] + ((value - this.speed[attributeName]));
    this.animateSpeed(attributeName, targetedValue, props);
  }

  incrementUniform(uniformName, value, props) {
    const targetedValue = this.material.uniforms[uniformName].value + ((value - this.material.uniforms[uniformName].value));
    this.animateUniform(uniformName, targetedValue, props);
  }

  incrementColor(colorName, hexa) {
    const hexaBase = COLORS[colorName];
    const hexaMixed = mixColors(hexa.substr(1), hexaBase.substr(1), getRandomInt(1, 80));
    this.animateColor(colorName, hexaMixed);
  }

  /**
   * *********
   * ANIMATIONS
   * *********
   */
  animateSpeed(attributeName, value) {
    TweenLite.to(this.speed, TRANSITION_DURATION, { [attributeName]: value, ease: Power0.noEase });
  }

  animateUniform(uniformName, value) {
    value *= (1 + this.range);
    // console.log('Set', uniformName, 'from', this.material.uniforms[uniformName].value, 'to', value);
    TweenLite.to(
      this.material.uniforms[uniformName],
      TRANSITION_DURATION,
      { value, ease: Power0.noEase },
    );
  }

  animateColor(colorName, color) {
    TweenLite.to(this.colors, TRANSITION_DURATION, { [colorName]: color,
      ease: Power0.noEase,
      onUpdate: () => {
        const c = new Color(this.colors[colorName]);
        this.material.uniforms[`${colorName}Color`].value = c;
        COLORS[colorName] = c.getHexString();
      },
    });
  }

  /**
   * *********
   * SETTERS / GETTERS
   * *********
   */

  setRandomly(idx) {
    const paramSelected = PARAMS[idx];
    const { type, name, min, max } = paramSelected;
    switch (type) {
      case 'speed':
        this.incrementSpeed(name, getRandomFloat(min, max));
        break;
      case 'color':
        // TODO add an array of colors
        const color = getRandomColor();
        this.incrementColor(name, color)
        break;
      default:
        this.incrementUniform(name, getRandomFloat(min, max));
        break;
    }
  }

  initAllRandomly() {
    for (let i = 0; i < PARAMS.length; i++) {
      this.setRandomly(i);
    }
  }

  /**
   * *********
   * UPDATE
   * *********
   */
  update() {
    this.timer += 0.05;
    this.range = (Math.sin(1 + this.timer) + Math.sin(2.4 + (this.timer * 1.5))) * 0.1;

    const r = 0.8 + this.range;
    if (Math.random() > r) {
      this.setRandomly(getRandomInt(0, PARAMS.length - 1))
    }

    this.material.uniforms.sinSpeed.value += this.speed.sin
    this.material.uniforms.pNoiseSpeed.value += this.speed.pNoise
    this.material.uniforms.scatterSpeed.value += this.speed.scatter
    this.material.uniforms.rotationSpeed.value += this.speed.rotation
  }
}
