"use strict";

var w = Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)) / 3;
var path = 'M0,100c10.7-25.8,3-32.8,45-45c19.8-43.2,34.8-40.3,55-55';
var circleEffectDuration = 1200;
var circleIndex = 0;
var textShowed = false;

var circles = document.getElementsByClassName("circle");
var text = document.getElementById("text");

var myTweenEffect = mojs.easing.path(path);
var vivus = new Vivus(text, {
  start: 'manual',
  type: 'delayed',
  duration: 80,
  animTimingFunction: Vivus.EASE,
  onReady: function onReady() {
    text.style.opacity = 1;
  }
}, function () {
  textShowed = !textShowed;
  if (textShowed) {
    vivus.play(-1);
  } else {
    circleIndex--;
    circlesEaseIn(circles[circleIndex]);
  }
});

function circlesEaseOut(c) {
  var m = new mojs.Tween({
    duration: circleEffectDuration,
    onUpdate: function onUpdate(progress) {
      var extremeInOutProgress = myTweenEffect(progress);
      c.style.transform = 'scale(' + extremeInOutProgress * w + ')';
    }
  });
  circleIndex++;
  if (circleIndex < circles.length) {
    setTimeout(function () {
      circlesEaseOut(circles[circleIndex]);
    }, 100);
  } else {
    setTimeout(function () {
      vivus.reset().play();
    }, circleEffectDuration / 2);
  }
  m.run();
}

function callCirclesEaseOut() {
  setTimeout(function () {
    circlesEaseOut(circles[circleIndex]);
  }, circleEffectDuration);
}

function circlesEaseIn(c) {
  var m = new mojs.Tween({
    duration: circleEffectDuration / 2,
    onUpdate: function onUpdate(progress) {
      var extremeInOutProgress = myTweenEffect(progress);
      c.style.transform = 'scale(' + (w - extremeInOutProgress * w) + ')';
      // Init scale for each end of path
      if (progress >= 1) {
        c.style.transform = 'scale(0)';
      }
    }
  });
  circleIndex--;
  if (circleIndex >= 0) {
    setTimeout(function () {
      circlesEaseIn(circles[circleIndex]);
    }, 100);
  } else {
    circleIndex++;
    callCirclesEaseOut();
  }
  m.run();
}

// START
callCirclesEaseOut();