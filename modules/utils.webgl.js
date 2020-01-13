


  export const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
    console.log('ERROR: ', gl.getShaderInfoLog(shader));
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
    console.log('ERROR : ', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }

  export const createProgramFromScript = (gl, vert, frag) => {
    const surfaceVert = createShader(gl, gl.VERTEX_SHADER, vert);
    const surfaceFrag = createShader(gl, gl.FRAGMENT_SHADER, frag);
    return createProgram(gl, surfaceVert, surfaceFrag);
  }