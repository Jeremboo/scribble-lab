import { autoDetectRenderer, Graphics, Container } from 'pixi.js';
import { getDistBetweenTwoVec2 } from 'utils';
import Rope from 'Rope';
import Marker from 'Marker';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#0D0106';
/**/ const secondaryColor = '0xFCFAF9';
/**/ const bgColor = '0x2C2B3C';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Renderer {
/**/   constructor(width, height) {
/**/     this.renderableCount = 0;
/**/     this.renderables = [];
/**/     this.renderer = autoDetectRenderer(width, height, {
/**/       antialias: true, resolution: 1,
/**/     });
/**/     this.renderer.backgroundColor = bgColor;
/**/     this.dom = this.renderer.view;
/**/     this.scene = new Container();
/**/     this.animate = this.animate.bind(this);
/**/     this.resizeHandler = this.resizeHandler.bind(this);
/**/   }
/**/   add(renderable) {
/**/     this.scene.addChild(renderable);
/**/     if (renderable.update) {
/**/       this.renderableCount++;
/**/       this.renderables.push(renderable);
/**/     }
/**/   }
/**/   remove(renderable) {
/**/     const idx = this.renderables.indexOf(renderable);
/**/     if (idx < 0) {
/**/       this.scene.removeChild(renderable);
/**/       this.renderables.slice(idx, 1);
/**/       this.renderableCount--;
/**/     }
/**/   }
/**/   animate() {
/**/     let i = this.renderableCount;
/**/     while (--i >= 0) {
/**/       this.renderables[i].update();
/**/     }
/**/     this.renderer.render(this.scene);
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
class RopeFabric {
  constructor() {
    this.isDragging = false;
    this.ropes = [];
    this.mouseStartMarker = new Marker();
    renderer.add(this.mouseStartMarker);
    this.mouseEndMarker = new Marker();
    renderer.add(this.mouseEndMarker);
    this.line = new Graphics();
    renderer.add(this.line);


    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  // EVENTS
  onMouseMove(e) {
    if (this.pointAttachedToMouse) {
      this.pointAttachedToMouse.x = e.x;
      this.pointAttachedToMouse.y = e.y;
    } else if (this.isDragging) {
      this.mouseEndMarker.move(e.x, e.y);
      this.line.clear();
      this.line.beginFill(secondaryColor, 0);
      this.line.lineStyle(2, secondaryColor);
      this.line.moveTo(
        this.mouseStartMarker.position.x,
        this.mouseStartMarker.position.y,
      );
      this.line.lineTo(e.x, e.y);
      this.line.endFill();
    }
  }

  onMouseUp(e) {
    if (this.isDragging) {
      this.isDragging = false;
      this.mouseStartMarker.hideMarker();
      this.mouseEndMarker.hideMarker();
      this.line.clear();

      this.createRope(
        { x: e.x, y: e.y },
        this.mouseStartMarker.position
      );
    }
  }

  onMouseDown(e) {
    if (this.pointAttachedToMouse) {
      this.pointAttachedToMouse = false;
    } else {
      this.isDragging = true;
      this.mouseStartMarker.showMarker(e.x, e.y);
      this.mouseEndMarker.showMarker(e.x, e.y);
    }
  }

  // ROPE
  createRope(p1, p2, props = {}) {
    const { dist } = getDistBetweenTwoVec2(p1.x, p1.y, p2.x, p2.y);
    if (dist > 30) {
      const rope = new Rope(p1, p2, props);
      this.ropes.push(rope);
      renderer.add(rope);

      this.attachPointToMouse(rope, 0, p1.x, p1.y);
    }
  }

  attachPointToMouse(rope, pointIdx, x, y) {
    this.pointAttachedToMouse = rope.attachPoint(pointIdx, x, y);
  }

  detachPointToMouse() {
    this.pointAttachedToMouse = false;
  }

  // UX
  addMarker(x, y) {
    const marker = new Marker(x, y);
    renderer.add(marker);
  }
}


// START
const ropeFabric = new RopeFabric();

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
