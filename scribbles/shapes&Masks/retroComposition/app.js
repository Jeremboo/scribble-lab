import { autoDetectRenderer, Graphics, Container, Sprite, Texture, Quad } from 'pixi.js';
import { TimelineMax, Power3 } from 'gsap';
import { linearGradient, getRandomFloat, shadeColor } from 'utils';

import oldVideoMovieEffectUrl from 'oldVideoMovieEffect.mp4';


import MaskLayer from 'MaskLayer';

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
      antialias: true, transparent: true, resolution: 1,
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
  resizeHandler(w, h) {
    this.renderer.resize(w, h);
    let i = this.renderableCount;
    while (--i >= 0) {
      if (this.renderables[i].resize) this.renderables[i].resize();
    }
  }
}
const renderer = new Renderer(windowWidth, windowHeight);
document.body.appendChild(renderer.dom);

/**
 * * *******************
 * * PROTOTYPING ZONE
 * * *******************
 */

class ContentWithMask extends Container {
  constructor(object, width, height) {
    super();

    // Mask
    this._mask = new MaskLayer(width, height);
    this.addChild(this._mask);

    object.mask = this._mask;
    this.addChild(object);
  }

  animateIn(transition = 1, duration) {
    this.mask.reset();
    return this.mask.animateTo(transition, duration);
  }
}


// START
const createGradient = (color1, color2, width = windowWidth, height = windowHeight) => {
  const sprite = new Sprite(Texture.fromCanvas(linearGradient(color1, color2)));
  sprite.width = width;
  sprite.height = height;
  return sprite;
};

// Gradient background
const backgroundGradient = createGradient('#EEEEEE', '#FFFFFF');
renderer.add(backgroundGradient);


// LAYERS
const layers = [];
const LAYER_PROPS = [
  ['#D6DAD7', '#D6DAD7'],
  ['#707772', '#707772'],
  ['#394737', '#394737'],
  ['#333333', '#1a1a1a'],
];
LAYER_PROPS.forEach((props) => {
  const layer = createGradient(props[0], props[1]);
  const layerWithMask = new ContentWithMask(layer, windowWidth, windowHeight);
  renderer.add(layerWithMask);
  layers.push(layerWithMask);
});

// CIRCLE
const CIRCLE_SIZE = 500;
const circle = new Graphics();
circle.width = CIRCLE_SIZE;
circle.height = CIRCLE_SIZE;
circle.beginFill('0xee494d');
circle.drawCircle(CIRCLE_SIZE * 0.5, CIRCLE_SIZE * 0.5, CIRCLE_SIZE * 0.5);
circle.endFill();
const circleWithMask = new ContentWithMask(circle, CIRCLE_SIZE, CIRCLE_SIZE);
circleWithMask.x = 100;
circleWithMask.y = 50;
renderer.add(circleWithMask);


// VIDEO
const texture = Texture.fromVideoUrl(oldVideoMovieEffectUrl);
const movieSprite = new Sprite(texture);
movieSprite.blendMode = PIXI.BLEND_MODES.ADD;
renderer.add(movieSprite);

movieSprite.width = windowWidth;
movieSprite.height = windowHeight;
movieSprite.alpha = 0.1;
movieSprite.mask = layers[layers.length - 1].mask;

const video = texture.baseTexture.source;
video.loop = true;



// BLUE RECTANGLES
const rectangles = [];
for(let i = 0; i < 8; i++) {
  const graph = new Graphics();
  const size = getRandomFloat(80, 100) / (i * 0.8);
  graph.beginFill(`0x${shadeColor('#2d4a7d', i * -5)}`);
  const w = size;
  const h = size * 6;
  graph.width = w;
  graph.height = h;
  graph.drawRect(0, 0, w, h);
  graph.endFill();

  const graphWithMask = new ContentWithMask(graph, graph.width, graph.height);
  graphWithMask.x = 180 + (windowWidth * 0.12 * i) - (i * i * i)
  graphWithMask.y = ((windowHeight * 0.55) - size * 2) + (windowHeight * 0.03 * i);
  renderer.add(graphWithMask);
  rectangles.push(graphWithMask);
}



// ANIMATION
const STAGGER = 0.2;
const mainTimeline = new TimelineMax({
  delay  : 1,
});

// Layer animation
layers.forEach((layer, idx) => {
  mainTimeline.add(layer.animateIn(), idx * STAGGER);
});

// Circle animation
mainTimeline.add(circleWithMask.animateIn(1, 1.5), '-=2');

// RECTANGLES ANIMATIONS
const shapeTimeline = new TimelineMax({});
rectangles.forEach((shap) => {
  shapeTimeline.add(shap.animateIn(1, 0.8), '-=0.85');
});
mainTimeline.add(shapeTimeline, '-=1.5');





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

