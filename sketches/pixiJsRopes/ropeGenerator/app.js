import { autoDetectRenderer, Graphics, Container, interaction } from 'pixi.js';
import { getDistBetweenTwoVec2 } from 'utils';
import props, { NONE, DRAWING, MOVING } from 'props';
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


// TODO add comments
class RopeFabric {
  constructor() {
    this.ropes = [];
    this.ropeAttachedToMouse = false;
    this.pointAttachedToMouse = false;
    this.mouseStartMarker = new Marker();
    renderer.add(this.mouseStartMarker);
    this.mouseEndMarker = new Marker();
    renderer.add(this.mouseEndMarker);
    this.line = new Graphics();
    renderer.add(this.line);

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.drawConstructorLine = this.drawConstructorLine.bind(this);

    renderer.dom.addEventListener('mousemove', this.onMouseMove);
    renderer.dom.addEventListener('mousedown', this.onMouseDown);
    renderer.dom.addEventListener('mouseup', this.onMouseUp);
  }

  // EVENTS
  onMouseMove(e) {
    switch (props.mouseEvent) {
      case DRAWING:
        this.drawConstructorLine(
          this.mouseStartMarker.position.x,
          this.mouseStartMarker.position.y,
          e.x, e.y,
        );
        break;
      case MOVING:
        this.pointAttachedToMouse.x = e.x;
        this.pointAttachedToMouse.y = e.y;
        break;
      case NONE:
        break;
      default:
        console.log('ERROR:onMouseMove');
        break;
    }
  }

  onMouseUp(e) {
    switch (props.mouseEvent) {
      case DRAWING:
        props.mouseEvent = NONE;
        this.mouseStartMarker.hide();
        this.mouseEndMarker.hide();
        this.line.clear();

        this.createRope(
          { x: e.x, y: e.y },
          this.mouseStartMarker.position,
        );
        break;
      case MOVING:
        break;
      case NONE:
        break;
      default:
        console.log('ERROR:onMouseUp');
        break;
    }
  }

  onMouseDown(e) {
    switch (props.mouseEvent) {
      case DRAWING:
        break;
      case MOVING:
        this.detachPointToMouse();
        break;
      case NONE:
        props.mouseEvent = DRAWING;
        this.mouseStartMarker.show(e.x, e.y);
        this.mouseEndMarker.show(e.x, e.y);
        break;
      default:
        console.log('ERROR:onMouseDown');
        break;
    }
  }

  // GRAPHIC
  createRope(p1, p2, ropeProps = {}) {
    const { dist } = getDistBetweenTwoVec2(p1.x, p1.y, p2.x, p2.y);
    if (dist > 30) {
      const rope = new Rope(p1, p2, ropeProps);
      this.ropes.push(rope);
      renderer.add(rope);

      this.attachRopeToMouse(rope, 0, p1.x, p1.y);
    }
  }

  drawConstructorLine(x1, y1, x2, y2) {
    this.line.clear();
    this.line.beginFill(secondaryColor, 0);
    this.line.lineStyle(2, secondaryColor);
    this.line.moveTo(x1, y1);
    this.line.lineTo(x2, y2);
    this.line.endFill();
    this.mouseEndMarker.move(x2, y2);
  }

  addMarker(x, y) {
    const marker = new Marker(x, y);
    renderer.add(marker);
  }

  // CORE
  attachRopeToMouse(rope, pointIdx, x, y) {
    props.mouseEvent = MOVING;
    rope.removeListener();
    this.pointAttachedToMouse = rope.attachPoint(pointIdx, x, y);
    this.ropeAttachedToMouse = rope;
  }

  detachPointToMouse() {
    props.mouseEvent = NONE;
    this.ropeAttachedToMouse.addListener();
    this.ropeAttachedToMouse = false;
    this.pointAttachedToMouse = false;
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
