// https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
export const vec3 = (x, y, z) => [x, y, z];

export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];

export const substract = (a, b) => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2]
];

export const magnitude = (x, y, z) => Math.sqrt(x * x + y * y + z * z);

export const normalize = (v) => {
  const mag = magnitude(v[0], v[1], v[2]);
  if (mag < 0.00001) return [0, 0, 0];
  return [v[0] / mag, v[1] / mag, v[2] / mag];
}