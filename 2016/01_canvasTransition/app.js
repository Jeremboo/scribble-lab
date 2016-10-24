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

import imageUrl from '../00_inspirations/background1.jpg';
// const imageUrl = '../00_inpiration/background1.JPG';

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

const gradientPerlinNoise = (width = window.innerWidth, height = window.innerHeight ) => {
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

class Text {
  constructor(text = '', line = 0) {
    this.text = text;
    this.line = line;

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = windowWidth;
    this.canvas.height = windowHeight;
    this.gradientPerlinNoise = gradientPerlinNoise();
    this.pixelsGradientPerlinNoise = this.gradientPerlinNoise.getContext('2d').getImageData(0, 0, windowWidth, windowHeight).data;

    this.img = new Image();
    this.imgLoaded = false;
    this.img.onload = () => {
      this.imgLoaded = true;
    };
    this.img.src = imageUrl;
    this.size = windowWidth * 0.05;
    this.pos = {
      x: windowWidth * 0.5,
      y: (windowHeight * 0.5) + (this.size * this.line * 1.5),
    };

    this.range = 0;

    this.change = this.change.bind(this);
  }

  change() {
    this.range = 0;
    this.gradientPerlinNoise = gradientPerlinNoise();
    this.pixelsGradientPerlinNoise = this.gradientPerlinNoise.getContext('2d').getImageData(0, 0, windowWidth, windowHeight).data;
  }
  // Update values here
  update() {}

  render() {
    // Draw text (destination)
    this.ctx.beginPath();
    if (this.imgLoaded) {
      this.ctx.font = `bold ${this.size}pt CenturyGothic`;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.text, this.pos.x, this.pos.y);
      this.ctx.globalCompositeOperation = 'source-in';
      // Draw image (source)
      this.ctx.drawImage(this.img, 0, 0);

      if (this.range < 255) {
        const imageData = this.ctx.getImageData(0, 0, windowWidth, windowHeight);
        const pixels = imageData.data;
        const length = pixels.length;
        let i = 0;
        while (i < length) {
          const show = (this.range > this.pixelsGradientPerlinNoise[i]) ? 1 : 255;
          pixels[i] = (pixels[i++] * show);
          pixels[i] = (pixels[i++] * show);
          pixels[i] = (pixels[i++] * show);
          i++;
        }
        this.ctx.putImageData(imageData, 0, 0);
        this.range += 1;
      }
    }
    context.drawImage(this.canvas, 0, 0);
  }
}

// START
const codevemberText = new Text('CODEVEMBER', 0);
const dayText = new Text('day 1', 1);

document.body.addEventListener('click', () => {
  codevemberText.change();
});

function loop() {
  codevemberText.update();
  codevemberText.render();
  dayText.update();
  dayText.render();
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
