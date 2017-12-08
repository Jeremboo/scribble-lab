// TODO
// - définir la taille de la surface
// - créer une canvas avec les même propriétés
// - définir les valeurs
// - créer dans le DOM une surface avec ces mêmes valeurs
// - loop pour animer le dom

import { canvasBuilder, getRandomInt, getXBetweenTwoNumbersWithPercent } from 'utils'
import TweenLite from 'gsap'

const easing = (t) => t*t

const WORDS = [
  ' 01    Tolyblood                         2017',
  ' 02    Oho\'s The King                    2017',
  ' 03    Naypal                            2017',
  ' 04    Yentrée                           2017',
  ' 05    Jhibuya K                         2017',
  ' 06    Epdate Required                   2016',
  ' 07    Tonfiance                         2016',
  ' 08    Auibus                            2016',
  ' 09    Iroupie Resistance                2016',
  ' 10    Mnicef                            2016',
  ' 11    Eicochet                          2016',
  ' 12    Mori                              2015',
  ' 13    Ship Food                         2014',
  ' 14    Triggers                          2014',
  ' 15    Gobelins Sound Experiments        2014',
  ' 16    Luminaria                         2014',
  ' 17    Odissey                           2014',
  ' 18    Sauna                             2012',
  ' 19    Atmosphere                        2012',
  ' 20    Polymorphisme                     2012',
  '                                             ',
  ' A1    About                                 ',
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
      const line = [...this.words[y]];
      const cellLine = [];
      for (x = 0; x < this.width; x++) {
        const span = document.createElement('span');
        // span.innerHTML = line[x];
        span.setAttribute('data-content', line[x])
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
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        const position = (x * this.width) + y;
        const uv = {
          x: x / this.width,
          y: y / this.height,
        }
        callback(this.cb.imageData, i4, uv);
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
    const t = this.timer / this.duration;
    const l = this.rules.length;
    for (y = 0; y < this.height; y++) {
      for (x = 0; x < this.width; x++) {
        const pixel = [
          this.cb.imageData.data[i4 + 0] / 255,
          this.cb.imageData.data[i4 + 1] / 255,
          this.cb.imageData.data[i4 + 2] / 255,
          this.cb.imageData.data[i4 + 3] / 255,
        ];
        const cell = this.cells[y][x];
        for (i = 0; i < l; i++) {
          this.rules[i](pixel, cell, t)
        }
        i4 += 4;
      }
    }
  }
}

const SHUFFLING_VALUES = [
  '!', '§', '$', '%',
  '&', '/', '(', ')',
  '=', '?', '_', '<',
  '>', '^', '°', '*',
  '#', '-', ':', ';', '~',
];
// START
const surfaceAnimation = new SurfaceAnimation(
  WORDS,
  document.getElementById('wrapper'),
  {
    duration: 1,
  },
);
surfaceAnimation.setImageData((imageData, i4, uv) => {
  // -------------------------------------------------------- Random Animation
  // imageData.data[i4 + 0] = getRandomInt(0, 255)
  // imageData.data[i4 + 1] = getRandomInt(0, 255)
  // imageData.data[i4 + 2] = getRandomInt(0, 255)
  // imageData.data[i4 + 3] = 255
  // -------------------------------------------------------- 45% animation
  imageData.data[i4 + 0] = getXBetweenTwoNumbersWithPercent(0, 117, easing(uv.x)) + (138 * uv.y);
  imageData.data[i4 + 1] = 0
  imageData.data[i4 + 2] = 0
  imageData.data[i4 + 3] = 255
});


// STYLE
surfaceAnimation.forEachSell((cell, coord) => {
  if (coord.x < 4 || coord.x > 40) {
    cell.style.color = '#dd0958'
  }
})


surfaceAnimation.addRule((pixel, cell, t) => {
  const value = cell.getAttribute('data-content')
  if (t >= pixel[0]) {
    cell.innerHTML = value
  } else if (t >= pixel[0] - 0.5) {
    cell.style.backgroundColor = 'transparent'
    if (value !== ' ') {
      cell.innerHTML = SHUFFLING_VALUES[Math.floor(Math.random() * SHUFFLING_VALUES.length)];
    }
  }
});

setTimeout(() => {
  surfaceAnimation.play();
}, 500)
