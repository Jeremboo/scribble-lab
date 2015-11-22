/* ---- SETTINGS ---- */

var groundSize = 200,
    nbrOfFlower = 40,
    vel = 10,
    colors = ["#e9c46a","#f4a261","#e76f51"]
;

    windowWidth = window.innerWidth,
    windowHeight = window.innerHeight,

    mouseX = windowWidth/2,
    mouseY = windowHeight/2,

    canvas = document.createElement('canvas'),
    context = canvas.getContext("2d"),

    dragMode = false,
    ground = null
    flowers = [];

/* ---- Ground ---- */
function Ground () {
  this.x = windowWidth/2;
  this.y = windowHeight/2;
  this.size = groundSize/2
  this.color = "#2A9D8F";
}
Ground.prototype.render = function() {
  context.beginPath();
  context.strokeStyle = this.color;
  context.lineWidth = 2;
  context.arc(this.x,this.y, this.size/2, 0, Math.PI*2);
  context.stroke();
};
Ground.prototype.update = function(x, y){
  this.x = x;
  this.y = y
}
Ground.prototype.isInside = function(x, y){
  var inside = false;
  if(Math.abs(this.x - x) < this.size && Math.abs(this.y - y) < this.size){
    inside = true;
  }
  return inside;
}

/* ---- Flower ---- */
function Flower () {
  this.color = "#2A9D8F";
  this.flowerColor = colors[Math.randomFromInterval(0,colors.length)]
  this.ground = {
    x : windowWidth/2,
    y : windowHeight/2,
    r : groundSize/4
  }
  this.ampl = Math.randomFromInterval(3,8);
  this.nbrOfStemPoint = Math.randomFromInterval(4,8);
  this.angle = Math.radians(Math.randomFromInterval(0,360));
  this.points = [];
  this.stem = [];
  for (var i = 0; i < this.nbrOfStemPoint ; i++) {
    this.points.push({
        x : this.ground.x + this.ground.r*Math.cos(this.angle),
        y : this.ground.y + this.ground.r*Math.sin(this.angle)
    });
    this.stem.push({
        x : this.ground.x + this.ground.r*Math.cos(this.angle),
        y : this.ground.y + this.ground.r*Math.sin(this.angle)
    });
  }
}
Flower.prototype.render = function() {
  context.beginPath();
  context.strokeStyle = this.color;
  context.lineWidth = 2;
  context.moveTo(this.points[0],this.points[0]);
  for (var i = 0; i < this.nbrOfStemPoint ; i++) {
    // --
    var destX = this.ground.x + (this.ground.r+(this.ampl*i))*Math.cos(this.angle);
    var destY = this.ground.y + (this.ground.r+(this.ampl*i))*Math.sin(this.angle);

    // --
    this.stem[i].x += ( destX - this.stem[i].x )*(1-(i/vel));
    this.stem[i].y += ( destY - this.stem[i].y )*(1-(i/vel));

    // -- Draw
    context.lineTo(this.stem[i].x, this.stem[i].y);

    // -- Save
    this.points[i].x = destX;
    this.points[i].y = destY;
  }
  context.stroke();
  context.beginPath();
  context.strokeStyle = this.flowerColor;
  context.fillStyle = "#264653";
  context.arc(this.stem[this.nbrOfStemPoint-1].x, this.stem[this.nbrOfStemPoint-1].y, 8, 0, Math.PI*2);
  context.stroke();
  context.fill();
};
Flower.prototype.update = function(x,y){
  this.ground.x = x;
  this.ground.y = y;
}

/* ---- Functions ----*/
function loop(){
	context.clearRect(0,0, windowWidth, windowHeight);
	ground.update(mouseX, mouseY);
  ground.render();
  _.chain(flowers).each(function(f, index){
    f.update(mouseX,mouseY);
    f.render();
	});
	requestAnimationFrame(loop);
}

function recordMousePosition (e) {
  if(dragMode){
    mouseX = e.x;
    mouseY = e.y;
  }
}
function enableDrag(e) {
  if(ground.isInside(e.x, e.y)){
    canvas.style.cursor = "pointer";
    dragMode = true;
  }
}
function disableDrag() {
  dragMode = false;
  canvas.style.cursor = "auto";
}

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
Math.randomFromInterval = function(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

/* ---- START ---- */

canvas.id = "canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);

canvas.addEventListener('mousemove', recordMousePosition);
canvas.addEventListener('mousedown', enableDrag);
canvas.addEventListener('mouseup', disableDrag);

ground = new Ground();
for (var i = 0; i < nbrOfFlower; i++) {
  flowers.push(new Flower());
}
loop();
