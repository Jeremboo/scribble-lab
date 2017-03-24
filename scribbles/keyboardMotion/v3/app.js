import { createCanvasTexture } from 'threejs-texture-tool';

import { letterFolder, onUpdateLetters, props, sizeMax, sizeMin, updateCharacters, markerFolder  } from 'props';
import { onNewLetter } from 'dashboard';


const canvasTextureUpdate = [];

/**
 ************
 * DAT GUI UPDATE
 ************
 */
sizeMax.setValue(10);
sizeMin.setValue(3);

const showTexture = markerFolder.add(props, 'showTextures');
showTexture.onChange(() => {
  document.body.classList.toggle('_hideTextureTool');
});

const deformationFolder = letterFolder.addFolder('Deformation');
const deformationForce = deformationFolder.add(props.deformation, 'force', 0, 1);
deformationForce.onChange(() => {
  for (let i = 0; i < canvasTextureUpdate.length; i++) {
    canvasTextureUpdate[i]();
  }
});
const deformationScale = deformationFolder.add(props.deformation, 'scale', -50, 50);
deformationScale.onChange(() => {
  updateCharacters();
});
const deformationSize = deformationFolder.add(props.deformation, 'size', 0, 100);
deformationSize.onChange(() => {
  for (let i = 0; i < canvasTextureUpdate.length; i++) {
    canvasTextureUpdate[i]();
  }
});


/**
 ************
 * SVG
 ************
 */
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const alphabetSVG = {};

function loadSVG(letter) {
  const client = new XMLHttpRequest();
  client.open('GET', require(`../_assets/raw/letters/${letter}.svg`), false);
  client.overrideMimeType('image/svg+xml');
  client.onreadystatechange = () => {
    if (client.readyState === 4) {
      const parser = new DOMParser();
      const svg = parser.parseFromString(client.responseText, 'image/svg+xml').querySelector('svg');
      const { width, height } = svg.viewBox.baseVal;
      svg.style.width = width;
      svg.style.height = height;
      alphabetSVG[letter] = svg;
    }
  };
  client.send();
}

for (let i = 0; i < alphabet.length; i++) {
  loadSVG(alphabet[i]);
}
/**
 ************
 * CREATE SVG FILTER
 ************
 */
const NS = 'http://www.w3.org/2000/svg';
function createCustomFilter(id, data) {
  const filter = document.createElementNS(NS, 'filter');
  filter.id = `deform-${id}`;

  // const turbulence = document.createElementNS(NS, 'feTurbulence');
  // turbulence.setAttribute('baseFrequency', 0.04);
  // turbulence.setAttribute('numOctaves', 2);
  // turbulence.setAttribute('type', 'fractalNoise');
  // turbulence.setAttribute('seed', 2);
  // turbulence.setAttribute('result', 'rippleImage');
  // filter.appendChild(turbulence);

  // Position
  const top = data.top ? 0 : 1;
  const left = data.left ? 0 : 1;

  const feImg = document.createElementNS(NS, 'feImage');
  const createRippleImage = (p) => {
    const { width, height, context } = p;
    const grd = context.createRadialGradient(
      width * data.x, height * data.y, 0,
      width * data.x, height * data.y, props.deformation.size,
    );
    const greenRatio = Math.floor(255 * props.deformation.force);
    grd.addColorStop(0, `rgb(${255 - greenRatio}, ${greenRatio}, 0)`);
    grd.addColorStop(1, 'red');
    context.fillStyle = grd;
    context.fillRect(0, 0, width, height);
  };
  const setHrefFromCanvas = (canvas) => {
    feImg.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', canvas.toDataURL('image/png'));
  };
  const canvasTexture = createCanvasTexture({
    name: `deform-${id}`,
    width: data.width,
    height: data.height,
    onStart: (p) => {
      const { width, height, context, canvas, update } = p;
      createRippleImage(p);
      canvasTextureUpdate.push(() => { update({ width, height, context, canvas }); });
    },
    onUpdate: (p) => {
      const { canvas } = p;
      createRippleImage(p);
      setHrefFromCanvas(canvas);
    },
  });
  feImg.setAttribute('x', 0);
  feImg.setAttribute('y', 0);
  feImg.setAttribute('width', data.width);
  feImg.setAttribute('height', data.height);
  feImg.setAttribute('result', 'rippleImage');
  setHrefFromCanvas(canvasTexture.canvas);
  filter.appendChild(feImg);

  const displacementmap = document.createElementNS(NS, 'feDisplacementMap');
  const sign = (
    (data.left && data.top) // ||  // HAUT / GAUCHE
    // (!data.top && data.left)    // HAUT / DROITE
  ) ? -1 : 1;
  displacementmap.setAttribute('data-sign', sign);
  displacementmap.setAttribute('class', 'deformation');
  displacementmap.setAttribute('scale', props.deformation.scale * sign);
  displacementmap.setAttribute('in', 'SourceGraphic');
  displacementmap.setAttribute('in2', 'rippleImage');
  displacementmap.setAttribute('xChannelSelector', (!data.top && data.left) ? 'G' : 'R');
  displacementmap.setAttribute('yChannelSelector', (data.top && !data.left) ? 'G' : 'R');
  filter.appendChild(displacementmap);
  return filter;
}

/**
 ************
 * TRANSFORM
 ************
 */
function transformLetter(elm, x = elm.getAttribute('data-x'), y = elm.getAttribute('data-y')) {
  elm.style.transform = `skewX(${
    (0.5 - x) * props.skew.XMax
  }deg) skewY(${
    (0.5 - y) * props.skew.YMax
  }deg) perspective(100px) scaleZ(${
    props.scaleZ
  }) rotateX(${
    -(0.5 - y) * props.distordYMax
  }deg) rotateY(${
    (0.5 - x) * props.distordXMax
  }deg)`;

  const pressureDuration = elm.getAttribute('data-pressureTime') / props.pressureTimeMax;
  const paths = elm.querySelectorAll('path');
  for (let i = 0; i < paths.length; i++) {
    paths[i].style.strokeWidth = Math.max(props.sizeMin, pressureDuration * props.sizeMax);
  }

  // Deformation
  const deform = elm.querySelector('.deformation');
  const scale = props.deformation.scale * deform.getAttribute('data-sign');
  const reverseX = deform.getAttribute('xChannelSelector') === 'G' ? -1 : 1;
  const reverseY = deform.getAttribute('yChannelSelector') === 'G' ? -1 : 1;
  deform.setAttribute('scale', scale);
  deform.parentNode.parentNode.style.transform = `translate(${scale * 0.5 * reverseX}px, ${scale * 0.5 * reverseY}px)`;
}
onUpdateLetters(transformLetter);

function svgLetterExist(SVGLetter) {
  return typeof SVGLetter !== 'undefined';
}

onNewLetter(
  // CREATE
  (letter, charElm) => {
    const l = alphabetSVG[letter];
    if (svgLetterExist(l)) {
      const id = Math.floor(Math.random() * 200); // TODO remplace
      const x = charElm.getAttribute('data-x');
      const y = charElm.getAttribute('data-y');
      // Add letter
      const svgClone = l.cloneNode(true);
      const wrapper = document.createElement('div');
      wrapper.appendChild(svgClone);
      charElm.appendChild(wrapper);
      // Create filter
      const filter = createCustomFilter(id, {
        width: parseInt(svgClone.style.width),
        height: parseInt(svgClone.style.height),
        top: (y < 0.5),
        left: (x < 0.5),
        y,
        x,
      });
      svgClone.appendChild(filter);
      svgClone.style.filter = `url(#deform-${id})`;
      // Other transformation
      transformLetter(charElm, x, y);
    } else {
      // Remove the last letter
      charElm.parentNode.parentNode.removeChild(charElm.parentNode);
    }
  },
  // UPDATE
  (letter, charElm) => {
    const l = alphabetSVG[letter];
    if (svgLetterExist(l) && charElm) {
      transformLetter(charElm);
    }
  },
);
