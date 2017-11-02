// Random text shuffle: https://codepen.io/SaschaSigl/pen/woGYKJ?q=shuffle&order=popularity&depth=everything&show_forks=false
// Tuto shuffle letters effect: https://tutorialzine.com/2011/09/shuffle-letters-effect-jquery
// Check wave: http://lab.hakim.se/checkwave/

class Loop {
  constructor() {
    this._idRAF = -1;
    this._count = 0;
    this._listeners = [];
    this._binds = {};
    this._binds.update = this._update.bind(this);
  }
  _update() {
    let listener = null;
    let i = this._count;
    while (--i >= 0) {
      listener = this._listeners[i];
      if (listener) {
        listener.apply(this, null);
      }
    }
    this._idRAF = requestAnimationFrame(this._binds.update);
  }
  start() { this._update(); }
  stop() {
    cancelAnimationFrame(this._idRAF);
  }
  add(listener) {
    const idx = this._listeners.indexOf(listener);
    if (idx >= 0) {
      return;
    }
    this._listeners.push(listener);
    this._count++;
  }
  remove(listener) {
    const idx = this._listeners.indexOf(listener);
    if (idx < 0) {
      return;
    }
    this._listeners.splice(idx, 1);
    this._count--;
  }
}
const loop = new Loop();
loop.start()

/**
 * Word Shuffler
 * Get a word into a div element and animate him to shuffling wheres letters
 * @type {[type]}
 */
class LetterShuffler {
  constructor(wrapper, letter, { duration = 30 } = {}) {
    this.SHUFFLING_VALUES = [
      '!', '§', '$', '%',
      '&', '/', '(', ')',
      '=', '?', '_', '<',
      '>', '^', '°', '*',
      '#', '-', ':', ';', '~',
    ];
    this.id = Math.random()
    this.animate = false;

    this.wrapper = wrapper;
    this.letter = letter;
    this.letterToShown = this.letter;
    this.wrapper.innerHTML = '';
    this.timer = 0;
    this.duration = 30;
    this.scaleTargeted = 2;

    this.show = this.show.bind(this);
    this.update = this.update.bind(this);


    // TODO regex
    if (letter === '+' || letter === '-' || letter === '|' || letter === ' ') {
      this.wrapper.classList.add('purple')
    } else {
      this.duration *= 2.1;
    }
  }

  show(letter = this.letter) {
    this.animate = true;
    this.timer = 0;
    this.letterToShown = letter;
    loop.add(this.update)
  }

  hide() {
    this.show('')
  }

  update() {
    if (this.animate) {
      this.timer++;
      if (this.timer < this.duration) {
        this.wrapper.innerHTML = this.SHUFFLING_VALUES[Math.floor(Math.random() * this.SHUFFLING_VALUES.length)];
        this.wrapper.style.transform = `scale(${(this.timer / this.duration) * 0.9})`
      } else {
        this.wrapper.innerHTML = this.letterToShown;
        loop.remove(this.update)
      }
    }
  }
}

/**
 *
 */
class WordShuffler {
  constructor(wrapper, words, { duration = 0.2 } = {}) {
    this.wrapper = wrapper;
    this.wrapper.innerHTML = '';

    this.timer = 0;
    this.lettersShown = 0;
    this.letterDuration = duration * 60;
    this.lettersShuffler = [];
    this.arrayOfLetters = [...words];
    this.duration = this.letterDuration * this.arrayOfLetters.length;

    this.arrayOfLetters.forEach((letter) => {
      const letterWrapper = document.createElement('span');
      this.wrapper.appendChild(letterWrapper);
      const letterShuffler = new LetterShuffler(letterWrapper, letter, {
        duration: this.letterDuration,
      });
      this.lettersShuffler.push(letterShuffler);
    });

    this.update = this.update.bind(this);
    this.timer = 0;
  }

  show() {
    this.timer = 0;
    this.lettersShown = 0;
    loop.add(this.update);
  }

  update() {
    this.timer += 1;
    if (this.timer > (this.letterDuration * this.lettersShown)) {
      this.lettersShuffler[this.lettersShown].show();
      this.lettersShown += 1
    }

    if (this.timer >= this.duration) {
      loop.remove(this.update)
    }
  }
}

const WORDS = [
  '+  -                             -  +',
  '                                     ',
  '                                     ',
  '                                     ',
  '                                     ',
  '|          codevember day 1         |',
  '                                     ',
  '                                     ',
  '                                     ',
  '                                     ',
  '+  -                             -  +',
];

class TextShuffler {
  constructor(wrapper, lines) {
    this.i = 0;
    this.lines = [];
    this.durationInterval = 50;
    this.wrapper = wrapper;
    for (let i = 0; i < lines.length; i++) {
      this.lines.push(this._addLine(lines[i]));
    }
  }

  _addLine(line) {
    const lineElm = document.createElement('p')
    this.wrapper.appendChild(lineElm)
    const word = new WordShuffler(lineElm, line, { duration: 0.05 })
    return word;
  }

  show() {
    this.i = 0;
    const interval = setInterval(() => {
      this.lines[this.i].show();
      this.i += 1;

      if (this.i === this.lines.length) {
        clearInterval(interval)
      }
    }, this.durationInterval);
  }

  hide() {

  }
}


// START
const wrapper = document.getElementById('wrapper')
const text = new TextShuffler(wrapper, WORDS)
text.show();

let show = true;
setInterval(() => {
  text.show();
  // if (show) {
  //   text.show();
  // } else {
  //   text.hide();
  // }

  show = !show;
}, 4000);
