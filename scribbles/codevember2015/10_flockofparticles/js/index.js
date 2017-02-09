/* ---- SETTINGS ---- */

var numberParticlesStart = 1000;
var particleSize = 0.5;
var particleZone = 80;
var particleSpeed = 0.4;
var velocity = 0.99;

var showZone = false;

/* ---- INIT ---- */

var particles = [];
var mouseX = window.innerWidth/2;
var mouseY = window.innerHeight/2;

var canvas = document.createElement('canvas');
var context = canvas.getContext("2d"); 

canvas.id = "canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('mousemove',recordMousePosition);
canvas.addEventListener('mouseout',makeMouseOut);

document.body.appendChild(canvas);


/* ---- CLASS ---- */

function Particle (x, y) {
  
  this.x = x;
  this.y = y;
  
  this.vel = {
    x : _.random(-200, 200)/100,
    y : _.random(-200, 200)/100,
    min : _.random(2, 10),
    max : _.random(100, 400)/10
  }

}

Particle.prototype.render = function() {
  context.beginPath();
  context.fillStyle = "rgba(244,103,56,0.8)";
  context.arc(this.x,this.y,particleSize,0,Math.PI*2);
  context.fill();
};

Particle.prototype.renderZone = function(mouseX, mouseY) {
  context.beginPath();
  context.strokeStyle = "#ff0000";
  context.arc(mouseX,mouseY,particleZone,0,Math.PI*2);
  context.stroke();
};

Particle.prototype.update = function(mouseX,mouseY){
  
  var posRelativeToCenter = {
    x : this.x - mouseX,
    y : this.y - mouseY
  };
  
  var distance = Math.sqrt( Math.pow(posRelativeToCenter.x,2) + Math.pow(posRelativeToCenter.y,2) );
  

  if(distance > particleZone){
    
    var force = (particleZone - distance) / particleZone;
 
    var forceDirection = {
      x :  (posRelativeToCenter.x / distance) * force,
      y :  (posRelativeToCenter.y / distance) * force
    };
    
    if( Math.abs(this.vel.x + forceDirection.x) < this.vel.max)
      this.vel.x += forceDirection.x;
    if( Math.abs(this.vel.y + forceDirection.y) < this.vel.max)
      this.vel.y += forceDirection.y;

  } 
  
 
  this.x += this.vel.x*particleSpeed;
  this.y += this.vel.y*particleSpeed;

  
  if(Math.abs(this.vel.x) > this.vel.min)
      this.vel.x *= velocity;
  if(Math.abs(this.vel.y) > this.vel.min)
      this.vel.y *= velocity;
}


/* ---- Functions ----*/
	

function loop(){

	context.clearRect(0,0, canvas.width, canvas.height);

	_.chain(particles).each(function(p, index){
    p.update(mouseX,mouseY);
    p.render();
    if(showZone){
       p.renderZone(mouseX, mouseY);
    }
	});
	requestAnimationFrame(loop);
}

function recordMousePosition (e) {
	mouseX = e.x;
	mouseY = e.y;
}

function makeMouseOut(e){
  mouseX = window.innerWidth/2;
  mouseY= window.innerHeight/2;
 }



/* ---- START ---- */

for (var i = 0; i < numberParticlesStart ; i++) {
	particles.push(new Particle(
		_.random(mouseX - particleZone+10, mouseX + particleZone-10),
		_.random(mouseY - particleZone+10, mouseY + particleZone-10))
	);
}


loop();