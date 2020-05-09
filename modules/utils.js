import { Vector3, Euler, Raycaster } from 'three';

Math.sqr = x => x * x;

export const getDistBetweenTwoVec2 = (x1, y1, x2, y2) => {
  const x = x1 - x2;
  const y = y1 - y2;
  const dist = Math.sqrt(Math.sqr(y) + Math.sqr(x));
  return { x, y, dist };
};

export const radians = degrees => degrees * Math.PI / 180;

export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
export const getPosXBetweenTwoNumbers = (min, max, x) => ((max - x) / (max - min));
export const getXBetweenTwoNumbersWithPercent = (min, max, x) => (min + (x * ((max - min))));
export const getRandomAttribute = (json) => {
  const keys = Object.keys(json);
  return json[keys[getRandomInt(0, keys.length - 1)]];
};
export const getRandomItem = arr => arr[getRandomInt(0, arr.length - 1)];

// https://gist.github.com/jedfoster/7939513
export const mixColors = (color_1, color_2, weight) => {
  function d2h(d) { return d.toString(16) }  // convert a decimal value to hex
  function h2d(h) { return parseInt(h, 16) } // convert a hex value to decimal

  weight = (typeof (weight) !== 'undefined') ? weight : 50 // set the weight to 50%, if that argument is omitted

  let color = '#'

  for (let i = 0; i <= 5; i += 2) { // loop through each of the 3 hex pairs—red, green, and blue
    let v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
      v2 = h2d(color_2.substr(i, 2)),

       // combine the current pairs from each source color, according to the specified weight
      val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)))

    while (val.length < 2) { val = `0${val}` } // prepend a '0' if val results in a single digit

    color += val // concatenate val to our new color string
  }

  return color // PROFIT!
}

export const getNormalizedPosFromScreen = (x, y) => new Vector3(
  ((x / window.innerWidth) * 2) - 1,
  -((y / window.innerHeight) * 2) + 1,
  0.5,
);
// https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
export const getDistanceBetweenNormalizedMousePosAndPos = (normalizedMousePos, pos, camera) => {
  const nm = normalizedMousePos.clone()
  nm.unproject(camera);
  const dir = nm.sub(camera.position).normalize();
  const distance = (pos.z - camera.position.z) / dir.z;
  const mousePos = camera.position.clone().add(dir.multiplyScalar(distance));
  return pos.clone().sub(mousePos);
};

// https://www.gamedev.net/forums/topic/95637-random-point-within-a-sphere/
export const getrandomPosWithinASphere = (r) => {
  const theta = getRandomFloat(0, Math.PI * 2);
  const phi = getRandomFloat(-Math.PI * 0.5, Math.PI * 0.5);
  return new Vector3(
    r * Math.cos(theta) * Math.cos(phi),
    (r * 0.9) * Math.sin(phi),
    r * Math.sin(theta) * Math.cos(phi),
  );
};

// https://stackoverflow.com/questions/40485197/turning-random-cube-to-random-sphere-in-three-js?rq=1
export const getRandomPosAroundASphere = (r) => {
  return new Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5).normalize().multiplyScalar(r);
};

// Ty Robin <3
// https://codepen.io/robin-dela/pen/dZXVrQ?editors=0010
// https://threejs.org/docs/#api/core/Raycaster
export const onCursorTouchMeshes = (camera, sceneChildren = [], callback, targetedMesh) => {
  const raycaster = new Raycaster();
  const moveEvent = 'ontouchstart' in (window || navigator.msMaxTouchPoints) ? 'touchmove' : 'mousemove';
  window.addEventListener(moveEvent, (e) => {
    const mouseVec = getNormalizedPosFromScreen(
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY,
    );

    raycaster.setFromCamera(mouseVec, camera);
    const intersects = raycaster.intersectObjects(sceneChildren);
    if (!targetedMesh) {
      callback(intersects, mouseVec);
    } else {
      let i = 0;
      let targetedObjectIntersected = false;
      while (i < intersects.length && !targetedObjectIntersected) {
        if (intersects[i].object.uuid === targetedMesh.uuid) {
          targetedObjectIntersected = true;
          callback(intersects[i], mouseVec);
        }
        i += 1;
      }
    }
  });
};

/**
 * Get the width and the height of the field size from a specific distance
 */
export const getCameraVisionFieldSizeFromPosition = (position = new Vector3(), camera) => {
  // (2 * Math.tan(radians(camera.fov) / 2)) => Always the same number. Can be optimized
  const height = (2 * Math.tan(radians(camera.fov) / 2)) * (camera.position.distanceTo(position));
  const width = camera.aspect * height;
  return {
    width,
    height,
  };
};

// LOADERS
export const loadImage = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'Anonymous';
  image.onload = () => { resolve(image); };
  image.onerror = () => {
    reject('ERROR : Image cannot be loaded');
  };
  image.src = url;
});

export const loadVideo = (url, { width = 512, height = 512, loop = false, muted = false } = {}) => {
  return new Promise((resolve, reject) => {
    const videoPlayer = document.createElement('video');

    videoPlayer.width = width;
    videoPlayer.height = height;

    videoPlayer.loop = loop;
    videoPlayer.muted = muted;
    const source = document.createElement('source');
    source.id = 'mp4';
    source.type = 'video/mp4';
    videoPlayer.appendChild(source);

    if (!videoPlayer.canPlayType('video/mp4')) {
      reject();
      return;
    }

    videoPlayer.addEventListener('canplaythrough', () => {
      resolve(videoPlayer);
    });
    videoPlayer.src = url;
    if (videoPlayer.readyState > 3) {
      resolve(videoPlayer);
    }
  });
}

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
        const { canvas, context } = canvasB;
        context.drawImage(image, 0, 0, width, height);
        window.URL.revokeObjectURL(blob);
        resolve(canvas);
      }).catch(reject);
    }
  };
  xhr.send();
});

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

export const linearGradient = (colorStart, colorEnd, { ratioStart = 0, ratioEnd = 1, size = 100 } = {}) => {
  const { canvas, context } = canvasBuilder(size, size);
  const gradient = context.createLinearGradient(0, 0, 0, 50);
  gradient.addColorStop(ratioStart, colorStart);
  gradient.addColorStop(ratioEnd, colorEnd);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return canvas;
};

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

export const getRandomEuler = () => new Euler(
  getRandomFloat(0, 6.2831),
  getRandomFloat(0, 6.2831),
  getRandomFloat(0, 6.2831),
);

export const getRandomHexa = () =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 16)]
;
export const getRandomColor = (type = '#') => {
    let color = `${type}`;
    for (let i = 0; i < 6; i++ ) {
        color += getRandomHexa();
    }
    return color;
}

export const componentToHex = (c) => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};
export const rgbToHex = (r, g, b) => {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
export const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;

  const RR = ((R.toString(16).length==1)?'0'+R.toString(16):R.toString(16));
  const GG = ((G.toString(16).length==1)?'0'+G.toString(16):G.toString(16));
  const BB = ((B.toString(16).length==1)?'0'+B.toString(16):B.toString(16));

  return RR+GG+BB;
}
