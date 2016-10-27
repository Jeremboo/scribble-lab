/**/ /* ---- CORE ---- */
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ canvas.id = 'canvas';
/**/ canvas.width = windowWidth;
/**/ canvas.height = windowHeight;
/**/ document.body.insertBefore(canvas, document.body.firstChild);
/**/ /* ---- CORE END ---- */
/* ---- CREATING ZONE ---- */

import imageUrl1 from '../00_inspirations/background1.jpg';
import imageUrl2 from '../00_inspirations/background2.jpg';
// const imageUrl1 = '../00_inpiration/background1.JPG';


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
  /* Scale random iterations onto the canvas to generate Perlin noise. */
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
  constructor(image = imageUrl1, newImage) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = windowWidth;
    this.canvas.height = windowHeight;
    this.transitionPixels = gradientPerlinNoise().getContext('2d').getImageData(0, 0, windowWidth, windowHeight).data;

    // Img
    this.viewedImg = this.loadNewImage(image);
    this.newImg = newImage ? this.loadNewImage(newImage) : false;


    this.change = this.change.bind(this);
  }

  loadNewImage(image) {
    let img = false;
    if (typeof (image) === 'string') {
      img = new Image();
      img.onload = () => {
        img.isReady = true;
        img.range = this.viewedImg ? 0 : 255;
        img.pos = {
          x: -(this.canvas.width * 0.5) - (img.width * 0.5),
          y: -(this.canvas.height * 0.5) - (img.height * 0.5),
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
      x: -(this.canvas.width * 0.5),
      y: -(this.canvas.height * 0.5),
    };
    return img;
  }

  change(image) {
    if (image) {
      if (this.newImg) this.viewedImg = this.newImg;
      this.newImg = this.loadNewImage(image);
    }
    this.transitionPixels = gradientPerlinNoise().getContext('2d').getImageData(0, 0, windowWidth, windowHeight).data;
  }

  update() {
    if (this.newImg && this.newImg.isReady) {
      this.newImg.range += 2;
      if (this.newImg.range >= 255) {
        this.viewedImg = this.newImg;
        this.newImg = false;
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
  constructor(text = '', line = 0, image = imageUrl1, image2) {
    super(image, image2);
    this.text = text;
    this.line = line;

    this.size = windowWidth * 0.05;
    this.pos = {
      x: windowWidth * 0.5,
      y: (windowHeight * 0.5) + (this.size * this.line * 1.5),
    };
  }

  render() {
    // Draw text (destination)
    if (this.viewedImg) {
      this.ctx.font = `bold ${this.size}pt CenturyGothic`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.text, this.pos.x, this.pos.y);
      this.ctx.globalCompositeOperation = 'source-in';
    }
    super.render();
  }
}

const loadImage = (url, callback) => {
  const img = new Image();
  img.onload = () => {
    callback(img);
  };
  img.src = url;
};

// START

// TODO
// Load backgroundImage
// On load show in canvas.
// Load text with another image loaded
// Change background image
// Loop
const loopItems = [];

loadImage(imageUrl1, (firstImage) => {
  loopItems.push(new ImageTransition(firstImage));
  loopItems.push(new Text('CODEVEMBER', 0, firstImage, imageUrl2));
  loopItems.push(new Text('day 1', 1, firstImage, imageUrl2));
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
