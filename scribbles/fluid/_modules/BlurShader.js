import { ShaderMaterial } from 'three';
import { Pass } from 'postprocessing';

class BlurShaderHorizontal extends Pass {
  constructor(blurShaderHorizontal) {
    super();
    console.log(blurShaderHorizontal)

    this.name = "BlurShaderHorizontal";
    this.needsSwap = true;
    this.material = new ShaderMaterial(blurShaderHorizontal);
    this.quad.material = this.material;
  }

  render(renderer, readBuffer, writeBuffer) {
    // this.material.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
  }
}

class BlurShaderVertical extends Pass {
  constructor(blurShaderVertical) {
    super();

    this.name = "BlurShaderVertical";
    this.needsSwap = true;
    this.material = new ShaderMaterial(blurShaderVertical);
    this.quad.material = this.material;
  }

  render(renderer, readBuffer, writeBuffer) {
    renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);
  }
}

const BlurShader = {
  calculateGaussianKernel: (size, sigma) => {
    const results = []
    const sigmaSq = sigma * sigma
    const sigmaSqDbl = sigmaSq * 2
    const leg = (size - 1) / 2
    for (let x = -leg; x < leg + 1; x++) {
      results.push(Math.exp(-(x * x) / sigmaSqDbl))
    }
    const sum = results.reduce((p, c) => (p + c), 0)
    return results.map(i => i / sum)
  },

  generateHorizontalSum: (sigma = 10, threshold = 0.4) => {
    const size = Math.floor(1 + 2 * Math.sqrt(-2 * sigma * sigma * Math.log(threshold))) + 1
    const blurFactor = BlurShader.calculateGaussianKernel(size, sigma) // you found the important part!  good job!
    const leg = (size - 1) / 2
    const output = []
    for (let index = -leg; index < leg + 1; index++) {
      const sign = Math.sign(index) < 0 ? '-' : '+'
      let str = `sum += texture2D( tDiffuse, vec2( vUv.x ${sign} ${Math.abs(index)}.0 * h, vUv.y ) ) * ${blurFactor[index + leg]};`
      if (index === 0) {
        str = `sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * ${blurFactor[index + leg]};`
      }
      output.push(str)
    }
    return output.join('\n')
  },

  generateVerticalSum: (sigma = 10, threshold = 0.4) => {
    const size = Math.floor(1 + 2 * Math.sqrt(-2 * sigma * sigma * Math.log(threshold))) + 1
    const blurFactor = BlurShader.calculateGaussianKernel(size, sigma) // you found the important part!  good job!
    const leg = (size - 1) / 2
    const output = []
    for (let index = -leg; index < leg + 1; index++) {
      const sign = Math.sign(index) < 0 ? '-' : '+'
      let str = `sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ${sign} ${Math.abs(index)}.0 * v ) ) * ${blurFactor[index + leg]};`
      if (index === 0) {
        str = `sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * ${blurFactor[index + leg]};`
      }
      output.push(str)
    }
    return output.join('\n')
  },

  vertical: (blurFactor, blurThreshold) => {
    return new BlurShaderVertical({
      uniforms: {
        tDiffuse: {value: null},
        v: {value: 1 / 512}
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
          "vUv = uv;",
          "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"
      ].join( "\n" ),
      fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform float v;",
        "varying vec2 vUv;",
        "void main() {",
          "vec4 sum = vec4( 0.0 );",
          BlurShader.generateVerticalSum(blurFactor, blurThreshold),
          "gl_FragColor = sum;",
        "}"
      ].join("\n")
    })
  },

  horizontal: (blurFactor, blurThreshold) => {
    return new BlurShaderHorizontal({
      uniforms: {
        tDiffuse: {value: null},
        h: {value: 1 / 512}
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
          "vUv = uv;",
          "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        "}"
      ].join( "\n" ),
      fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform float h;",
        "varying vec2 vUv;",
        "void main() {",
          "vec4 sum = vec4( 0.0 );",
          BlurShader.generateHorizontalSum(blurFactor, blurThreshold),
          "gl_FragColor = sum;",
        "}"
      ].join("\n")
    })
  }
}

export default BlurShader;
