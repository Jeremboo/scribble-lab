import { autoDetectRenderer, Graphics, Container } from 'pixi.js';

/**
 * * *******************
 * * CORE
 * ! DO NOT UPDATE
 * * *******************
 */
const mainColor = '#070707';
const secondaryColor = '0xC9F0FF';
const bgColor = false; // '0xffffff';
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Renderer {
  constructor(width, height) {
    this.renderableCount = 0;
    this.renderables = [];
    this.renderer = autoDetectRenderer(width, height, {
      antialias: true,
      transparent: true,
      resolution: Math.min(1.6, window.devicePixelRatio) || 1,
      autoResize: true,
    });
    if (bgColor) this.renderer.backgroundColor = bgColor;
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
  resizeHandler = (w, h) => {
    this.app.resize(w, h);
    let i = this.renderableCount - 1;
    while (i >= 0) {
      if (this.renderables[i].resize) this.renderables[i].resize(this.width, this.height);
      i -= 1;
    }
  }
  get width() {
    return this.app.screen.width;
  }
  get height() {
    return this.app.screen.height;
  }
}
const renderer = new Renderer(windowWidth, windowHeight);
document.body.appendChild(renderer.dom);

/**
 * * *******************
 * * PROTOTYPING ZONE
 * * *******************
 */


// OBJECTS
class Example extends Graphics {
  constructor() {
    super();

    this.x = windowWidth * 0.5;
    this.y = windowHeight * 0.5;
    this.beginFill(secondaryColor, 1);
    this.drawRect(-50, -50, 100, 100);
    this.endFill();
  }

  update() {
    this.rotation += 0.03;
  }

  resize() {
    this.x = windowWidth * 0.5;
    this.y = windowHeight * 0.5;
  }
}

// START
const ex = new Example();

// ADDS
renderer.add(ex);


/**
 * * *******************
 * * LOOP
 * ! DO NOT UPDATE
 * * *******************
 */
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  renderer.resizeHandler(windowWidth, windowHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
/* ---- LOOP ---- */
function _loop() {
	renderer.animate();
	requestAnimationFrame(_loop);
}
_loop();

