import { createCanvasTexture } from 'threejs-texture-tool';

import { letterFolder, onUpdateLetters, props, sizeMax, sizeMin  } from 'props';
import { onNewLetter } from 'dashboard';


const canvasTextureUpdate = [];

/**
 ************
 * DAT GUI UPDATE
 ************
 */
sizeMax.setValue(10);
sizeMin.setValue(3);

const deformationFolder = letterFolder.addFolder('Deformation');
const deformationForce = deformationFolder.add(props.deformation, 'force', 0, 1);
deformationForce.onChange(() => {
  for (let i = 0; i < canvasTextureUpdate.length; i++) {
    canvasTextureUpdate[i]();
  }
});
const deformationScale = deformationFolder.add(props.deformation, 'scale', -50, 50);
deformationScale.onChange(() => {
  const deformations = document.getElementsByClassName('deformation');
  for (let i = 0; i < deformations.length; i++) {
    deformations[i].setAttribute('scale', props.deformation.scale);
    deformations[i].parentNode.parentNode.style.transform = `translate(${props.deformation.scale * 0.5}px, ${props.deformation.scale * 0.5}px)`
  }
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

  const feImg = document.createElementNS(NS, 'feImage');
  const createRippleImage = (p) => {
    const { width, height, context } = p;
    const grd = context.createRadialGradient(
      width * 0.5, height * 0.5, 0,
      width * 0.5, height * 0.5, props.deformation.size,
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
  displacementmap.setAttribute('class', 'deformation');
  displacementmap.setAttribute('scale', props.deformation.scale);
  displacementmap.setAttribute('in', 'SourceGraphic');
  displacementmap.setAttribute('in2', 'rippleImage');
  displacementmap.setAttribute('xChannelSelector', 'G');
  displacementmap.setAttribute('yChannelSelector', 'G');
  filter.appendChild(displacementmap);
  return filter;
}

/**
 ************
 * TRANSFORM
 ************
 */
function transformLetter(elm) {
  elm.style.transform = `skewX(${
    (0.5 - elm.getAttribute('data-x')) * props.skewXMax
  }deg) skewY(${
    (0.5 - elm.getAttribute('data-y')) * props.skewYMax
  }deg) perspective(100px) scaleZ(${
    props.scaleZ
  }) rotateX(${
    -(0.5 - elm.getAttribute('data-y')) * props.distordYMax
  }deg) rotateY(${
    (0.5 - elm.getAttribute('data-x')) * props.distordXMax
  }deg)`;

  const pressureDuration = elm.getAttribute('data-pressureTime') / props.pressureTimeMax;
  const paths = elm.querySelectorAll('path');
  for (let i = 0; i < paths.length; i++) {
    paths[i].style.strokeWidth = Math.max(props.sizeMin, pressureDuration * props.sizeMax);
  }
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
      // Add letter
      const svgClone = l.cloneNode(true);
      charElm.appendChild(svgClone);
      // Create filter
      const filter = createCustomFilter(id, { width: parseInt(svgClone.style.width), height: parseInt(svgClone.style.height) });
      svgClone.appendChild(filter);
      svgClone.style.filter = `url(#deform-${id})`;
      // Other transformation
      transformLetter(charElm);
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
