import { autoDetectRenderer, Graphics, Container, Sprite, Texture, BLEND_MODES } from 'pixi.js';
import RGBSplitFilter from '../../../modules/RGBSplitFilter.pixi';
import { linearGradient } from '../../../modules/utils';

PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH

const textureUrl = './assets/texture.jpg';

/**
 * * *******************
 * * DATA
 * * *******************
 */

const GRAPHICS_COLOR_PROPS = [
  { color: '0x657995', width: 0.1 },
  { color: '0x0e4c80', width: 0.1 },
  { color: '0x325fa4', width: 0.1 },
  { color: '0xee494d', width: 0.1 },
  { color: '0xe8621f', width: 0.1 },
  { color: '0x359c2e', width: 0.1 },
  { color: '0x76B041', width: 0.1 },
  { color: '0x639A88', width: 0.1 },
  { color: '0x3A5683', width: 0.1 },
  { color: '0x2708A0', width: 0.1 },
];

const GRAPHICS_BLACK_WHITE_PROPS = [
  { color: '0x394737', width: 0.4 },
  { color: '0x707772', width: 0.2 },
  { color: '0xD6DAD7', width: 0.2 },
  { color: '0xEEEEEA', width: 0.2 },
];

/**
 * * *******************
 * * CORE
 * * *******************
 */
let WINDOW_WIDTH  = window.innerWidth;
let WINDOW_HEIGHT = window.innerHeight;
let HALF_WIDTH    = WINDOW_WIDTH * 0.5;
let HALF_HEIGHT   = WINDOW_HEIGHT * 0.5;
class Renderer {
  constructor(width, height) {
    this.renderableCount = 0;
    this.renderables = [];
    this.renderer = autoDetectRenderer(width, height, {
      // antialias: true,
      transparent: true,
      resolution: Math.min(1.6, window.devicePixelRatio) || 1,
      autoResize: true,
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

// MASK OBJECT
class Mask extends Graphics {
  constructor() {
    super();

    this.isMask = true;

    this.targetedPosition = 1;
    this.currentPosition = 1;
    this.shift = 0.7;
    this.velocity = 0.1;

    // Bind
    this.draw = this.draw.bind(this);
  }

  updatePosition(mousePositionX) {
    this.targetedPosition = mousePositionX / WINDOW_WIDTH;
  }

  update() {
    this.currentPosition += (this.targetedPosition - this.currentPosition) * this.velocity;
    this.draw();
  }

  draw() {
    this.clear();

    this.beginFill('0xff0000');
    this.moveTo(WINDOW_WIDTH * this.currentPosition, 0);
    this.lineTo(WINDOW_WIDTH, 0);
    this.lineTo(WINDOW_WIDTH, WINDOW_HEIGHT);
    this.lineTo(WINDOW_WIDTH * this.currentPosition * this.shift, WINDOW_HEIGHT);
    this.endFill();
  }
}

// MAIN OBJECT
class MulticolorCircle extends Container {
  constructor(mask, size = 300) {
    super();

    this.size = size;

    this.velocity = 0.1;
    this.parallaxVelocity = 0.01;

    this.targetedPosition = { x: HALF_WIDTH, y: HALF_HEIGHT };
    this.x = this.targetedPosition.x;
    this.y = this.targetedPosition.y;

    // Create the black and white container
    this.blackWhiteContaiter = this.createLayerContainer(GRAPHICS_BLACK_WHITE_PROPS);
    this.addChild(this.blackWhiteContaiter);

    // Create the colorfull container
    this.colorContainer = this.createLayerContainer(GRAPHICS_COLOR_PROPS);
    this.colorContainer.mask = mask;
    this.addChild(this.colorContainer);

    // Create the sphere mask
    this.sphereMask = new Graphics();
    this.sphereMask.beginFill('0xff0000');
    this.sphereMask.drawCircle(0, 0, size * 0.5);
    this.sphereMask.endFill();
    this.addChild(this.sphereMask);
    this.mask = this.sphereMask;

    // Filters
    this.rgbSplitFilter = new RGBSplitFilter(
      [-2, 0],
      [0, 2],
      [0, 0],
    );
    this.rgbSplitFilter.padding = 20;
    this.blackWhiteContaiter.filters = [this.rgbSplitFilter];
    this.colorContainer.filters = [this.rgbSplitFilter];
  }

  createLayerContainer(props) {
    const container = new Container();
    const paddedSize = this.size + 20;

    let currentPositionX = 0;
    for (let i = 0; i < props.length; i++) {
      const { color, width } = props[i];
      const g = new Graphics();
      const w = width * paddedSize;
      g.beginFill(color, 1);
      g.drawRect(currentPositionX, 0, w, paddedSize);
      currentPositionX += w;
      g.endFill();

      container.addChild(g);
      container.x = -currentPositionX * 0.5;
      container.y = -paddedSize * 0.5;
    }
    return container;
  }

  updatePosition(mousePosition) {
    this.targetedPosition.x = HALF_WIDTH + ((mousePosition.x - HALF_WIDTH) * this.parallaxVelocity);
    this.targetedPosition.y = HALF_HEIGHT + ((mousePosition.y - HALF_HEIGHT) * this.parallaxVelocity);
  }

  update() {
    this.x += (this.targetedPosition.x - this.x) * this.velocity;
    this.y += (this.targetedPosition.y - this.y) * this.velocity;

    // Filter update
    const distortionForce = 3 + ((this.targetedPosition.x - this.x) * 1.5);
    this.rgbSplitFilter.red = [-distortionForce, 0];
    this.rgbSplitFilter.green = [0, distortionForce];
  }

  resize() {
    this.x = WINDOW_WIDTH * 0.5;
    this.y = WINDOW_HEIGHT * 0.5;
  }
}


// START

// Gradient background
const backgroundGradient = new Sprite(Texture.fromCanvas(linearGradient('#333333', '#222222')));
backgroundGradient.width = WINDOW_WIDTH;
backgroundGradient.height = WINDOW_HEIGHT;
renderer.add(backgroundGradient);

// Mask
const mask = new Mask();
renderer.add(mask);

// multicoloredCircle
const multicoloredCircle = new MulticolorCircle(mask, 500);
renderer.add(multicoloredCircle);

// FullScreen Texture
const textureSprite = new Sprite(Texture.fromImage(textureUrl));
textureSprite.width = WINDOW_WIDTH;
textureSprite.height = WINDOW_HEIGHT;
textureSprite.blendMode = BLEND_MODES.MULTIPLY;
textureSprite.alpha = 0.9;
renderer.add(textureSprite);

// FXAA FILTER
// const fxaa = new PIXI.filters.FXAAFilter();
// renderer.scene.filters = [fxaa];

// Listeners
window.addEventListener('mousemove', (e) => {
  const x = e.offsetX;
  const y = e.offsetY;
  mask.updatePosition(x);
  multicoloredCircle.updatePosition({ x, y });
});

// On resize
function resize() {
  multicoloredCircle.resize();

  backgroundGradient.width = WINDOW_WIDTH;
  backgroundGradient.height = WINDOW_HEIGHT;

  textureSprite.width = WINDOW_WIDTH;
  textureSprite.height = WINDOW_HEIGHT;
}

/**
 * * *******************
 * * LOOP
 * * *******************
 */
function onResize() {
  WINDOW_WIDTH  = window.innerWidth;
  WINDOW_HEIGHT = window.innerHeight;
  HALF_WIDTH    = WINDOW_WIDTH * 0.5;
  HALF_HEIGHT   = WINDOW_HEIGHT * 0.5;
  renderer.resizeHandler(WINDOW_WIDTH, WINDOW_HEIGHT);
  resize();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
/* ---- LOOP ---- */
function _loop() {
	renderer.animate();
	requestAnimationFrame(_loop);
}
_loop();

