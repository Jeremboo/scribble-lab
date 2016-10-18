/* ---- PARAMS ---- */



/* ---- INIT ---- */

var canvas = document.createElement('canvas');
var context = canvas.getContext("2d"); 

canvas.id="canvas";
canvas.width = 1000;
canvas.height = 1000;

document.body.appendChild(canvas);

/* ---- CLASS ---- */

var Plane = function(position, depth, color) {
  this.color = color;
  this.pos = position
  this.time = Math.random()*100;
  this.vit = depth/100;
  this.ampl = depth*10;
  this.margin = 200;
    
  this.begingP = { x : 0, y : this.pos };
  this.endP = { x : canvas.width+this.margin, y : this.pos };
  this.begingBezierCurve = { x : canvas.width/4+this.margin, y : this.pos };
  this.endingBezierCurve = { x : canvas.width-(canvas.width/4)-this.margin, y : this.pos };
}

Plane.prototype.update = function(){
  var curve = Math.cos(this.time)*this.ampl;
  this.time += this.vit;
  this.begingBezierCurve.y = this.pos - curve;
  this.endingBezierCurve.y = this.pos + curve;
}

Plane.prototype.render = function(){
  context.beginPath();
  //this.createHotPoint(this.begingBezierCurve.x, this.begingBezierCurve.y);
  //this.createHotPoint(this.endingBezierCurve.x, this.endingBezierCurve.y); 
  context.moveTo(-100,this.pos);
  context.bezierCurveTo(this.begingBezierCurve.x,
                        this.begingBezierCurve.y,
                        this.endingBezierCurve.x,
                        this.endingBezierCurve.y,
                        this.endP.x, this.endP.y);
  context.lineTo(canvas.width,canvas.height);
  context.lineTo(-100,canvas.height);
  context.fillStyle = this.color;
  context.fill();
}
Plane.prototype.createHotPoint = function(x,y){
  context.moveTo(x,y);
  context.rect(x,y,5,5);
}

var Star = function(x,y,size) {
  this.size = size;
  this.lighting = this.size;
  this.pos = {
    x : x,
    y : y
  }
}
Star.prototype.update = function(){
  this.lighting = Math.random()*5*this.size;
  this.pos.x -= this.size/2;
  if(this.pos.x < -10){
    this.initStar();
  }
}
Star.prototype.render = function(){
  context.beginPath();
  context.fillStyle = "#FCFDFF";
  context.arc(this.pos.x,this.pos.y,this.lighting,0,Math.PI*2);
  context.fill();
  context.strokeStyle = "#FCFDFF";
  context.arc(this.pos.x,this.pos.y,this.lighting*2,0,Math.PI*2);
  context.stroke();
}
Star.prototype.initStar = function() {
  this.pos = {
    x : canvas.width+100,
    y : Math.random()*canvas.height/2+100
  }
}

var Moon = function() {
  this.time = 0;
  this.pos = {
    x : canvas.width/2,
    y : canvas.height/2+20
  }
}
Moon.prototype.update = function(){
  var curve = Math.cos(this.time)*0.5;
  this.time += 0.05;
  this.pos.y = this.pos.y - curve;
}
Moon.prototype.render = function(){
  context.beginPath();
  context.fillStyle = 'rgba(242, 242, 242, 0.5)';
  context.arc(this.pos.x,this.pos.y,150,0,Math.PI*2);
  context.fill();
  context.beginPath();
  context.fillStyle = 'rgba(249, 249, 249, 1.000)';
  context.arc(this.pos.x,this.pos.y,140,0,Math.PI*2);
  context.fill();
} 

/* ---- Functions ---- */

var plane1 = new Plane(canvas.height/2+(canvas.height/5), 5, "#0F8E85");
var plane2 = new Plane((canvas.height/2)+(canvas.height/3), 7, "#1B4656");
var moon = new Moon();
var stars = [];

for (var i = 0; i < 40 ; i++) {
    stars.push(new Star(Math.random()*canvas.width+100,Math.random()*(canvas.height/2+(canvas.height/5)),Math.random()*1.5));
}
var colorMoon = "#FCFDFF";
   
function loop(){
    context.clearRect(0,0, canvas.width, canvas.height);
  
    for (var i = 0; i < stars.length ; i++) {
      stars[i].update();
      stars[i].render();
    }
    moon.render();
    moon.update();
    plane1.update();
    plane1.render();
    plane2.update();
    plane2.render();

    requestAnimationFrame(loop);
}
loop();