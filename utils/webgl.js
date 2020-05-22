import { loadImage } from './loaders';

/**
 * * *******************
 * * PROGRAM
 * * *******************
 */

export const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.error('ERROR: ', gl.getShaderInfoLog(shader));
  let shaderRelated = ``;
  source.split('\n').forEach((line, idx) => {
    shaderRelated += `
${idx + 1}: ${line}`
  })
  console.warn('shaderRelated', shaderRelated);
  gl.deleteShader(shader);
}

export const createProgram =  (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.error('ERROR : ', gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

export const createProgramFromScript = (gl, vert, frag) => {
  const surfaceVert = createShader(gl, gl.VERTEX_SHADER, vert);
  const surfaceFrag = createShader(gl, gl.FRAGMENT_SHADER, frag);
  return createProgram(gl, surfaceVert, surfaceFrag);
}

/**
 * * *******************
 * * ATTRIBUTE
 * * *******************
 */

export const createAttribute = (gl, program, name, data, size, { draw = gl.STATIC_DRAW, type = gl.FLOAT, normalize = false, stride = 0, offset = 0 } = {}) => {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), draw);
  const positionAttributeLocation = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
  return positionAttributeLocation;
}

/**
 * * *******************
 * * TEXTURE
 * * *******************
 */

 // TODO 2020-01-13 jeremboo: create a structure like in typeScript for the default props
 export const createTexture = (gl, data, {
  level = 0,
  width = 256,
  height = 256,
  internalFormat = gl.RGBA,
  border = 0,
  format = gl.RGBA,
  type = gl.UNSIGNED_BYTE,
  minFilter = gl.LINEAR,
  magFilter = gl.LINEAR,
  wrapS = gl.CLAMP_TO_EDGE,
  wrapT = gl.CLAMP_TO_EDGE
 } = {}) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  if (data && data.constructor !== Float32Array) {
    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat, format, type, data
    );
  } else {
    gl.texImage2D(
      gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data
    );
  }

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);

  return texture;
 }

export const createTextureFromUrl = async (gl, url, options) => {
  const image = await loadImage(url);
  const texture = createTexture(gl, image, options);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}