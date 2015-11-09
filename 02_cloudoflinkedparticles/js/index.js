/* ---- PARAMS ---- */

var numberParticlesStart = 20;
var distanceLinkMax = 250;
var linkMax = 4;
var particleSize = 6;
var particleZone = 30;
var particleSpeed = 0.05;
var velocity = 0.99;

var showZone = false;



/* ---- INIT ---- */

var particles = [];

var canvas = document.createElement('canvas');
var context = canvas.getContext("2d"); 

canvas.id="canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.body.appendChild(canvas);



/* ---- CLASS ---- */

function Particle (x, y) {
    this.centerX = x;
    this.centerY = y;
  
  //Positionner autour du point de gravité
    this.x = _.random(x - particleZone, x + particleZone);
    this.y = _.random(y - particleZone, y + particleZone);
  
    this.velX = _.random(-2, 2);
    this.velY = _.random(-2, 2);
  
    this.nbrOfLinks = 0;
  
    this.particles; //recevra le tableau de particules
}


Particle.prototype.render = function() {
  
    context.beginPath();
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#021014";
    context.lineWidth = 0.5;
    context.arc(this.x,this.y,particleSize*2,0,Math.PI*2);
    //context.fill();
    context.stroke();
  
};


Particle.prototype.renderZone = function(){
  
    context.beginPath();
    context.fillStyle = "#ff0000";
    context.arc(this.centerX,this.centerY,particleSize/5,0,Math.PI*2);
    context.fill();
    context.beginPath();
    context.strokeStyle = "#ff0000";
    context.arc(this.centerX,this.centerY,particleZone,0,Math.PI*2);
    context.stroke();
}


Particle.prototype.update = function(){
  
    var posRelativeToCenter = {
        x : this.x - this.centerX,
        y : this.y - this.centerY
    };

    var distance = Math.sqrt( Math.pow(posRelativeToCenter.x,2) + Math.pow(posRelativeToCenter.y,2) );

    if(distance > particleZone){

        var force = (particleZone - distance) / particleZone;

        var forceDirection = {
            x :  (posRelativeToCenter.x / distance) * force,
            y :  (posRelativeToCenter.y / distance) * force
        };

        this.velX += forceDirection.x;
        this.velY += forceDirection.y;
    }

    this.x += this.velX*particleSpeed;
    this.y += this.velY*particleSpeed;

    this.nbrOfLinks = 0;
}


Particle.prototype.renderLinks = function(particles) {
  
    var that = this;

    _.each(particles, function(p){
    
        var distance = Math.sqrt( Math.pow(that.x - p.x, 2) + Math.pow(that.y - p.y, 2));

        if(distance < distanceLinkMax && that.nbrOfLinks < linkMax && p.nbrOfLinks < linkMax){ 
           
            context.beginPath();
            context.moveTo(p.x, p.y);
            context.lineTo(that.x, that.y);
            context.strokeStyle = "rgba(115,115,110,0.2)";
            context.stroke();
          
            that.nbrOfLinks++;
            p.addLink();
          
        } else if(that.nbrOfLinks >  linkMax) {
            return; 
        }
    });
}


Particle.prototype.addLink = function(){
  this.nbrOfLinks++;
}
   
 

/* ---- Functions ----*/
    
function loop(){

    context.clearRect(0,0, canvas.width, canvas.height);
  
    _.chain(particles).each(function(p, index){
        p.update();
    });
    _.chain(particles).each(function(p, index){
        p.renderLinks(_.without(particles, p) );
        
    });
    _.chain(particles).each(function(p, index){
        p.render();
        if(showZone){
            p.renderZone();
        }
    });
    requestAnimationFrame(loop);
}



/* ---- START ---- */

for (var i = 0; i < numberParticlesStart ; i++) {
    particles.push(new Particle(
        _.random(particleSize + particleZone, canvas.width - particleSize - particleZone),
        _.random(particleSize + particleZone, canvas.height - particleSize - particleZone))
    );
}

loop();