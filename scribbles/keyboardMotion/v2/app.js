

// https://github.com/Mottie/Keyboard
// HTML + css : http://codepen.io/gschier/pen/VKgyaY
// aPPLE KEYBOARD CSS : http://codepen.io/tholex/pen/rgBcn
// Apple keyboard css with click:  http://codepen.io/januff/pen/NxNLJJ
// JS keyboard interaction: http://codepen.io/motorlatitude/pen/fLsbF
// Toturial css + jquery: https://code.tutsplus.com/tutorials/creating-a-keyboard-with-css-and-jquery--net-5774
// Tuto virtual keyboard: https://www.codeproject.com/Articles/13748/JavaScript-Virtual-Keyboard
// Touch event handling : http://tutorials.jenkov.com/responsive-mobile-friendly-web-design/touch-events-in-javascript.html

// https://codepen.io/Jeremboo/pen/jVNVqr
// http://vanseodesign.com/web-design/svg-filter-primitives-fedisplacementmap/
// https://codepen.io/pen/?editors=1000

import { onUpdateLetters, props } from 'props';
import { onNewLetter } from 'dashboard';


/**
 ************
 * TRANFORM
 ************
 */
const updateTransform = (elm) => {
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
   elm.style.fontSize = `${Math.min(props.sizeMin + (pressureDuration * props.sizeMax), props.sizeMax)}px`;
 };

onUpdateLetters(updateTransform);

const updateLetter = (letter, charElm) => {
  charElm.innerHTML = letter;
  updateTransform(charElm);
};

onNewLetter(updateLetter, updateLetter);
