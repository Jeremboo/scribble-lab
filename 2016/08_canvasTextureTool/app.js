import threeJs from 'three-js';

const THREE = threeJs();

import CanvasTextureTool from '../00_modules/canvasTextureTool';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = false // 'rgb(0, 0, 0)';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     if (bgColor) this.renderer.setClearColor(new THREE.Color(bgColor));
/**/     this.scene = new THREE.Scene();
/**/     this.camera = new THREE.PerspectiveCamera(50, w / h, 1, 1000);
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

// OBJECTS
class CanvasTest extends THREE.Object3D {
  constructor() {
    super();

    this.i = 0;
    this.canvasTexture = new CanvasTextureTool(THREE, { onUpdate: (context, props) => {
      const { width, height, increment } = props;
      const columns = 20;
      const columnWidth = width / (columns * 0.5);
      context.clearRect(0,0, width, height);
      context.beginPath();
      context.lineWidth = columnWidth * 0.25;
      let i;
      for (i = 0; i < columns; i++) {
        const dist = (columnWidth * i) + (increment % columnWidth);
        context.moveTo(-10, dist);
        context.lineTo(dist, -10);
      }
      context.strokeStyle = "rgba(0, 0, 0, 0.1)";
      context.stroke();
    }});

    this.material = this.canvasTexture.material;
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.canvasTexture.update({ increment: this.i++ });
    this.rotation.x += 0.03;
    this.rotation.y += 0.03;
  }
}

// START
const canvasTest = new CanvasTest();

// ADDS
webgl.add(canvasTest);

/* ---- CREATING ZONE END ---- */
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
/**/ function _loop(){
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
