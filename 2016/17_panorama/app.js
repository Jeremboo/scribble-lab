import threeJs from 'three-js';

const THREE = threeJs();
const OrbitControls = require('three-orbit-controls')(THREE)

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = '#ff00ff';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new THREE.WebGLRenderer({ antialias: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     this.renderer.setClearColor(new THREE.Color(bgColor));
/**/     this.scene = new THREE.Scene();
/**/     this.scene.fog = new THREE.FogExp2(mainColor, 0.07);
/**/     this.camera = new THREE.PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
/**/     this.camera.position.set(0, 0, 10);
/**/     this.controls.enableDamping = true;
/**/     this.controls.dampingFactor = 0.25;
/**/     this.controls.enableZoom = false;
/**/     this.dom = this.renderer.domElement;
/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
/**/     this.resize(w, h);
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
/**/     this.controls.update();
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
import panoImg1 from '../00_inspirations/panorama.png';
import panoImg2 from '../00_inspirations/panorama2.png';

const IMAGES = [panoImg1, panoImg2];

class Panorama extends THREE.Object3D {
  constructor(img, depth) {
    super();

    this.material = new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture(img),
      transparent: true,
    });
    this.geometry = new THREE.SphereGeometry(depth, 100, 40);
    this.geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    // this.rotation.y += 0.001;
  }
}

const createPerspectivePaysage = (arrImgs) => {
  const dist = 7;
  const length = arrImgs.length - 1;

  let i;
  for ( i = length; i >= 0; i--) {
    webgl.add(new Panorama(arrImgs[length - i], dist + (i * dist)));
  }
};

createPerspectivePaysage(IMAGES);


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
