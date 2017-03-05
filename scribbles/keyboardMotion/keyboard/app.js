

// https://github.com/Mottie/Keyboard
// HTML + css : http://codepen.io/gschier/pen/VKgyaY
// aPPLE KEYBOARD CSS : http://codepen.io/tholex/pen/rgBcn
// Apple keyboard css with click:  http://codepen.io/januff/pen/NxNLJJ
// JS keyboard interaction: http://codepen.io/motorlatitude/pen/fLsbF
// Toturial css + jquery: https://code.tutsplus.com/tutorials/creating-a-keyboard-with-css-and-jquery--net-5774
// Tuto virtual keyboard: https://www.codeproject.com/Articles/13748/JavaScript-Virtual-Keyboard
// Touch event handling : http://tutorials.jenkov.com/responsive-mobile-friendly-web-design/touch-events-in-javascript.html

/**
 ************
 * UTILS
 ************
 */
// http://stackoverflow.com/questions/211703/is-it-possible-to-get-the-position-of-div-within-the-browser-viewport-not-withi
const getPositionInViewport = (e) => {
  const offset = {
    x: 0, // e.offsetWidth / 2,
    y: 0, // e.offsetHeight / 2,
  };

  while (e) {
    offset.x += e.offsetLeft;
    offset.y += e.offsetTop;
    e = e.offsetParent;
  }

  if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {
    offset.x -= document.documentElement.scrollLeft;
    offset.y -= document.documentElement.scrollTop;
  } else if (document.body && (document.body.scrollTop || document.body.scrollLeft)) {
    offset.x -= document.body.scrollLeft;
    offset.y -= document.body.scrollTop;
  } else if (window.pageXOffset || window.pageYOffset) {
    offset.x -= window.pageXOffset;
    offset.y -= window.pageYOffset;
  }
  return offset;
};

function addMarker(x, y, color = 'red') {
  const marker = document.createElement('div');
  marker.classList.add('marker');
  marker.classList.add(color);
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
  document.body.appendChild(marker);
}

/**
 ************
 * CHARACTERS
 ************
 */
const write = document.getElementById('write');
const text = document.getElementById('text');
function traceCharacter(character, position) {
  write.innerHTML += character;
  const letter = document.createElement('div');
  letter.classList.add('character');
  const turbulenceZone = document.createElement('div');
  turbulenceZone.classList.add('marker');
  turbulenceZone.style.left = `${position.x * 100}%`;
  turbulenceZone.style.top = `${position.y * 100}%`;
  letter.appendChild(turbulenceZone);
  const char = document.createElement('span');
  char.innerHTML = character;
  letter.appendChild(char);
  text.appendChild(letter);
  console.log('trace character : ', character, position);
}

/**
 ************
 * UX
 ************
 */
const textZone = document.getElementById('text');
textZone.addEventListener('touchstart', () => {
  document.getElementById('wrapper').classList.toggle('hidden');
});

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
  // keys[i].addEventListener('click', keyTouched);
  keys[i].addEventListener('touchstart', keyTouched);
}
