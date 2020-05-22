
export const magnitude = (x, y) => Math.sqrt(x * x + y * y);

export const distance = (x1, y1, x2, y2) => {
  const x = x1 - x2;
  const y = y1 - y2;
  const dist = magnitude(x, y);
  return { x, y, dist };
};

export const normalize = (x, y) => {
  const mag = magnitude(x, y)
  return { x: x / mag, y: y / mag };
}