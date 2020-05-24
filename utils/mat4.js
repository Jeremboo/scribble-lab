import { cross, substract, normalize } from './vec3';

// TODO 2020-05-22 jeremboo: Use gl-matrix for performances
// https://github.com/toji/gl-matrix

export const mat4 = () => [
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
];
export const projection = (width, height, depth) => [
  2 / width, 0, 0, 0,
  0, -2 / height, 0, 0,
  0, 0, 2 / depth, 0,
 -1, 1, 0, 1,
];
export const orthographic = (left, right, bottom, top, near, far) => [
  2 / (right - left), 0, 0, 0,
  0, 2 / (top - bottom), 0, 0,
  0, 0, 2 / (near - far), 0,

  (left + right) / (left - right),
  (bottom + top) / (bottom - top),
  (near + far) / (near - far),
  1,
];
export const perspective = (fov, aspect, near, far) => {
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
  const rangeInv = 1.0 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}

export const multiply = (a, b) => {
  let a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3],
      a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7],
      a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11],
      a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],
      b00 = b[0],  b01 = b[1],  b02 = b[2],  b03 = b[3],
      b10 = b[4],  b11 = b[5],  b12 = b[6],  b13 = b[7],
      b20 = b[8],  b21 = b[9],  b22 = b[10], b23 = b[11],
      b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
  return [
    b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
    b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
    b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
    b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
    b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
    b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
    b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
    b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
    b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
    b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
    b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
    b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
    b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
    b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
    b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
    b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
  ]
}

export const inverse = (a) => {
  let a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3],
      a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7],
      a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11],
      a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  let b00 = a00 * a11 - a01 * a10;
  let b01 = a00 * a12 - a02 * a10;
  let b02 = a00 * a13 - a03 * a10;
  let b03 = a01 * a12 - a02 * a11;
  let b04 = a01 * a13 - a03 * a11;
  let b05 = a02 * a13 - a03 * a12;
  let b06 = a20 * a31 - a21 * a30;
  let b07 = a20 * a32 - a22 * a30;
  let b08 = a20 * a33 - a23 * a30;
  let b09 = a21 * a32 - a22 * a31;
  let b10 = a21 * a33 - a23 * a31;
  let b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 +
            b02 * b09 + b03 * b08 -
            b04 * b07 + b05 * b06;
  if (!det) return null;
  det = 1.0 / det;
  return [
    (a11 * b11 - a12 * b10 + a13 * b09) * det,
    (a02 * b10 - a01 * b11 - a03 * b09) * det,
    (a31 * b05 - a32 * b04 + a33 * b03) * det,
    (a22 * b04 - a21 * b05 - a23 * b03) * det,
    (a12 * b08 - a10 * b11 - a13 * b07) * det,
    (a00 * b11 - a02 * b08 + a03 * b07) * det,
    (a32 * b02 - a30 * b05 - a33 * b01) * det,
    (a20 * b05 - a22 * b02 + a23 * b01) * det,
    (a10 * b10 - a11 * b08 + a13 * b06) * det,
    (a01 * b08 - a00 * b10 - a03 * b06) * det,
    (a30 * b04 - a31 * b02 + a33 * b00) * det,
    (a21 * b02 - a20 * b04 - a23 * b00) * det,
    (a11 * b07 - a10 * b09 - a12 * b06) * det,
    (a00 * b09 - a01 * b07 + a02 * b06) * det,
    (a31 * b01 - a30 * b03 - a32 * b00) * det,
    (a20 * b03 - a21 * b01 + a22 * b00) * det,
  ];
}

export const translate = (m, x, y, z) => {
  return multiply(m, [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ])
};
export const rotateX = (m, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return multiply(m, [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}
export const rotateY = (m, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return multiply(m, [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}
export const rotateZ = (m, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return multiply(m, [
    c, s, 0, 0,
    -s, c, s, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}
export const scale = (m, x, y, z) => multiply(m, [
  x, 0, 0, 0,
  0, y, 0, 0,
  0, 0, z, 0,
  0, 0, 0, 1,
]);

export const lookAt = (cameraPosition, target, up = [0, 1, 0]) => {
  const zAxis = normalize(substract(cameraPosition, target));
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = normalize(cross(zAxis, xAxis));
  return [
    xAxis[0], xAxis[1], xAxis[2], 0,
    yAxis[0], yAxis[1], yAxis[2], 0,
    zAxis[0], zAxis[1], zAxis[2], 0,
    cameraPosition[0],
    cameraPosition[1],
    cameraPosition[2],
    1,
 ];
}