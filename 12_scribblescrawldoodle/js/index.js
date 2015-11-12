"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var nbrOfRays = 30;
var colors = ["#DD1C1A", "#FFF1D0", "#F0C808", "#086788", "#06AED5"];

/* ---- INIT ---- */

var canvas = document.createElement('canvas');
var context = canvas.getContext("2d");

canvas.id = "canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

/* ---- CLASS ---- */

var Ray = (function () {
  function Ray() {
    _classCallCheck(this, Ray);

    this.force = { x: 0, y: 0 };
    this.points = [];
    this.train = [];
    this.cursor = 1;

    this.speed = getRandom(1, 500);
    this.trainLength = getRandom(2, 20);
    this.lineWidth = getRandom(1, 20);
    this.nbrOfPoints = getRandom(2, 10);
    this.color = colors[getRandom(0, colors.length)];

    this.setRandomPoints();
    this.x = this.points[0].x;
    this.y = this.points[0].y;
    this.goToNextPoint();
  }

  /* ---- Functions ----*/

  Ray.prototype.render = function render() {
    // -- draw ray
    context.beginPath();
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.color;
    var i = this.train.length - 1;
    for (i; i >= 0; i--) {
      context.lineTo(this.train[i].x, this.train[i].y);
    }
    context.stroke();
  };

  Ray.prototype.update = function update() {
    this.x += this.force.x;
    this.y += this.force.y;

    // timer destination
    this.timer--;
    if (this.timer < 0) {
      this.goToNextPoint();
    }
    //train
    this.train.push({
      x: this.x,
      y: this.y
    });
    if (this.train.length > this.trainLength) {
      this.train.splice(0, 1);
    }
  };

  Ray.prototype.goToNextPoint = function goToNextPoint() {
    var dest = {
      x: this.points[this.cursor].x,
      y: this.points[this.cursor].y
    };
    var dist = getDist(this.x, this.y, dest.x, dest.y);

    this.timer = dist / this.speed;
    this.force = {
      x: (dest.x - this.x) / this.timer,
      y: (dest.y - this.y) / this.timer
    };

    // update cursor
    this.cursor++;
    if (this.cursor == this.points.length) {
      this.cursor = 0;
    }
  };

  Ray.prototype.setRandomPoints = function setRandomPoints() {
    for (var i = 0; i < this.nbrOfPoints; i++) {
      this.points.push({
        x: getRandom(0, canvas.width),
        y: getRandom(0, canvas.height)
      });
    }
  };

  return Ray;
})();

Math.sqr = function (a) {
  return a * a;
};

function loop() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < rays.length; i++) {
    rays[i].update();
    rays[i].render();
  }
  requestAnimationFrame(loop);
}

function getDist(x1, y1, x2, y2) {
  return Math.sqrt(Math.sqr(y2 - y1) + Math.sqr(x2 - x1));
}

function getRandom(a, b) {
  return Math.floor(Math.random() * b) + a;
}

/* ---- START ---- */

var rays = [];
for (var i = 0; i < nbrOfRays; i++) {
  rays.push(new Ray());
}
loop();