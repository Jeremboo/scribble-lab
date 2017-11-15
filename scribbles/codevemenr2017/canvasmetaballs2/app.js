import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Raycaster ,
  Mesh, PlaneGeometry, Vector3, AmbientLight, DirectionalLight, MeshStandardMaterial,
} from 'three';

import { createCanvasTexture } from 'threejs-texture-tool';

import { drawGradientArc, radians, applyImageToCanvas, getNormalizedPosFromScreen, getRandomFloat } from 'utils';


Math.sqr = a => a * a;
const getVec2Length = (x, y) => Math.sqrt(Math.sqr(y) + Math.sqr(x));
const getDistBetweenTwoVec2 = (x1, y1, x2, y2) => getVec2Length(x2 - x1, y2 - y1);

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = '#ffffff';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     if (bgColor) this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 10);
/**/     this.dom = this.renderer.domElement;
/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
/**/     this.resize(w, h); // set render size
/**/   }
/**/   add(mesh) {
/**/     this.scene.add(mesh);
/**/     if (!mesh.update) return;
/**/     this.meshListeners.push(mesh.update);
/**/     this.meshCount++;
/**/   }
/**/   update() {
/**/     let i = this.meshCount;
/**/     while (--i >= 0) {
/**/       this.meshListeners[i].apply(this, null);
/**/     }
/**/     this.renderer.render(this.scene, this.camera);
/**/   }
/**/   resize(w, h) {
/**/     this.camera.aspect = w / h;
/**/     this.camera.updateProjectionMatrix();
/**/     this.renderer.setSize(w, h);
/**/   }
/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

const props = {
  // render
  THRESHOLD: 200,
  // forces
  MOUSE_VEL: 0.002,
  CENTER_VEL: 0.4,
  FORCE_VEL: 0.8,
  // circles
  MAIN_CIRCLE: {
    SCALE: 1,
    RATIO: 0.4,
  },
  LITTLE_CIRCLE: {
    SCALE: 0.3,
    RATIO: 0.2,
  },
};

// ###############
// METABALL CANVAS TEXTURE
// ###############
class MetaballCanvasTexture {
  constructor(size = 512) {
    this.size = size;
    this.threshold = props.THRESHOLD;

    // Vectors2
    this.center = {
      x: this.size * 0.5,
      y: this.size * 0.5,
    };
    this.mousePosition = Object.assign({}, this.center);
    this.littleBubble = Object.assign({}, this.center);
    this.littleBubbleForce = { x: 0, y: 0 };

    // Canvas texture data
    this.canvasTexture = createCanvasTexture({
      width: this.size,
      height: this.size,
      name: 'metaball',
    });
    this.context = this.canvasTexture.context;
  }

  update() {
    const vecForce = {
      x: this.mousePosition.x - this.littleBubble.x,
      y: this.mousePosition.y - this.littleBubble.y,
    };
    const force = Math.max(0, (this.size * 0.3) - getVec2Length(vecForce.x, vecForce.y));

    this.littleBubbleForce.x += vecForce.x * force * props.MOUSE_VEL;
    this.littleBubbleForce.y += vecForce.y * force * props.MOUSE_VEL;

    this.littleBubble.x += this.littleBubbleForce.x;
    this.littleBubble.y += this.littleBubbleForce.y;

    this.littleBubble.x += (this.center.x - this.littleBubble.x) * props.CENTER_VEL;
    this.littleBubble.y += (this.center.y - this.littleBubble.y) * props.CENTER_VEL;

    this.littleBubbleForce.x *= props.FORCE_VEL;
    this.littleBubbleForce.y *= props.FORCE_VEL;

    // RENDER
    this.context.clearRect(0, 0, this.size, this.size);
    this.context.globalCompositeOperation = 'source-over';

    // Gradient circles
    drawGradientArc(this.context, { x: this.center.x, y: this.center.y, size: this.size * props.MAIN_CIRCLE.SCALE, ratio: props.MAIN_CIRCLE.RATIO });
    drawGradientArc(this.context, { x: this.littleBubble.x, y: this.littleBubble.y, size: this.size * props.LITTLE_CIRCLE.SCALE, ratio: props.LITTLE_CIRCLE.RATIO });

    // Update the canvasTexture
    this.canvasTexture.update();
  }

  updateMousePosition(uv) {
    this.mousePosition.x = this.size * uv.x;
    this.mousePosition.y = this.size - (this.size * uv.y);
  }
}

class FullMetaballCanvasTexture extends MetaballCanvasTexture {
  constructor(size) {
    super(size);
    // Load background image
    // https://i.imgur.com/462xXUs.png
    // https://pixabay.com/get/eb3db40a2ef2073ed95c4518b74d4095e272e1dc04b014419cf9c97fafebb4_640.jpg
    this.backgroundImg = false;
    applyImageToCanvas('https://i.imgur.com/462xXUs.png', this.size, this.size).then((_canvas) => {
      this.backgroundImg = _canvas;
    });
  }

  update() {
    if (this.backgroundImg) {
      super.update();
      // threshold
      this.renderThershold();
      // Apply image
      this.context.globalCompositeOperation = 'source-in';
      this.context.drawImage(this.backgroundImg, 0, 0);
    }
  }
  renderThershold() {
    const imageData = this.context.getImageData(0, 0, this.size, this.size);
    const pix = imageData.data;

    for (let i = 3; i < pix.length; i += 4) {
      if (pix[i] < this.threshold) {
        pix[i] = 0;
      } else {
        pix[i] = Math.min(255, (pix[i] - this.threshold) * 20);
      }
    }
    this.context.putImageData(imageData, 0, 0);
  }
}

class Bubble extends Mesh {
  constructor() {
    const geom = new PlaneGeometry(5, 5, 32);
    const metaballCanvas = new FullMetaballCanvasTexture();
    super(geom, metaballCanvas.canvasTexture.material);
    this.material.transparent = true;

    this.update = this.update.bind(this);

    this.metaballCanvas = metaballCanvas;
  }

  update() {
    this.metaballCanvas.update();
  }
}

// START
const bubbles = [];
for (let i = 0; i < 3; i++) {
  const bubble = new Bubble();
  bubbles.push(bubble);
  bubble.position.set(
    getRandomFloat(-6, 6),
    getRandomFloat(-4, 4),
    getRandomFloat(-4, 4),
  );
  webgl.add(bubble);
}

const searchCollision = (mesh, intersects, callback) => {
  let i = 0;
  let targetedObjectIntersected = false;
  while (i < intersects.length && !targetedObjectIntersected) {
    if (intersects[i].object.uuid === mesh.uuid) {
      targetedObjectIntersected = true;
      callback(intersects[i]);
    }
    i += 1;
  }
}
const raycaster = new Raycaster();
const moveEvent = 'ontouchstart' in (window || navigator.msMaxTouchPoints) ? 'touchmove' : 'mousemove';
window.addEventListener(moveEvent, (e) => {
  const mouseVec = getNormalizedPosFromScreen(
    e.clientX || e.touches[0].clientX,
    e.clientY || e.touches[0].clientY,
  );
  raycaster.setFromCamera(mouseVec, webgl.camera);
  const intersects = raycaster.intersectObjects(webgl.scene.children);

  for (let i = 0; i < bubbles.length; i++) {
    const bubble = bubbles[i];
    searchCollision(bubble, intersects, (intersect) => {
      bubble.metaballCanvas.updateMousePosition(intersect.uv);
    }, () => {
      // TODO mouse out
      // bubble.metaballCanvas.updateMousePosition({ x: 0.5, y: 0.5 });
    });
  }
});

/* ---- CREATING ZONE END ---- */
class CameraMouseControl {
  constructor(camera) {
    this.camera = camera;
    this.lookAt = new Vector3();
    this.position = { x: 0, y: 0 };
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.update = this.update.bind(this);
    document.body.addEventListener('mousemove', this.handleMouseMove);
  }
  handleMouseMove(event) {
    this.position.x = ((event.clientX / window.innerWidth) - 0.5) * 3;
    this.position.y = -((event.clientY / window.innerHeight) - 0.5) * 3;
  }
  update() {
    this.camera.position.x += (this.position.x - this.camera.position.x) * 0.1;
    this.camera.position.y += (this.position.y - this.camera.position.y) * 0.1;
    this.camera.lookAt(this.lookAt);
  }
}
const cameraControl = new CameraMouseControl(webgl.camera);
/**/
/**/
/**/ /* ---- ON RESIZE ---- */
/**/ function onResize() {
/**/   windowWidth = window.innerWidth;
/**/   windowHeight = window.innerHeight;
/**/   webgl.resize(windowWidth, windowHeight);
/**/ }
/**/ window.addEventListener('resize', onResize);
/**/ window.addEventListener('orientationchange', onResize);
/**/ /* ---- LOOP ---- */
/**/ function _loop() {
/**/ 	webgl.update();
      cameraControl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
