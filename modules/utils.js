

Math.sqr = x => x * x;

export const getDistBetweenTwoVec2 = (x1, y1, x2, y2) => {
  const x = x1 - x2;
  const y = y1 - y2;
  const dist = Math.sqrt(Math.sqr(y) + Math.sqr(x));
  return { x, y, dist };
};

export const radians = degrees => degrees * Math.PI / 180;

export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ARRAY
export const existingValueBy = (arr, comparator) =>
  arr.filter(value => comparator(value))[0]
;

// CANVAS
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
export const applyImageToCanvas = (url, w, h) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = (e) => {
    if (e.target.status === 200) {
      const blob = e.target.response;
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.onload = () => {
        const width = w || image.width;
        const height = h || image.height;
        const canvasB = canvasBuilder(width, height);
        const { canvas, context } = canvasB;
        context.drawImage(image, 0, 0, width, height);
        window.URL.revokeObjectURL(blob);
        resolve(canvas);
      };
      image.onerror = () => {
        reject('Err : Canvas cannot be loaded');
      };
      image.src = window.URL.createObjectURL(blob);
    }
  };
  xhr.send();
});

/*******
* ANIMATION
*******/
export const easing = (target, value, { vel = 0.03, update = f => f, callback = f => f } = {}) => {
  const f = (target - value) * vel;
  update(value + f, f);
  if (Math.abs(f) < 0.001) {
    update(target, f);
    callback();
  }
};
export const RAFeasing = (target, value, { vel = 0.03, update = f => f, callback = f => f } = {}) => {
  const f = (target - value) * vel;
  const newValue = value + f;
  update(newValue);
  if (Math.abs(f) < 0.001) {
    update(target);
    callback();
    return;
  }
  requestAnimationFrame(easing.bind(this, target, newValue, { vel, update, callback }));
};

export const testPerf = (fct, ...params) => {
  const t0 = performance.now();
  const result = fct(...params);
  const t1 = performance.now();
  console.log(`PERF === ${t1 - t0} ms.`);
  return result;
};
