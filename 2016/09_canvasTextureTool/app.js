import threeJs from 'three-js';
import CanvasTextureTool from '../00_modules/canvasTextureTool';

const THREE = threeJs();
const canvasTT = CanvasTextureTool(THREE);
const OrbitControls = require('three-orbit-controls')(THREE)



/**/ /* ---- CORE ---- */
/**/ const mainColor = '#ffffff';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = '#0001FF';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     // this.renderer.setClearColor(new THREE.Color(bgColor)));
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

const COLUMN_NUMBER = 34;
const CUBE_SIZE = 3;

const drawCanvasStripes = (context, props, specificPosFunc) => {
  const { width, height, increment } = props;
  const columnWidth = width / (COLUMN_NUMBER * 0.5);
  context.beginPath();
  context.fillStyle = bgColor;
  context.fillRect(0, 0, width, height);
  context.lineWidth = columnWidth * 0.15;
  context.strokeStyle = mainColor;
  let i;
  for (i = 0; i <= COLUMN_NUMBER; i++) {
    const dist = (columnWidth * i) - (increment % columnWidth);
    specificPosFunc(dist, columnWidth);
  }
  context.stroke();
}

// OBJECTS
class Block extends THREE.Object3D {
  constructor() {
    super();

    this.i = 0.0;
    this.canvasTextures = [];
    this.materials = [];

    let i;
    for (i = 0; i < 6; i++) {
      this.canvasTextures.push(canvasTT.createTexture());
      this.canvasTextures[i].drawCustomCanvas({}, (context, props) => {
        drawCanvasStripes(context, props, (dist, columnWidth) => {
          context.moveTo(-columnWidth, dist);
          context.lineTo(dist, -columnWidth);
        });
      });
      this.materials.push(this.canvasTextures[i].getMaterial());
    }

    this.geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, 20, 20);
    this.material = new THREE.MeshFaceMaterial(this.materials);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.set(1.52, 0, 0);
    this.add(this.mesh);

    this.floorGeometry = new THREE.PlaneGeometry(CUBE_SIZE + 0.1, CUBE_SIZE + 0.1, 1);
    this.floorMaterial = new THREE.MeshBasicMaterial({ color: '#0001E6', side: THREE.DoubleSide });
    this.floor = new THREE.Mesh(this.floorGeometry, this.floorMaterial);
    this.floor.position.set(-0.15, -CUBE_SIZE, 0.2);
    this.floor.rotation.set(1.52, 0, 0);
    this.add(this.floor);

    this.rotation.set(0.25, 0.7, 0);
    this.update = this.update.bind(this);
  }

  update() {
    this.i += 0.25;
    const dist = (Math.cos(this.i * 0.2) * 0.1) - 1
    this.mesh.position.y = dist;
    this.floor.scale.set(dist, dist, dist);

    let i;
    const length = this.canvasTextures.length;
    for (i = 0; i < length; i++) {
      this.canvasTextures[i].update({ increment: this.i });
    }
  }
}


// ADDS
webgl.add(new Block());


/* ---- CREATING ZONE END ---- */
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
