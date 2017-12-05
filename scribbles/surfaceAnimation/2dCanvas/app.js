// TODO
// - définir la taille de la surface
// - créer une canvas avec les même propriétés
// - définir les valeurs
// - créer dans le DOM une surface avec ces mêmes valeurs
// - loop pour animer le dom

import { canvasBuilder, getRandomInt } from 'utils'

const SURFACE_WIDTH = 20;
const SURFACE_HEIGHT = 20;
const INSTANCE = SURFACE_WIDTH * SURFACE_HEIGHT;

class SurfaceAnimation {
  constructor(width, height, { name = 'preview' } = {}) {
    this.width = width;
    this.height = height;
    this.instance = width * height;
    this.cb = canvasBuilder(this.width, this.height);

    // put in the dom
    this.cb.canvas.id = name;
    document.body.appendChild(this.cb.canvas);
  }

  setImageData(callback) {
    let x, y, i4 = 0;
    const imageData = this.cb.context.getImageData(0, 0, this.width, this.height)
    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        const position = (x * this.width) + y;
        callback(imageData, i4);
        i4 += 4;
      }
    }
    this.cb.context.putImageData(imageData, 0, 0);
  }
}


// START
const surfaceAnimation = new SurfaceAnimation(SURFACE_WIDTH, SURFACE_HEIGHT);
surfaceAnimation.setImageData((imageData, i4) => {
  imageData.data[i4 + 0] = getRandomInt(0, 255)
  imageData.data[i4 + 1] = getRandomInt(0, 255)
  imageData.data[i4 + 2] = getRandomInt(0, 255)
  imageData.data[i4 + 3] = 255
});


// create dom instances

// update dom value refert to the canvas
