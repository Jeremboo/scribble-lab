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
  constructor(wrapper, letter, { duration = 1 } = {}) {
    this.SHUFFLING_VALUES = [
      '!', '§', '$', '%',
      '&', '/', '(', ')',
      '=', '?', '_', '<',
      '>', '^', '°', '*',
      '#', '-', ':', ';', '~',
    ];
    this.id = Math.random()

    this.wrapper = wrapper;
    this.letter = letter;
    this.letterToShown = this.letter;
    this.wrapper.innerHTML = '';
    this.timer = 0;
    this.duration = duration * 60;

    this.show = this.show.bind(this);
    this.update = this.update.bind(this);
  }

  show(letter = this.letter) {
    this.timer = 0;
    this.letterToShown = letter;
    loop.add(this.udpate)
  }

  hide() {
    this.show('')
  }

  update() {
    this.timer++;
    if (this.timer < this.duration) {
      this.wrapper.innerHTML = this.SHUFFLING_VALUES[Math.floor(Math.random() * this.SHUFFLING_VALUES.length)];
    } else {
      this.wrapper.innerHTML = this.letterToShown;
      loop.remove(this.update)
    }
    return this.id
  }
}

const easing = t => t * t;

/**
 *
 */
class WordShuffler {
  constructor(wrapper, words, { duration = 2 } = {}) {
    this.wrapper = wrapper;
    this.wrapper.innerHTML = '';

    this.timer = 0;
    this.duration = duration * 60;
    this.nbrOfLettersToShown = 0;

    this.letters = [];
    this.letterDuration = duration / words.length

    const arrayOfLetters = [...words];
    arrayOfLetters.forEach((letter) => {
      const letterWrapper = document.createElement('span');
      letterWrapper.style.margin = '0 2px'
      this.wrapper.appendChild(letterWrapper);
      const letterShuffler = new LetterShuffler(letterWrapper, letter, {
        duration: this.letterDuration
      });
      this.letters.push(letterShuffler)
    })

    this.update = this.update.bind(this)
  }

  show() {
    this.timer = 0
    loop.add(this.update)
  }

  update() {
    this.timer++

    const nbrOfLettersToShown = Math.floor(easing(this.timer / this.duration) * 10);
    if (nbrOfLettersToShown > this.nbrOfLettersToShown) {
      this.letters[nbrOfLettersToShown - 1].show();
      this.nbrOfLettersToShown += 1;
    }

    if (this.timer >= this.duration) {
      loop.remove(this.update)
    }
  }
}


/* ---- START ---- */
const word = new WordShuffler(document.getElementById('letter'), '   TONY   ')
setTimeout(() => {
  word.show('a')
  // setTimeout(() => {
  //   word.hide()
  // }, 1000);
}, 1000);

// function loop() {
//   letter.update()
// }
//
// /* ---- CREATING ZONE END ---- */
// /**/
// /**/ /* ---- LOOP ---- */
// /**/ function _loop() {
//       loop();
// /**/ 	requestAnimationFrame(_loop);
// /**/ }
// /**/ _loop();

// function WordShuffler(holder,opt){
//   var that = this;
//   var time = 0;
//   this.now;
//   this.then = Date.now();
//
//   this.delta;
//   this.currentTimeOffset = 0;
//
//   this.word = null;
//   this.currentWord = null;
//   this.currentCharacter = 0;
//   this.currentWordLength = 0;
//
//
//   var options = {
//     fps : 20,
//     timeOffset : 5,
//     textColor : '#000',
//     fontSize : "50px",
//     useCanvas : false,
//     mixCapital : false,
//     mixSpecialCharacters : false,
//     needUpdate : true,
//     colors : [
//       '#f44336', '#e91e63', '#9c27b0',
//       '#673ab7', '#3f51b5', '#2196f3',
//       '#03a9f4', '#00bcd4', '#009688',
//       '#4caf50', '#8bc34a', '#cddc39',
//       '#ffeb3b', '#ffc107', '#ff9800',
//       '#ff5722', '#795548', '#9e9e9e',
//       '#607d8b'
//     ]
//   }
//
//   if(typeof opt != "undefined"){
//     for(key in opt){
//       options[key] = opt[key];
//     }
//   }
//
//
//
//   this.needUpdate = true;
//   this.fps = options.fps;
//   this.interval = 1000/this.fps;
//   this.timeOffset = options.timeOffset;
//   this.textColor = options.textColor;
//   this.fontSize = options.fontSize;
//   this.mixCapital = options.mixCapital;
//   this.mixSpecialCharacters = options.mixSpecialCharacters;
//   this.colors = options.colors;
//
//    this.useCanvas = options.useCanvas;
//
//   this.chars = [
//     'A', 'B', 'C', 'D',
//     'E', 'F', 'G', 'H',
//     'I', 'J','K','L',
//     'M','N','O','P',
//     'Q','R','S','T',
//     'U','V','W','X',
//     'Y','Z'
//   ];
//   this.specialCharacters = [
//     '!','§','$','%',
//     '&','/','(',')',
//     '=','?','_','<',
//     '>','^','°','*',
//     '#','-',':',';','~'
//   ]
//
//   if(this.mixSpecialCharacters){
//     this.chars = this.chars.concat(this.specialCharacters);
//   }
//
//   this.getRandomColor = function () {
//     var randNum = Math.floor( Math.random() * this.colors.length );
//     return this.colors[randNum];
//   }
//
//   //if Canvas
//
//   this.position = {
//     x : 0,
//     y : 50
//   }
//
//   //if DOM
//   if(typeof holder != "undefined"){
//     this.holder = holder;
//   }
//
//   if(!this.useCanvas && typeof this.holder == "undefined"){
//     console.warn('Holder must be defined in DOM Mode. Use Canvas or define Holder');
//   }
//
//
//   this.getRandCharacter = function(characterToReplace){
//     if(characterToReplace == " "){
//       return ' ';
//     }
//     var randNum = Math.floor(Math.random() * this.chars.length);
//     var lowChoice =  -.5 + Math.random();
//     var picketCharacter = this.chars[randNum];
//     var choosen = picketCharacter.toLowerCase();
//     if(this.mixCapital){
//       choosen = lowChoice < 0 ? picketCharacter.toLowerCase() : picketCharacter;
//     }
//     return choosen;
//
//   }
//
//   this.writeWord = function(word){
//     this.word = word;
//     this.currentWord = word.split('');
//     this.currentWordLength = this.currentWord.length;
//
//   }
//
//   this.generateSingleCharacter = function (color,character) {
//     var span = document.createElement('span');
//     span.style.color = color;
//     span.innerHTML = character;
//     return span;
//   }
//
//   this.updateCharacter = function (time) {
//
//       this.now = Date.now();
//       this.delta = this.now - this.then;
//
//
//
//       if (this.delta > this.interval) {
//         this.currentTimeOffset++;
//
//         var word = [];
//
//         if(this.currentTimeOffset === this.timeOffset && this.currentCharacter !== this.currentWordLength){
//           this.currentCharacter++;
//           this.currentTimeOffset = 0;
//         }
//         for(var k=0;k<this.currentCharacter;k++){
//           word.push(this.currentWord[k]);
//         }
//
//         for(var i=0;i<this.currentWordLength - this.currentCharacter;i++){
//           word.push(this.getRandCharacter(this.currentWord[this.currentCharacter+i]));
//         }
//
//
//         if(that.useCanvas){
//           c.clearRect(0,0,stage.x * stage.dpr , stage.y * stage.dpr);
//           c.font = that.fontSize + " sans-serif";
//           var spacing = 0;
//           word.forEach(function (w,index) {
//             if(index > that.currentCharacter){
//               c.fillStyle = that.getRandomColor();
//             }else{
//               c.fillStyle = that.textColor;
//             }
//             c.fillText(w, that.position.x + spacing, that.position.y);
//             spacing += c.measureText(w).width;
//           });
//         }else{
//
//           if(that.currentCharacter === that.currentWordLength){
//             that.needUpdate = false;
//           }
//           this.holder.innerHTML = '';
//           word.forEach(function (w,index) {
//             var color = null
//             if(index > that.currentCharacter){
//               color = that.getRandomColor();
//             }else{
//               color = that.textColor;
//             }
//             that.holder.appendChild(that.generateSingleCharacter(color, w));
//           });
//         }
//         this.then = this.now - (this.delta % this.interval);
//       }
//   }
//
//   this.restart = function () {
//     this.currentCharacter = 0;
//     this.needUpdate = true;
//   }
//
//   function update(time) {
//     time++;
//     if(that.needUpdate){
//       that.updateCharacter(time);
//     }
//     requestAnimationFrame(update);
//   }
//
//   this.writeWord(this.holder.innerHTML);
//
//
//   console.log(this.currentWord);
//   update(time);
// }
//
//
//
//
// var headline = document.getElementById('headline');
// var text = document.getElementById('text');
// var shuffler = document.getElementById('shuffler');
//
// var headText = new WordShuffler(headline,{
//   textColor : '#fff',
//   timeOffset : 18,
//   mixCapital : true,
//   mixSpecialCharacters : true
// });
//
// var pText = new WordShuffler(text,{
//   textColor : '#fff',
//   timeOffset : 2
// });
//
// var buttonText = new WordShuffler(shuffler,{
//   textColor : 'tomato',
//   timeOffset : 10
// });
//
//
//
//   shuffler.addEventListener('click',function () {
//     headText.restart();
//     pText.restart();
//     buttonText.restart();
//   });
