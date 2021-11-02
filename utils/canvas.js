import { loadImage } from './loaders';

/**
 *
 * @param {*} width
 * @param {*} height
 */
export const canvasBuilder = (width = window.innerWidth, height = window.innerHeight) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  return {
    canvas,
    context,
    getImageData: () => context.getImageData(0, 0, width, height).data,
  };
};
window.URL = window.URL || window.webkitURL;
export const applyImageToCanvas = (url, w, h) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = (e) => {
    if (e.target.status === 200) {
      const blob = e.target.response;
      loadImage(window.URL.createObjectURL(blob)).then((image) => {
        const width = w || image.width;
        const height = h || image.height;
        const canvasB = canvasBuilder(width, height);
        canvasB.context.drawImage(image, 0, 0, width, height);
        window.URL.revokeObjectURL(blob);
        resolve(canvasB);
      }).catch(reject);
    }
  };
  xhr.send();
});

/**
 *
 * @param {*} ctx
 * @param {*} param1
 */
export const drawRadialGradient = (ctx, { x = 0, y = 0, size = 10, ratio = 0.5 } = {}) => {
  const canvasB = canvasBuilder(ctx.canvas.width, ctx.canvas.height);
  // create with the temps canvas
  const gradStyle = canvasB.context.createRadialGradient(x, y, 1, x, y, size);
  gradStyle.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradStyle.addColorStop(ratio, 'rgba(0, 0, 0, 0.5)');
  gradStyle.addColorStop(1, 'rgba(0, 0, 0, 0)');

  canvasB.context.fillStyle = gradStyle;
  canvasB.context.arc(x, y, size, 0, Math.PI * 2);
  canvasB.context.fill();
  ctx.drawImage(canvasB.canvas, 0, 0);
};

/**
 *
 * @param {*} colorStart
 * @param {*} colorEnd
 * @param {*} param2
 */
export const linearGradient = (colorStart, colorEnd, { ratioStart = 0, ratioEnd = 1, size = 100 } = {}) => {
  const { canvas, context } = canvasBuilder(size, size);
  const gradient = context.createLinearGradient(0, 0, 0, 50);
  gradient.addColorStop(ratioStart, colorStart);
  gradient.addColorStop(ratioEnd, colorEnd);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return canvas;
};