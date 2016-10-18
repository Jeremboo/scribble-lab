/* ---- SETTINGS ---- */

var trainLength = 30;
var vitRotation = 0.05;
var amplitude = 100;

/* ---- INIT ---- */

var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

var canvas = document.createElement('canvas');
var context = canvas.getContext("2d"); 

canvas.id = "canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);


/* ---- Particle ---- */
var Particle = Class.create();
Particle.prototype = {
  initialize: function(x, y) {
    this.centerX = x;
    this.centerY = y;
    this.x = x;
    this.y = y;
    this.timer = 0;
    
    this.color = "#ffffff";
    
    this.vel = {
      x : _.random(-20, 20)/100,
      y : _.random(-20, 20)/100,
      min : _.random(2, 10),
      max : _.random(10, 100)/10
    }
  },
  render: function() {
    context.beginPath();
    context.fillStyle = this.color;
    context.strokeStyle = this.color;
    context.lineWidth = 2;
    context.arc(this.x,this.y, trainLength/2, 0, Math.PI*2);   
    context.fill();
  },
  update: function(){
    this.timer += vitRotation;    
    this.x = (amplitude + (Math.cos(this.timer*8)*10)) * Math.cos( this.timer ) + this.centerX;
		this.y = (amplitude + (Math.sin(this.timer*8)*10)) * Math.sin( this.timer ) + this.centerY;
  }
};

var ParticleExtendsOldPosTrail = Class.create(Particle, {
  initialize: function($super, x, y){
    $super(x, y);
    this.color = "#218380";
    this.train = [];
  },
  update: function($super) {
    $super();
    this.train.push({
      x : this.x,
      y : this.y
    });
    if(this.train.length > trainLength){
      this.train.splice(0,1);
    }
  },
  render: function($super) {
    $super();
    context.beginPath();
    var i = this.train.length-1;
    for (i ; i > 0 ; i--) {
      context.lineWidth = i;
      context.lineTo(this.train[i].x,this.train[i].y);
      context.stroke();
    }
  }
});

var ParticleExtendsEasingTrail = Class.create(Particle, {
  initialize: function($super, x, y){
    $super(x, y);
    this.color = "#9FD356";
    this.train = [];
    for (var i = 0; i < trainLength; i++) {
      this.train.push({
        x : x,
        y : y
      });
    } 
  },
  update: function($super) {
    $super();
    var i = 1;
    this.train[0].x = this.x;
    this.train[0].y = this.y;
    for ( i ; i < trainLength ; i++) {
      this.train[i].x += ( this.train[i-1].x - this.train[i].x )*0.5;
      this.train[i].y += ( this.train[i-1].y - this.train[i].y )*0.5;
    }
  },
  render: function($super) {
    $super();
    context.beginPath();
    var i = trainLength-1;
    for ( i ; i > 0 ; i--) {
      context.lineWidth= i;
      context.lineTo(this.train[trainLength-i].x,this.train[trainLength-i].y);
      context.stroke();
    }   
  }
});

/* ---- START ---- */

var oldPosTrail = new ParticleExtendsOldPosTrail(windowWidth/4,windowHeight/2);
var easingTrail = new ParticleExtendsEasingTrail(windowWidth/1.4,windowHeight/2);

/* ---- Functions ----*/
function loop(){
	context.clearRect(0,0, canvas.width, canvas.height);
  oldPosTrail.update();
  oldPosTrail.render();
  easingTrail.update();
  easingTrail.render();
	requestAnimationFrame(loop);
}
loop();