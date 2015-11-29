/* ---- SETTINGS ---- */

var numberParticlesStart = 500;
var particleSpeed = 0.4;
var velocity = 0.99;
var trainLenght = 10;
var colors = ["#00A878","#009DDC","#FE5E41","#FCBA04","#0496FF","#DB2B39","#011AA9"];

/* ---- INIT ---- */

var particles = [];
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

var canvas = document.createElement('canvas');
var context = canvas.getContext("2d"); 

canvas.id = "canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);


/* ---- Particle ---- */
function Particle (x, y) {
  
  this.x = x;
  this.y = y;
    
  this.vel = {
    x : _.random(-20, 20)/100,
    y : _.random(-20, 20)/100,
    min : _.random(2, 10),
    max : _.random(10, 100)/10
  }
  
  this.train = [];
  
  this.color = colors[_.random(0,colors.length)];
}
Particle.prototype.render = function() {
  context.beginPath();
  context.strokeStyle = this.color;
  context.lineWidth = 2;
  context.arc(this.x,this.y, 2, 0, Math.PI*2);
  var i = this.train.length-1;
  for (i ; i > 0 ; i--) {
    context.lineTo(this.train[i].x,this.train[i].y);
  }  
  context.stroke();
};
Particle.prototype.update = function(){
   
  var forceDirection = {
    x :  _.random(-1, 1),
    y :  _.random(-1, 1),
  };

  if( Math.abs(this.vel.x + forceDirection.x) < this.vel.max)
    this.vel.x += forceDirection.x;
  if( Math.abs(this.vel.y + forceDirection.y) < this.vel.max)
    this.vel.y += forceDirection.y;
  
  this.x += this.vel.x*particleSpeed;
  this.y += this.vel.y*particleSpeed;
  
  if(Math.abs(this.vel.x) > this.vel.min)
      this.vel.x *= velocity;
  if(Math.abs(this.vel.y) > this.vel.min)
      this.vel.y *= velocity;
  
  //train
  this.train.push({
    x : this.x,
    y : this.y
  });
  
  this.testBorder();
  
  if(this.train.length > trainLenght){
    this.train.splice(0,1);
  }
}
Particle.prototype.testBorder = function() {
  if( this.x > windowWidth + trainLenght ){
    this.setPosition(- trainLenght, "x");
  } else if( this.x < -trainLenght) {
    this.setPosition(windowWidth + trainLenght, "x");
  }
  if( this.y > windowHeight + trainLenght){
    this.setPosition(- trainLenght, "y");
  } else if( this.y < -trainLenght) {
    this.setPosition(windowHeight + trainLenght, "y");
  }
}
Particle.prototype.setPosition = function(pos, coor) {
  if(coor == "x") {
    this.x = pos;
    _.chain(this.train).each(function(train) {
      train.x = pos;
    });
  } else if( coor == "y" ) {    
    this.y = pos;
    _.chain(this.train).each(function(train) {
      train.y = pos;
    });
  }
}

/* ---- Functions ----*/
function loop(){
	context.clearRect(0,0, canvas.width, canvas.height);
	_.chain(particles).each(function(p, index){
    p.update();
    p.render();
	});
	requestAnimationFrame(loop);
}

/* ---- START ---- */
for (var i = 0; i < numberParticlesStart ; i++) {
	particles.push(new Particle(
		_.random(0, windowWidth),
		_.random(0, windowHeight)
	));
}

loop();