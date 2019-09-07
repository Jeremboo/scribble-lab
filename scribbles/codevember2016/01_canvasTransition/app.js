/**/ /* ---- CORE ---- */
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ canvas.id = 'canvas';
/**/ canvas.width = windowWidth;
/**/ canvas.height = windowHeight;
/**/ document.body.append(canvas, document.body.firstChild);
/**/ /* ---- CORE END ---- */
/* ---- CREATING ZONE ---- */

import { loadImage } from 'utils';

const IMAGES = [
  'http://jeremieboulay.fr/assets/bg3.jpg',
  'http://jeremieboulay.fr/assets/bg2.jpg',
  'http://jeremieboulay.fr/assets/bg1.jpg',
];

// UTILS
const createCanvas = (width = window.innerWidth, height = window.innerHeight) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  return {
    canvas,
    context,
    imageData: context.getImageData(0, 0, width, height),
  };
};
const randomNoise = (width = window.innerWidth, height = window.innerHeight) => {
  const { canvas, context, imageData } = createCanvas(width, height);
  const pixels = imageData.data;
  const length = pixels.length;
  let i = 0;
  while (i < length) {
    pixels[i++] = pixels[i++] = pixels[i++] = (Math.random() * 256) | 0;
    pixels[i++] = 255;
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
};
const perlinNoise = (width = window.innerWidth, height = window.innerHeight) => {
  const { canvas, context } = createCanvas(width, height);
  const noise = randomNoise(width, height);
  context.save();
  let size;
  for (size = 4; size <= width; size *= 2) {
    const x = (Math.random() * (width - size)) | 0;
    const y = (Math.random() * (height - size)) | 0;
    context.globalAlpha =  10 / size;
    context.drawImage(noise, x, y, size, size, 0, 0, width, height);
  }
  context.restore();
  return canvas;
};
const gradientPerlinNoise = (width = window.innerWidth, height = window.innerHeight) => {
  const { canvas, context } = createCanvas(width, height);
  const pNoise = perlinNoise(width, height);
  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0.1, 'rgba(0, 0, 0, 0.8)');
  gradient.addColorStop(0.9, 'rgba(255, 255, 255, 0.6)');
  context.drawImage(pNoise, 0, 0);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  return canvas;
};


// CORE
class ImageTransition {
  constructor(image, newImage) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = windowWidth;
    this.canvas.height = windowHeight;
    this.transitionPixels = gradientPerlinNoise().getContext('2d').getImageData(0, 0, windowWidth, windowHeight).data;
    this.transitionEndCallback = v => v;

    // Img
    this.viewedImg = this.loadNewImage(image);
    this.newImg = newImage ? this.loadNewImage(newImage) : false;


    this.change = this.change.bind(this);
  }

  loadNewImage(image) {
    let img = false;
    if (typeof (image) === 'string') {
      img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        img.isReady = true;
        img.range = this.viewedImg ? 0 : 255;
        img.pos = {
          x: (this.canvas.width * 0.5) - (img.width * 0.5),
          y: (this.canvas.height * 0.5) - (img.height * 0.5),
        };
      };
      img.src = image;
    } else if (typeof (image) === 'object') {
      img = image;
    } else {
      console.warn(`ERROR : ${image} is not a path or an Image()`);
      return img;
    }
    img.isReady = false;
    img.range = 255;
    img.pos = {
      x: 0,
      y: 0,
    };
    return img;
  }

  change(image, callback = v => v) {
    if (image) {
      if (this.newImg) this.viewedImg = this.newImg;
      this.newImg = this.loadNewImage(image);
      this.transitionEndCallback = callback;
    }
    this.transitionPixels = gradientPerlinNoise().getContext('2d').getImageData(0, 0, windowWidth, windowHeight).data;
  }

  update() {
    if (this.newImg && this.newImg.isReady) {
      this.newImg.range += 5;
      if (this.newImg.range >= 255) {
        this.viewedImg = this.newImg;
        this.newImg = false;
        this.transitionEndCallback();
      }
    }
  }

  render() {
    if (this.viewedImg) {
      this.ctx.drawImage(this.viewedImg, this.viewedImg.pos.x, this.viewedImg.pos.y);

      if (this.newImg && this.newImg.isReady) {
        const viewedImg = this.ctx.getImageData(0, 0, windowWidth, windowHeight);
        const viewedImgPixels = viewedImg.data;
        this.ctx.drawImage(this.newImg, this.newImg.pos.x, this.newImg.pos.y);
        const newImgPixels = this.ctx.getImageData(0, 0, windowWidth, windowHeight).data;

        let i = 0;
        const length = viewedImgPixels.length;
        while (i < length) {
          const pixelToShow = (this.newImg.range > this.transitionPixels[i])
            ? newImgPixels
            : viewedImgPixels
          ;
          viewedImgPixels[i] = pixelToShow[i++];
          viewedImgPixels[i] = pixelToShow[i++];
          viewedImgPixels[i] = pixelToShow[i++];
          viewedImgPixels[i] = pixelToShow[i++];
        }
        this.ctx.putImageData(viewedImg, 0, 0);
      }
    }
    context.drawImage(this.canvas, 0, 0);
  }
}

class Text extends ImageTransition {
  constructor(text = [''], image, image2) {
    super(image, image2);
    this.text = (typeof (text) === 'string') ? [text] : text;

    this.size = windowWidth * 0.1;
    this.pos = {
      x: windowWidth * 0.5,
      y: (windowHeight * 0.5),
    };

    this.canvasText = createCanvas(windowWidth, windowHeight);
    this.canvasText.context.font = `bold ${this.size}px CenturyGothic`;
    this.canvasText.context.textAlign = 'center';
    let i;
    for (i = 0; i < this.text.length; i++) {
      this.canvasText.context.fillText(this.text[i], this.pos.x, this.pos.y + (this.size * i));
    }
  }

  render() {
    if (this.viewedImg) {
      this.ctx.drawImage(this.canvasText.canvas, 0, 0);
      this.ctx.globalCompositeOperation = 'source-in';
    }
    super.render();
  }
}


// START
let background = false;
let codevemberText = false;
const loopItems = [];

function transitionLoop(key) {
  const currentImg = IMAGES[key % IMAGES.length];
  codevemberText.change(currentImg, () => {
    background.change(
      currentImg,
      () => transitionLoop(key + 1)
    );
  });
}

loadImage(IMAGES[0]).then((firstImage) => {
  background = new ImageTransition(firstImage);
  loopItems.push(background);
  codevemberText = new Text(['CODEVEMBER', 'day 1'], firstImage);
  loopItems.push(codevemberText);
  transitionLoop(1);
  setTimeout(() => {
    canvas.classList.add('_visible');
  }, 500);
});

function loop() {
  let i;
  const length = loopItems.length;
  for (i = 0; i < length; i++) {
    loopItems[i].update();
    loopItems[i].render();
  }
}

/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   context.clearRect(0,0, windowWidth, windowHeight);
/**/   loop();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
