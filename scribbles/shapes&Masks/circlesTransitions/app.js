import { autoDetectRenderer, Graphics, Container, Texture, Sprite } from 'pixi.js';
import { linearGradient, hexToRgb, rgbToHex, componentToHex  } from 'utils';
import { cpus } from 'os';
import { TimelineMax, TweenMax } from 'gsap';

/**
 * * *******************
 * * CORE
 * ! DO NOT UPDATE
 * * *******************
 */
let WINDOW_WIDTH = window.innerWidth;
let WINDOW_HEIGHT = window.innerHeight;
let MAIN_SIZE = WINDOW_WIDTH > WINDOW_HEIGHT ? WINDOW_WIDTH : WINDOW_HEIGHT;
class Renderer {
  constructor(width, height) {
    this.renderableCount = 0;
    this.renderables = [];
    this.renderer = autoDetectRenderer(width, height, {
      antialias: true, transparent: true, resolution: 1,
    });
    this.dom = this.renderer.view;
    this.scene = new Container();
    this.animate = this.animate.bind(this);
    this.resizeHandler = this.resizeHandler.bind(this);
  }
  add(renderable) {
    this.scene.addChild(renderable);
    if (renderable.update === undefined) return;
    this.renderables.push(renderable);
    this.renderableCount++;
  }
  remove(renderable) {
    const childIndex = this.scene.getChildIndex(renderable.idx);
    if (childIndex > 0) {
      this.scene.removeChild(renderable);
      const idx = this.renderables.indexOf(renderable);
      if (idx < 0) {
        this.renderableCount--;
        this.renderables.slice(idx, 1);
      }
    }
  }
  animate() {
    let i = this.renderableCount;
    while (--i >= 0) {
      this.renderables[i].update();
    }
    this.renderer.render(this.scene);
  }
  resizeHandler(w, h) {
    this.renderer.resize(w, h);
    let i = this.renderableCount;
    while (--i >= 0) {
      if (this.renderables[i].resize) this.renderables[i].resize();
    }
  }
}
const renderer = new Renderer(WINDOW_WIDTH, WINDOW_HEIGHT);
document.body.appendChild(renderer.dom);

/**
 * * *******************
 * * PROTOTYPING ZONE
 * * *******************
 */

const CIRCLE_MARGIN = 60;
const ANIMATION_STAGGER = 0.04;

const POSITION_VELOCITY = 0.1;
const PARALLAX_DISTANCE = 0.15;

const GRADIENTS = [
  Texture.fromCanvas(linearGradient('#5b5b5d', '#000000')),
  Texture.fromCanvas(linearGradient('#f3e181', '#F46B41')),
  Texture.fromCanvas(linearGradient('#4cebfd', '#5e86e6')),
  Texture.fromCanvas(linearGradient('#F572B5', '#F5798C')),
  Texture.fromCanvas(linearGradient('#ffffff', '#EEE0E0')),
];


class CircleMask extends Container {
  constructor(size) {
    super();

    // Props
    this.parallaxForce = (MAIN_SIZE - size) * PARALLAX_DISTANCE;
    this._size = size;

    // Position item
    this.x = this.targetedX = WINDOW_WIDTH * 0.5;
    this.y = this.targetedY = WINDOW_HEIGHT * 0.5;

    // Create the circle mask
    this.circleMask = new Graphics();
    this.drawMask();
    this.addChild(this.circleMask);

    // Create the backgrounds
    for(let i = GRADIENTS.length - 1; i >= 0; i--) {
      const background = this.createBackground(GRADIENTS[i]);
      background.mask = this.circleMask;
      background.visible = false;
      this.addChild(background);
    }

    // Save the number of children
    this.childrenIdxMax = this.children.length - 1;
    // Show the first background
    this.children[this.childrenIdxMax].visible = true;

    this.drawMask = this.drawMask.bind(this);
  }

  createBackground(image) {
    const background = new Sprite(image);
    return this.resizeBackground(background);
  }

  resizeBackground(background) {
    background.width = MAIN_SIZE * 1.25;
    background.height = MAIN_SIZE * 1.25;
    background.x = -background.width * 0.5;
    background.y = -background.height * 0.5;
    return background;
  }

  drawMask() {
    this.circleMask.clear();
    this.circleMask.beginFill('0xff0000', 1);
    this.circleMask.drawCircle(0, 0, this._size);
    this.circleMask.endFill();
  }

  resize() {
    this.x = this.targetedX = WINDOW_WIDTH * 0.5;
    this.y = this.targetedY = WINDOW_HEIGHT * 0.5;

    // this.drawMask();

    for(let i = 1; i <= this.childrenIdxMax; i++) {
      this.resizeBackground(this.children[i]);
    }
  }

  animateTransition() {
    // Get the background to animate
    const oldBackground = this.children[this.childrenIdxMax]; // The background on the top
    const newBackground = this.children[this.childrenIdxMax - 1]; // The second background

    // Prepare the new background
    newBackground.visible = true;
    newBackground.alpha = 0;

    // Create the timeline
    const timeline = new TimelineMax({ onComplete : () => {
        // Place the hidden background to the last position of background
        const removedBackground = this.removeChildAt(this.childrenIdxMax);
        removedBackground.visible = false;
        this.addChildAt(removedBackground, 1);
    }});

    // Rotation
    timeline.fromTo(this, 1, { rotation : 0 }, { rotation : Math.PI * 2 });

    // Show the new current background
    timeline.to(newBackground, 1.5, { alpha : 1, onUpdate : () => {
      // Fade out the previous background in the same time
      oldBackground.alpha = 1 - newBackground.alpha;
    }}, 0);

    return timeline;
  }

  update () {
    this.x += (this.targetedX - this.x) * POSITION_VELOCITY;
    this.y += (this.targetedY - this.y) * POSITION_VELOCITY;
  }

  updateParallax(x, y) {
    this.targetedX = (WINDOW_WIDTH * 0.5) + (x * this.parallaxForce);
    this.targetedY = (WINDOW_HEIGHT * 0.5) + (y * this.parallaxForce);
  }
}

// START
// DEBUG  ------------------------------------------------------------------------------
// const circle = new CircleMask(200);
// renderer.add(circle);
// circle.animateTransition();


// Create circles
const circles = [];
let currentCircleSize = MAIN_SIZE * 0.75;
while(currentCircleSize > 0) {
  const circle = new CircleMask(currentCircleSize);
  circles.push(circle);
  renderer.add(circle);
  currentCircleSize -= CIRCLE_MARGIN;
}
circles.reverse();

// INTERACTIVITY
let isAnimated = false;
window.addEventListener('click', () => {
  if (!isAnimated) {
    isAnimated = true;
    // Create timeline
    const mainTimeline = new TimelineMax({
      // repeat : -1,
      onComplete: () => {
        isAnimated = false;
      }
    });

    circles.forEach((circle, idx) => {
      mainTimeline.add(circle.animateTransition(), idx * ANIMATION_STAGGER);
    });
  }
});

window.addEventListener('mousemove', (e) => {
  const x = (e.clientX - (WINDOW_WIDTH * 0.5)) / WINDOW_WIDTH;
  const y = (e.clientY - (WINDOW_HEIGHT * 0.5)) / WINDOW_HEIGHT;

  for (let i = 0; i < circles.length; i++) {
    circles[i].updateParallax(x, y);
  }
});


/**
 * * *******************
 * * LOOP
 * ! DO NOT UPDATE
 * * *******************
 */
function onResize() {
  WINDOW_WIDTH = window.innerWidth;
  WINDOW_HEIGHT = window.innerHeight;
  MAIN_SIZE = WINDOW_WIDTH > WINDOW_HEIGHT ? WINDOW_WIDTH : WINDOW_HEIGHT;
  renderer.resizeHandler(WINDOW_WIDTH, WINDOW_HEIGHT);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
/* ---- LOOP ---- */
function _loop() {
	renderer.animate();
	requestAnimationFrame(_loop);
}
_loop();

