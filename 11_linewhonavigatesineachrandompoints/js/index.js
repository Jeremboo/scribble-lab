/* ---- INIT ---- */

"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var canvas = document.createElement('canvas');
var context = canvas.getContext("2d");

canvas.id = "canvas";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

/* ---- CLASS ---- */

var Ray = (function () {
  function Ray(points) {
    _classCallCheck(this, Ray);

    this.points = points;
    this.x = points[0].x;
    this.y = points[0].y;

    this.force = { x: 0, y: 0 };

    this.cursor = 1;
    this.goToNextPoint();

    this.speed;
    this.train = [];
  }

  /* ---- Functions ----*/

  Ray.prototype.render = function render() {
    // -- draw points
    var i = this.points.length - 1;
    for (i; i >= 0; i--) {
      context.beginPath();
      context.strokeStyle = "#FDFFFC";
      context.arc(this.points[i].x, this.points[i].y, 5, 0, Math.PI * 2);
      context.stroke();
    }
    // -- draw ray
    i = this.train.length - 1;
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "#01161E";
    for (i; i >= 0; i--) {
      context.lineTo(this.train[i].x, this.train[i].y);
    }
    context.stroke();
  };

  Ray.prototype.update = function update(points) {
    this.points = points;
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
    if (this.train.length > 5) {
      this.train.splice(0, 1);
    }
  };

  Ray.prototype.goToNextPoint = function goToNextPoint() {
    var dest = {
      x: this.points[this.cursor].x,
      y: this.points[this.cursor].y
    };
    var dist = getDist(this.x, this.y, dest.x, dest.y);

    this.timer = dist / props.speed;
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

  return Ray;
})();

Math.sqr = function (a) {
  return a * a;
};

function loop() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  ray.update(points);
  ray.render();
  requestAnimationFrame(loop);
}

function getDist(x1, y1, x2, y2) {
  return Math.sqrt(Math.sqr(y2 - y1) + Math.sqr(x2 - x1));
}

function getRandom(a, b) {
  return Math.floor(Math.random() * b) + a;
}

/* ---- START ---- */

var Props = function Props() {
  this.speed = 65;
  this.nbrOfPoints = 15;
};
var props = new Props();
var points = [];
for (var i = 0; i < props.nbrOfPoints / 3; i++) {
  points.push({
    x: getRandom(0, canvas.width),
    y: getRandom(0, canvas.height)
  });
}

var gui = new dat.GUI();
gui.add(props, 'speed', 1, 500);

canvas.addEventListener('click', function (e) {
  points.push({ x: e.x, y: e.y });
  if (points.length > props.nbrOfPoints) {
    points.splice(0, 1);
  }
});

var ray = new Ray(points);

loop();