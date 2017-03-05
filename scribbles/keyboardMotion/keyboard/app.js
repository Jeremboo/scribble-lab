

// https://github.com/Mottie/Keyboard
// HTML + css : http://codepen.io/gschier/pen/VKgyaY
// aPPLE KEYBOARD CSS : http://codepen.io/tholex/pen/rgBcn
// Apple keyboard css with click:  http://codepen.io/januff/pen/NxNLJJ
// JS keyboard interaction: http://codepen.io/motorlatitude/pen/fLsbF
// Toturial css + jquery: https://code.tutsplus.com/tutorials/creating-a-keyboard-with-css-and-jquery--net-5774
// Tuto virtual keyboard: https://www.codeproject.com/Articles/13748/JavaScript-Virtual-Keyboard
// Touch event handling : http://tutorials.jenkov.com/responsive-mobile-friendly-web-design/touch-events-in-javascript.html


// https://code.tutsplus.com/tutorials/creating-a-keyboard-with-css-and-jquery--net-5774
const write = document.getElementById('write');
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

  write.innerHTML += character;
  return true;
}


// START
for (let i = 0; i < keys.length; i++) {
  keys[i].addEventListener('click', keyTouched);
}
