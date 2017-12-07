// TODO
// - définir la taille de la surface
// - créer une canvas avec les même propriétés
// - définir les valeurs
// - créer dans le DOM une surface avec ces mêmes valeurs
// - loop pour animer le dom

import { canvasBuilder, getRandomInt } from 'utils'

const WORDS = [
  '+  -                             -  +',
  '                                     ',
  '                                     ',
  '                                     ',
  '                                     ',
  '|          Codevember Day 1         |',
  '                                     ',
  '                                     ',
  '                                     ',
  '                                     ',
  '                                     ',
  '+  -                             -  +',
];

class SurfaceAnimation {
  constructor(words, wrapper, { name = 'preview', size = '1em', duration = 1 } = {}) {
    this.words = words;
    this.duration = duration * 60; // duration in second per frame
    this.wrapper = wrapper;
    this.wrapper.classList.add('SurfaceAnimation');
    this.size = size;
    this.width = words[0].length;
    this.height = words.length;
    this.instance = this.width * this.height;
    this.cb = canvasBuilder(this.width, this.height);

    this.timer = 0;
    this.cells = [];
    this.rules = [];

    // put in the dom
    this.cb.canvas.id = name;
    this.cb.imageData = this.cb.context.getImageData(0, 0, this.width, this.height)
    document.body.appendChild(this.cb.canvas);

    // DOM
    this.injectInDom()

    // Bind
    this.loop = this.loop.bind(this)
    this.update = this.update.bind(this)
  }

  injectInDom() {
    let x, y
    for (y = 0; y < this.height; y++) {
      const p = document.createElement('p');
      const letters = [...this.words[y]];
      const cellLine = [];
      for (x = 0; x < this.width; x++) {
        const span = document.createElement('span');
        span.innerHTML = letters[x];
        p.appendChild(span)
        cellLine.push(span)
      }
      this.wrapper.appendChild(p);
      this.cells.push(cellLine)
    }
  }

  // TODO switch to RGBA, RGB, LUMINANCE, LUMINANCE ALPHA
  setImageData(callback) {
    let x, y, i4 = 0;
    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        const position = (x * this.width) + y;
        callback(this.cb.imageData, i4);
        i4 += 4;
      }
    }
    this.cb.context.putImageData(this.cb.imageData, 0, 0);
  }

  forEachSell(callback) {
    let x, y;
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        callback(this.cells[y][x], { x, y })
      }
    }
  }

  /**
   * Add a rule when there is an animation
   * @type {Array}  pixelData ... [r, g, b, a] values [0 => 1]
   * @type {Node}   cell ........ DOM attribute
   * @type {Number} t ........... the easing position. [0 => 1]
   */
  addRule(callback) {
    this.rules.push(callback);
  }

  /**
   * Start the animation
   */
  play() {
    this.timer = 0;
    this.loop()
  }

  loop() {
    this.timer += 1
    this.update();
    if (this.timer <= this.duration) {
      requestAnimationFrame(this.loop);
    }
  }

  update() {
    let x, y, i, i4 = 0;
    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        const pixel = [
          this.cb.imageData.data[i4 + 0] / 255,
          this.cb.imageData.data[i4 + 1] / 255,
          this.cb.imageData.data[i4 + 2] / 255,
          this.cb.imageData.data[i4 + 3] / 255,
        ];
        const cell = this.cells[y][x];
        const t = this.timer / this.duration;

        for (i = 0; i < this.rules.length; i++) {
          this.rules[i](pixel, cell, t)
        }
        i4 += 4;
      }
    }
  }
}


// START
const surfaceAnimation = new SurfaceAnimation(
  WORDS,
  document.getElementById('wrapper'),
  {
    duration: 0.5,
  },
);
surfaceAnimation.setImageData((imageData, i4) => {
  imageData.data[i4 + 0] = getRandomInt(0, 255)
  imageData.data[i4 + 1] = getRandomInt(0, 255)
  imageData.data[i4 + 2] = getRandomInt(0, 255)
  imageData.data[i4 + 3] = 255
});
surfaceAnimation.forEachSell((cell, coord) => {
  if (coord.x < 2) {
    cell.style.color = 'white'
  }
})
surfaceAnimation.addRule((pixel, cell, t) => {
  if (t > pixel[0]) {
    cell.style.opacity = 1;
    cell.style.backgroundColor = 'red'
  } else if (t > (pixel[0] - 0.1)) {
    cell.style.opacity = 1;
    cell.style.backgroundColor = 'blue'
  } else {
    cell.style.opacity = 0;
  }
});
surfaceAnimation.play();
