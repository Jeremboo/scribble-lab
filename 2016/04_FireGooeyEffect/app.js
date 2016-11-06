
const AMPL = 0.1;
const ROT = 0.75;
let fireElement = false;
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let mouseX = windowWidth * 0.5;
let mouseY = windowHeight - 50;
const recordMousePosition = e => {
  mouseX = e.x;
  mouseY = e.y;
};

window.addEventListener('mousemove', recordMousePosition);
window.addEventListener('touchmove', recordMousePosition);
window.onresize = () => {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
};

// UTILS
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
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

const Ball = (context, maxSize = 30, x = 15, y = 15, color = '#ff0000') => {
  let r = 0;
  let isDied = false;
  let rMax = maxSize * Math.random();
  const angle = Math.PI * 2 * getRandomFloat(ROT - AMPL, ROT + AMPL);
  const vel = rMax * 0.025;
  const vx = Math.cos(angle) * ((maxSize - rMax) * 0.4) * 0.2;
  const vy = Math.sin(angle) * ((maxSize - rMax) * 0.4) * 0.2;

  return {
    isDied,
    update: () => {
      x += vx;
      y += vy;
      rMax -= vel;
      r += (rMax - r) * 0.2;
      if (r <= 0.2) {
        r = 0.1;
        isDied = true;
      }
    },
    render: () => {
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2, false);
      context.fill();
    },
  };
};

const Balls = (color = '#ff0000', size = 30) => {
  let balls = [];
  const { canvas, context } = createCanvas();
  canvas.classList.add('Fire-canvas');
  fireElement.appendChild(canvas);

  return {
    update: () => {
      canvas.width = windowWidth;
      canvas.height = windowHeight;
      context.clearRect(0, 0, windowWidth, windowHeight);

      if (Math.random() > 0.5) {
        balls.push(new Ball(context, size, mouseX, mouseY - (size * 0.5), color));
      }

      let i;
      const length = balls.length;
      for (i = 0; i < length; i++) {
        balls[i].update();
        balls[i].render();
      }
      balls = balls.filter(b => (!b.isDied));
    },
  };
};

const Fire = (size = 100) => {
  fireElement = document.createElement('div');
  fireElement.id = 'fire';
  fireElement.className = 'Fire';
  document.body.appendChild(fireElement);

  const f1 = new Balls('#F3DE2C', size);
  const f2 = new Balls('#FAA300', size * 0.5);
  const f3 = new Balls('#FB6107', size * 0.15);

  return {
    update: () => {
      f1.update();
      f2.update();
      f3.update();
    },
  };
};

const fire = new Fire();

/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   fire.update();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
