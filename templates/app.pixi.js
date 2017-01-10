import { autoDetectRenderer, Graphics } from 'pixi.js';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '0xC9F0FF';
/**/ const bgColor = false; // 'rgb(0, 0, 0)';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Renderer {
/**/   constructor(width, height) {
/**/     this.renderableCount = 0;
/**/     this.renderables = [];
/**/     this.renderer = autoDetectRenderer(width, height, {
/**/       antialias: true, transparent: true, resolution: 1,
/**/     });
/**/     // if (bgColor) this.renderer.setClearColor(new THREE.Color(bgColor));
/**/     this.dom = this.renderer.view;
/**/     this.animate = this.animate.bind(this);
/**/     this.resizeHandler = this.resizeHandler.bind(this);
/**/   }
/**/   add(renderable) {
/**/     this.renderableCount++;
/**/     return this.renderables.push(renderable);
/**/   }
/**/   remove(renderable) {
/**/     const idx = this.renderables.indexOf(renderable);
/**/     if (idx < 0) {
/**/       this.renderables.slice(idx, 1);
/**/       this.renderableCount--;
/**/     }
/**/   }
/**/   animate() {
/**/     let i = this.renderableCount;
/**/     while (--i >= 0) {
/**/       this.renderables[i].update();
/**/       this.renderer.render(this.renderables[i]);
/**/     }
/**/   }
/**/   resizeHandler(w, h) {
/**/     this.renderer.resize(w, h);
/**/     let i = this.renderableCount;
/**/     while (--i >= 0) {
/**/       if (this.renderables[i].resize) this.renderables[i].resize();
/**/     }
/**/   }
/**/ }
/**/ const renderer = new Renderer(windowWidth, windowHeight);
/**/ document.body.appendChild(renderer.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

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

/* ---- CREATING ZONE END ---- */
/**/
/**/
/**/ /* ---- ON RESIZE ---- */
/**/ function onResize() {
/**/   windowWidth = window.innerWidth;
/**/   windowHeight = window.innerHeight;
/**/   renderer.resizeHandler(windowWidth, windowHeight);
/**/ }
/**/ window.addEventListener('resize', onResize);
/**/ window.addEventListener('orientationchange', onResize);
/**/ /* ---- LOOP ---- */
/**/ function _loop() {
/**/ 	 renderer.animate();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
