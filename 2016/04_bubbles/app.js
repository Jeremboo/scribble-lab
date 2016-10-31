const canvas = document.getElementById("canvas"),
      context = canvas.getContext("2d"),
      colorPallete = ["#ff1783", "#17c9ff", "#36ff40"];


var width = canvas.width = window.innerWidth,
    height = canvas.height = window.innerHeight,
    origin = {x: width / 2, y: height / 2},
    mouse = {x: width / 2, y: height / 2},
    balls = [],
    count = 0,
    randomCount = 1;

window.onresize = () =>{
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  origin = {x: width / 2, y: height / 2};
}

class Ball{
  constructor(){
    this.x = origin.x;
    this.y = origin.y;
    this.angle = Math.PI * 2 * Math.random();
    this.vx = (1.3 + Math.random() * .3) * Math.cos(this.angle);
    this.vy = (1.3 + Math.random() * .3) * Math.sin(this.angle);
    this.r = 6 + 3 * Math.random();
    this.color = colorPallete[Math.floor(Math.random() * colorPallete.length)];
  }

  update(){
    this.x += this.vx;
    this.y += this.vy;
    this.r -= .01;
  }
}

loop();
function loop(){
  context.clearRect(0, 0, width, height);
  if(count === randomCount){
    balls.push(new Ball());
    count = 0;
    randomCount = 3 + Math.floor(Math.random() * 5);
  }
  count++;
  for(var i = 0; i < balls.length; i++){
    var b = balls[i];
    context.fillStyle = b.color;
    context.beginPath();
    context.arc(b.x, b.y, b.r, 0, Math.PI * 2, false);
    context.fill();
    b.update();
  }

  origin.x += (mouse.x - origin.x) * .15;
  origin.y += (mouse.y - origin.y) * .15;

  context.fillStyle = "#ffdd02";
  context.beginPath();
  context.arc(origin.x, origin.y, 40, 0, Math.PI * 2, false);
  context.fill();

  removeBall();
  requestAnimationFrame(loop);
}

function removeBall(){
  for(var i = 0; i < balls.length; i++){
    var b = balls[i];
    if(
      b.x + b.r < 0 ||
      b.x - b.r > width ||
      b.y + b.r < 0 ||
      b.y - b.r > height ||
      b.r < 0
    ){
      balls.splice(i, 1);
    }
  }
}

window.addEventListener("mousemove", function(e){
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}, false);
