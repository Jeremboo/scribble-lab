import { updateTransform, props } from 'props';
import { getPositionInViewport, addMarker } from 'utils2';

/**
 ************
 * CHARACTERS
 ************
 */
const write = document.getElementById('write');
const text = document.getElementById('text');
let pressureInterval = false;
let createLetter = f => f;
let updateLetter = f => f;

export const onNewLetter = (onCreate = f => f, onUpdate = f => f) => {
  createLetter = onCreate;
  updateLetter = onUpdate;
};

function keyLeave() {
  if (pressureInterval) clearInterval(pressureInterval);
}

function traceCharacter(letter, position) {
  write.innerHTML += letter;
  const letterWrapper = document.createElement('div');
  letterWrapper.classList.add('character');
  const turbulenceMarker = document.createElement('div');
  turbulenceMarker.classList.add('marker');
  turbulenceMarker.classList.add('red');
  turbulenceMarker.style.left = `${position.x * 100}%`;
  turbulenceMarker.style.top = `${position.y * 100}%`;
  letterWrapper.appendChild(turbulenceMarker);

  // Letter
  const char = document.createElement('span');
  char.setAttribute('data-x', position.x);
  char.setAttribute('data-y', position.y);

  letterWrapper.appendChild(char);
  text.appendChild(letterWrapper);

  if (letter === ' ') {
    char.style.marginLeft = '30px';
  } else {
    createLetter(letter, char);

    // Start touchpressure
    const touchedAt = new Date();
    pressureInterval = setInterval(() => {
      const interval = new Date().getTime() - touchedAt;
      char.setAttribute('data-pressureTime', interval);
      updateLetter(letter, char);

      if (interval > props.pressureTimeMax) {
        keyLeave();
      }
    }, 25);
  }
}

/**
 ************
 * KEYBOARD
 ************
 */
// https://code.tutsplus.com/tutorials/creating-a-keyboard-with-css-and-jquery--net-5774
const keys = document.querySelectorAll('#keyboard li');
const letters = document.getElementsByClassName('letter');
const symbols = document.querySelectorAll('.symbol span');
let shift = false;
let capslock = false;

function toggleUppercase() {
  let i;
  for (i = 0; i < letters.length; i++) {
    letters[i].classList.toggle('uppercase');
  }
}

function toggleSymbols() {
  let i;
  for (i = 0; i < symbols.length; i++) {
    symbols[i].classList.toggle('on');
    symbols[i].classList.toggle('off');
  }
}

function keyTouched(e) {
  e.preventDefault();
  const key = e.target;
  let character = key.innerHTML;

  /* DEFINE KEYBOARD EVENT */
  // Shift key
  if (key.classList.contains('left-shift') || key.classList.contains('right-shift')) {
    toggleUppercase();
    toggleSymbols();
    shift = !shift;
    capslock = false;
    return false;
  }

  // Caps lock
  if (key.classList.contains('capslock')) {
    toggleUppercase();
    capslock = true;
    return false;
  }

  // Delete
  if (key.classList.contains('delete')) {
    const html = write.innerHTML;
    write.innerHTML = html.substr(0, html.length - 1);
    if (text.lastChild) text.removeChild(text.lastChild);
    return false;
  }

  // Special characters
  if (key.classList.contains('symbol')) character = key.querySelector('.off').innerHTML;
  if (key.classList.contains('space')) character = ' ';
  if (key.classList.contains('tab')) character = '\t';
  if (key.classList.contains('return')) character = '\n';

  // uppercase
  if (key.classList.contains('uppercase')) {
    character = character.toUpperCase();
  }

  // Remove shift once a key is clicked.
  if (shift === true) {
    toggleSymbols();
    if (capslock === false) toggleUppercase();
    shift = false;
  }

  /* ADD CHARACTED WITH SPECIFIC DATA */
  const { x, y } = getPositionInViewport(key);
  const touchPosition = {
    x: e.clientX || e.touches[0].clientX,
    y: e.clientY || e.touches[0].clientY,
  };
  addMarker(touchPosition.x, touchPosition.y, 'blue');

  traceCharacter(character, {
    x: (touchPosition.x - x) / key.offsetWidth,
    y: (touchPosition.y - y) / key.offsetWidth,
  });
  return true;
}


/**
 ************
 * START
 ************
 */
for (let i = 0; i < keys.length; i++) {
  keys[i].addEventListener('mousedown', keyTouched);
  keys[i].addEventListener('mouseup', keyLeave);
  keys[i].addEventListener('touchstart', keyTouched);
  keys[i].addEventListener('touchend', keyLeave);
  keys[i].addEventListener('touchcancel', keyLeave);
}
