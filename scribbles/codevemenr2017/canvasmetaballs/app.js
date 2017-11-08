Math.sqr = a => a * a;
const getVec2Length = (x, y) => Math.sqrt(Math.sqr(y) + Math.sqr(x));
const getDistBetweenTwoVec2 = (x1, y1, x2, y2) => getVec2Length(x2 - x1, y2 - y1);

const canvasBuilder = (width = window.innerWidth, height = window.innerHeight) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  return {
    canvas,
    context,
    getImageData: () => context.getImageData(0, 0, width, height).data,
  };
};

const gradientArc = (ctx, { x = 0, y = 0, size = 10, ratio = 0.5 } = {}) => {
  const canvasB = canvasBuilder(ctx.canvas.width, ctx.canvas.height);
  // create with the temps canvas
  const gradStyle = canvasB.context.createRadialGradient(x, y, 1, x, y, size);
  gradStyle.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradStyle.addColorStop(ratio, 'rgba(0, 0, 0, 0.5)');
  gradStyle.addColorStop(1, 'rgba(0, 0, 0, 0)');

  canvasB.context.fillStyle = gradStyle;
  canvasB.context.arc(x, y, size, 0, Math.PI * 2);
  canvasB.context.fill();
  ctx.drawImage(canvasB.canvas, 0, 0);
};

window.URL = window.URL || window.webkitURL;
const applyImageToCanvas = (url, w, h, handling) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = (e) => {
    if (e.target.status === 200) {
      const blob = e.target.response;
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.onload = () => {
        const width = w || image.width;
        const height = h || image.height;
        const canvasB = canvasBuilder(width, height);
        const { canvas, context } = canvasB;
        context.globalAlpha = 1;
        context.drawImage(image, 0, 0, width, height);
        window.URL.revokeObjectURL(blob);
        // resolve(Object.assign(canvasB, { image }));
        resolve(canvas);
      };
      image.onerror = () => {
        reject('Err : Canvas cannot be loaded');
      };
      image.src = window.URL.createObjectURL(blob);
    }
  };
  xhr.send();
});

/* ---- CREATING ZONE ---- */
// http://jamie-wong.com/2014/08/19/metaballs-and-marching-squares/
// http://varun.ca/metaballs/
// http://paperjs.org/examples/meta-balls/
// https://jsfiddle.net/umaar/2zZhj/

class BubbleCanvas {
  // Save state here
  constructor(size) {
    this.size = size;
    this.bubbleSize = size;
    this.littleBubbleSize = size * 0.5;
    this.threshold = 200;

    this.center = {
      x: this.size * 0.5,
      y: this.size * 0.5,
    };

    this.mousePosition = {
      x: this.size * 0.5,
      y: this.size * 0.5,
    };

    this.littleBubble = {
      x: this.size * 0.5,
      y: this.size * 0.5,
    };

    this.littleBubbleForce = {
      x: 0,
      y: 0,
    };

    // Create canvas
    const { canvas, context } = canvasBuilder(this.size, this.size);
    this.canvas = canvas;
    this.context = context;
    // getMousePosition
    canvas.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.offsetX;
      this.mousePosition.y = e.offsetY;
    });
    canvas.addEventListener('mouseout', () => {
      this.mousePosition.x = this.center.x;
      this.mousePosition.y = this.center.y;
    });

    // Load background image
    // https://i.imgur.com/462xXUs.png
    // https://pixabay.com/get/eb3db40a2ef2073ed95c4518b74d4095e272e1dc04b014419cf9c97fafebb4_640.jpg
    this.backgroundImg = false;
    applyImageToCanvas('https://i.imgur.com/462xXUs.png', this.size, this.size).then((_canvas) => {
      this.backgroundImg = _canvas;
    });
  }

  update() {
    const vecForce = {
      x: this.mousePosition.x - this.littleBubble.x,
      y: this.mousePosition.y - this.littleBubble.y,
    };
    const force = Math.max(0, (this.size * 0.3) - getVec2Length(vecForce.x, vecForce.y));

    this.littleBubbleForce.x += vecForce.x * force * 0.001;
    this.littleBubbleForce.y += vecForce.y * force * 0.001;

    this.littleBubble.x += this.littleBubbleForce.x;
    this.littleBubble.y += this.littleBubbleForce.y;

    this.littleBubble.x += (this.center.x - this.littleBubble.x) * 0.2;
    this.littleBubble.y += (this.center.y - this.littleBubble.y) * 0.2;

    this.littleBubbleForce.x *= 0.8;
    this.littleBubbleForce.y *= 0.8;

    // play with the scale
    // const dist = getDistBetweenTwoVec2(this.littleBubble.x, this.littleBubble.y, this.center.x, this.center.y);
    // const scale = Math.min(Math.max(0, (5 - ((dist / this.size) * 20))), 1)
    // this.littleBubbleSize = this.bubbleSize * scale;
  }

  render() {
    if (this.backgroundImg) {
      // init
      this.context.clearRect(0, 0, this.size, this.size);
      this.context.globalCompositeOperation = 'source-over';

      // Gradient circles
      gradientArc(this.context, { x: this.center.x, y: this.center.y, size: this.bubbleSize, ratio: 0.4 });
      gradientArc(this.context, { x: this.littleBubble.x, y: this.littleBubble.y, size: this.littleBubbleSize, ratio: 0.2 });

      // threshold
      this.renderThershold();
      // Apply image
      this.context.globalCompositeOperation = 'source-in';
      this.context.drawImage(this.backgroundImg, 0, 0);
    }
  }

  renderThershold() {
    const imageData = this.context.getImageData(0, 0, this.size, this.size);
    const pix = imageData.data;

    for (let i = 3; i < pix.length; i += 4) {
      if (pix[i] < this.threshold) {
        pix[i] = 0;
      } else {
        pix[i] = Math.min(255, (pix[i] - this.threshold) * 20);
      }
    }
    this.context.putImageData(imageData, 0, 0);
  }
}

const bubble = new BubbleCanvas(512);
bubble.canvas.id = 'canvas';
document.body.insertBefore(bubble.canvas, document.body.firstChild);

function loop() {
  bubble.update();
  bubble.render();
}


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop() {
/**/  loop();
/**/  requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
