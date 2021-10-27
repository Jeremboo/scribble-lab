import { loadImage } from './loaders';

// TODO 2020-06-25 jeremboo: divide by theme

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

// TODO 2020-06-25 jeremboo: maybe merge createBuffer && createIndiceBuffer together
export const createBuffer = (gl, data, draw = gl.STATIC_DRAW) => {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), draw);
  return buffer;
};

export const createIndiceBuffer = (gl, data, draw = gl.STATIC_DRAW) => {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), draw);
  return buffer;
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
  wrapT = gl.CLAMP_TO_EDGE,
 } = {}, previousTexture) => {
  const texture = previousTexture || gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  if (data && data.constructor !== Float32Array) {
    // TODO 2020-06-17 jeremboo: Check the power of 2 by following
    // TODO 2020-06-17 jeremboo: https://stackoverflow.com/questions/19722247/webgl-wait-for-texture-to-load/19748905#19748905
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

export const createTextureFromUrl = async (gl, url, options, previousTexture) => {
  const image = await loadImage(url);
  const texture = createTexture(gl, image, options, previousTexture);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

/**
 * * *******************
 * * GEOMETRIES
 * * *******************
 */

// https://github.com/greggman/twgl.js/blob/master/src/primitives.js
// https://github.com/mrdoob/three.js/blob/master/src/geometries/PlaneGeometry.js
export const createPlane = (width, height, subdivisionsWidth, subdivisionsHeight) => {
  const numVertices = (subdivisionsWidth + 1) * (subdivisionsHeight + 1);
  const position = [];
  const indices = [];
  // const normals = createAugmentedTypedArray(3, numVertices);
  // const texcoords = createAugmentedTypedArray(2, numVertices);

  let y, x;
  for (y = 0; y <= subdivisionsHeight; y++) {
    for (x = 0; x <= subdivisionsWidth; x++) {
      const u = x / subdivisionsWidth;
      const v = y / subdivisionsHeight;
      position.push(
          width * u - width * 0.5,
          height * v - height * 0.5,
          0
        );
      // normals.push(0, 1, 0);
      // texcoords.push(u, v);
    }
  }

  const numVertsAcross = subdivisionsWidth + 1;

  for (y = 0; y < subdivisionsHeight; y++) {  // eslint-disable-line
    for (x = 0; x < subdivisionsWidth; x++) {  // eslint-disable-line
      // Make triangle 1 of quad.
      indices.push(
          (y + 0) * numVertsAcross + x,
          (y + 0) * numVertsAcross + x + 1,
          (y + 1) * numVertsAcross + x);

      // Make triangle 2 of quad.
      indices.push(
          (y + 1) * numVertsAcross + x,
          (y + 1) * numVertsAcross + x + 1,
          (y + 0) * numVertsAcross + x + 1);
    }
  }

  return { position, indices };
}