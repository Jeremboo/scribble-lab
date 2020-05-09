import {
  SphereGeometry, ShaderMaterial, Mesh,
  Color, DoubleSide,
} from 'three';

import props, { gui } from './props';
import { blobVert, blobFrag } from './shaders.glsl';

export default class Blob extends Mesh {
  constructor() {
    const geometry = new SphereGeometry(4, 64, 64);
    // geometry.scale(1, 1, 1);

    const material = new ShaderMaterial({
      vertexShader: blobVert,
      fragmentShader: blobFrag,
      uniforms: {
        shapeAmplitude: { type: 'f', value: props.SHAPE_AMPLITUDE },
        shapeComplexity: { type: 'f', value: props.SHAPE_COMPLEXITY },
        shapeTimer: { type: 'f', value: 0 },
        color: { type: 'v3', value: new Color(props.COLOR_MAIN) },
        color2: { type: 'v3', value: new Color(props.COLOR_SECONDARY) },
        colorRange: { type: 'f', value: props.COLOR_RANGE },
        colorComplexity: { type: 'f', value: props.COLOR_COMPLEXITY },
        colorAmplitude: { type: 'f', value: props.COLOR_AMPLITUDE },
        colorTimer: { type: 'f', value: 10 },
        alphaRange: { type: 'f', value: props.ALPHA_RANGE },
        alphaComplexity: { type: 'f', value: props.ALPHA_COMPLEXITY },
        alphaTimer: { type: 'f', value: 20 },
      },
      transparent: true,
      side: DoubleSide,
    });
    material.needsUpdate = true;

    super(geometry, material);

    this.update = this.update.bind(this);

    // *********
    // GUI
    const shapeFolder = gui.addFolder('Shape');
    shapeFolder.add(props, 'SHAPE_AMPLITUDE', 0, 2).name('AMPLITUDE').onChange(() => {
      this.material.uniforms.shapeAmplitude.value = props.SHAPE_AMPLITUDE;
    });
    shapeFolder.add(props, 'SHAPE_COMPLEXITY', 0, 2).name('COMPLEXITY').onChange(() => {
      this.material.uniforms.shapeComplexity.value = props.SHAPE_COMPLEXITY;
    });
    shapeFolder.add(props, 'SHAPE_SPEED', -0.02, 0.02).name('SPEED');

    const colorFolder = gui.addFolder('Color');
    colorFolder.addColor(props, 'COLOR_MAIN').onChange(() => {
      this.material.uniforms.color.value = new Color(props.COLOR_MAIN);
    });
    colorFolder.addColor(props, 'COLOR_SECONDARY').onChange(() => {
      this.material.uniforms.color2.value = new Color(props.COLOR_SECONDARY);
    });
    colorFolder.add(props, 'COLOR_RANGE', 0, 5).name('RANGE').onChange(() => {
      this.material.uniforms.colorRange.value = props.COLOR_RANGE;
    });
    colorFolder.add(props, 'COLOR_COMPLEXITY', 0, 2).name('COMPLEXITY').onChange(() => {
      this.material.uniforms.colorComplexity.value = props.COLOR_COMPLEXITY;
    });
    colorFolder.add(props, 'COLOR_AMPLITUDE', 0, 3).name('AMPLITUDE').onChange(() => {
      this.material.uniforms.colorAmplitude.value = props.COLOR_AMPLITUDE;
    });
    colorFolder.add(props, 'COLOR_SPEED', -0.02, 0.02).name('SPEED');

    const alphaFolder = gui.addFolder('Alpha');
    alphaFolder.add(props, 'ALPHA_RANGE', 0, 3).name('RANGE').onChange(() => {
      this.material.uniforms.alphaRange.value = props.ALPHA_RANGE;
    });
    alphaFolder.add(props, 'ALPHA_COMPLEXITY', 0, 2).name('COMPLEXITY').onChange(() => {
      this.material.uniforms.alphaComplexity.value = props.ALPHA_COMPLEXITY;
    });
    alphaFolder.add(props, 'ALPHA_SPEED', -0.02, 0.02).name('SPEED');
  }

  update() {
    this.material.uniforms.shapeTimer.value += props.SHAPE_SPEED;
    this.material.uniforms.colorTimer.value += props.COLOR_SPEED;
    this.material.uniforms.alphaTimer.value += props.ALPHA_SPEED;
  }
}
