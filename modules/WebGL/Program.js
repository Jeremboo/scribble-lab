import { createProgramFromScript, createBuffer } from "../../utils/webgl";
import Texture from "./Texture";

// UNIFORM MAP
const FLOAT = 'uniform1f';
const VEC2 = 'uniform2f';
const VEC3 = 'uniform3f';
const VEC4 = 'uniform4f'; // TODO
const MAT2 = 'uniformMatrix2fv'; // TODO
const MAT3 = 'uniformMatrix3fv';
const MAT4 = 'uniformMatrix4fv';
const SAMPLER2D = 'uniform1i';
const SAMPLERCUBE = 'uniform1iv'; // TODO

export const getContext = (canvas, { preserveDrawingBuffer = false }) => {
  const context = canvas.getContext('webgl', { preserveDrawingBuffer })
  if (!context) {
    console.error('ERROR: Webgl not supported !');
  }
  return context;
}

/**
 * PROGRAM:
 *
 * http://gl.jojo.ninja/doc/Program.js.html
 * https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
 * https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html
 * https://webglfundamentals.org/webgl/lessons/webgl-less-code-more-fun.html
 *
 */

export default class Program {
  constructor(context, vert, frag) {
    this.id = `${Math.floor(Math.random() * 10000)}`;
    this.isUsed = false;
    this.gl = context;
    this.canvas = this.gl.canvas;
    this.program = createProgramFromScript(this.gl, vert, frag);

    this.i = 0;
    this.count = 0;
    this.attributes = {};
    this.uniforms = {};

    this.textures = [];
  }

  /**
   * * *******************
   * * ATTRIBUTE INIT
   * * *******************
   */

  addAttributePosition(data, size = 3, options) {
    this.count = data.length / size;
    this.addAttribute('position', data, size, options);
  }

  addAttribute(name, data, size, { draw = this.gl.STATIC_DRAW, type = this.gl.FLOAT, normalize = false, stride = 0, offset = 0 } = {}) {
    // TODO 2020-05-30 jeremboo: Check if the buffer already exists ?
    this.attributes[name] = {
      location: this.gl.getAttribLocation(this.program, name),
      buffer: createBuffer(this.gl, data, draw),
      data,
      size,
      type,
      normalize,
      stride,
      offset
    };
  }

  /**
   * * *******************
   * * UNIFORM INIT
   * * *******************
   */

  addUniforms(uniformList) {
    Object.keys(uniformList).forEach((key) => {
      this.addUniform(key, uniformList[key]);
    });
  }

  addUniform(name, value) {
    const location = this.gl.getUniformLocation(this.program, name);
    if (location === null) {
      console.warn(`ERROR.addUniform: ${name} is not used in the program shader.`)
      return
    }

    const type = this.getUniformType(value);
    if (type === false) {
      console.warn(`ERROR.addUniform: ${name} as an undefined type with value ${value}`);
      return;
    }

    let set = () => null;
    if (this.gl[type]) {
      if (type === FLOAT) {
        // Float
        set = (v) => this.gl[type](location, v);
      } else if (type === SAMPLER2D) {
        // Texture
        const currentUnit = this.textures.length;
        this.textures.push(value);
        set = () => {
          this.gl[type](location, currentUnit);
          this.gl.activeTexture(this.gl.TEXTURE0 + currentUnit);
          this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[currentUnit].texture);
        };
      } else if (type.indexOf('Matrix') === -1) {
        // Vector
        set = (v) => this.gl[type].apply(this.gl, Array.prototype.concat.apply(location, v));
      } else {
        // Matrix
        set = (v) => this.gl[type](location, this.gl.FALSE, v);
      }
    }

    this.uniforms[name] = { location, type, value, set };
  }

  getUniformType(value) {
    let type = false;
    const valueType = typeof value;
    if (valueType === 'number') {
      type = FLOAT;
    } else if (value === null || value instanceof Texture) {
      type = SAMPLER2D;
    } else if (valueType === 'object') {
      if (value.length === 2) {
        type = VEC2;
      } else if (value.length === 3) {
        type = VEC3;
      } else if (value.length === 9) {
        type = MAT3;
      } else if (value.length === 16) {
        type = MAT4;
      }
    }
    return type;
  }

  /**
   * If the program is already used (like it's the only one program), the uniform have to be binded into this.gl.
   * Otherwise, you can only update the uniform object waiting the program be used next frame.
   * @param {string} name
   * @param {newValue} value
   */
  forceUpdateUniform(name, value) {
    this.uniforms[name].value = value;
    if (!this.isUsed) {
      console.warn('ERROR.forceUpdateUniform(): The program is not used. No need to force update.');
      return;
    }
    this.uniforms[name].set(value);
  }

  /**
   * * *******************
   * * RENDER
   * * *******************
   */

  useProgram() {
    this.gl.useProgram(this.program);

    // Bind the attributes
    this.i = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES) - 1;
    for (this.i; this.i >= 0; this.i--) {
      const { name } = this.gl.getActiveAttrib(this.program, this.i);
      const { buffer, location, size, type, normalize, stride, offset } = this.attributes[name];
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.enableVertexAttribArray(location);
      this.gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
    }

    // Bind the uniforms
    this.i = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_UNIFORMS) - 1;
    for (this.i; this.i >= 0; this.i--) {
      const { name } = this.gl.getActiveUniform(this.program, this.i);
      const { set, value } = this.uniforms[name];
      set(value);
    }

    this.isUsed = true;
  }

  unuseProgram() {
    this.isUsed = false;
  }
}