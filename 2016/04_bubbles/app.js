/**/ /* ---- CORE ---- */
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ canvas.id = 'canvas';
/**/ let windowWidth = canvas.width = window.innerWidth;
/**/ let windowHeight = canvas.height = window.innerHeight;
/**/ let origin = { x: 100, y: windowHeight * 0.5 };
/**/ document.body.append(canvas, document.body.firstChild);
/**/ window.onresize = () => {
/**/  windowWidth = canvas.width = window.innerWidth;
/**/  windowHeight = canvas.height = window.innerHeight;
/**/  origin = { x: 100, y: windowHeight * 0.5 };
/**/ };
/**/ /* ---- CORE END ---- */
/* ---- CREATING ZONE ---- */

const AMPL = 0.15;
const MAX_SIZE = 20;

const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);

const colorPallete = ["#ff1783", "#17c9ff", "#36ff40"];
let balls = [];
let count = 0;
let randomCount = 1;


class Ball{
  constructor(){
    this.x = origin.x;
    this.y = origin.y;
    this.angle = Math.PI * 2 * getRandomFloat(1 - AMPL, 1 + AMPL);
    this.r = MAX_SIZE * Math.random();
    this.vx = Math.cos(this.angle) * (this.r * 0.15);
    this.vy = Math.sin(this.angle) * (this.r * 0.15);
    this.color = colorPallete[Math.floor(Math.random() * colorPallete.length)];
    this.died = false;
  }

  update(){
    this.x += this.vx;
    this.y += this.vy;
    this.r -= 0.1;
    if ((this.r - 0.1) <= 0.1) {
      this.r = 0.1;
      this.died = true;
    }
  }

  render() {
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
    context.fill();
  }
}

function loop(){
  if(count === randomCount){
    balls.push(new Ball());
    count = 0;
    randomCount = 3 + Math.floor(Math.random() * 5);
  }
  count++;
  for(var i = 0; i < balls.length; i++){
    var b = balls[i];
    b.update();
    b.render();
  }
  balls = balls.filter(b => (!b.died));
}

window.addEventListener("mousemove", function(e){
  // TODO
}, false);


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   context.clearRect(0,0, windowWidth, windowHeight);
/**/   loop();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
