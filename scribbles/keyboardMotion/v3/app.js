import { onUpdateLetters, props } from 'props';
import { onNewLetter } from 'dashboard';

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
  client.onreadystatechange = (e) => {
    if (client.readyState === 4) {
      const parser = new DOMParser();
      const svg = parser.parseFromString(client.responseText, 'image/svg+xml').querySelector('svg');
      const { width, height } = svg.viewBox.baseVal;
      svg.style.width = width;
      svg.style.height = height;
      alphabetSVG[letter] = svg;
    }
  }
  client.send();
}

for (let i = 0; i < alphabet.length; i++) {
  loadSVG(alphabet[i]);
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
      charElm.appendChild(l.cloneNode(true));
      transformLetter(charElm);
    } else {
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
