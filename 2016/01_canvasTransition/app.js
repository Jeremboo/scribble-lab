/**/ /* ---- CORE ---- */
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ canvas.id = 'canvas';
/**/ canvas.width = window.innerWidth;
/**/ canvas.height = window.innerHeight;
/**/ document.body.appendChild(canvas);
/**/ /* ---- CORE END ---- */
/* ---- CREATING ZONE ---- */

import imageUrl from '../00_inspirations/background1.jpg';
// const imageUrl = '../00_inpiration/background1.JPG';


class Text {
  constructor(text = '', line = 0) {
    this.text = text;
    this.line = line;

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = windowWidth;
    this.canvas.height = windowHeight;

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
    }
    context.drawImage(this.canvas, 0, 0);
  }
}

// START
const codevemberText = new Text('CODEVEMBER', 0);
const dayText = new Text('day 1', 1);

function loop() {
  codevemberText.update();
  codevemberText.render();
  dayText.update();
  dayText.render();
}


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   // context.clearRect(0,0, windowWidth, windowHeight);
/**/   loop();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
