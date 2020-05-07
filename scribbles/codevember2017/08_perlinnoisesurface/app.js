import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, OrthographicCamera,
  MeshLambertMaterial, DoubleSide, PlaneGeometry, Vector3, AmbientLight,
  PointLight,
} from 'three';

import dat from 'dat.gui';

import OrbitControls from '../../../modules/OrbitControls';

import { Noise } from 'noisejs';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707',
/**/       secondaryColor = '#FF7F16',
/**/       bgColor = '#0C171A';
/**/ let windowWidth = window.innerWidth,
/**/     windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
          // http://stackoverflow.com/questions/23450588/isometric-camera-with-three-js
          this.aspect = w / h;
          this.distance = 5;
          this.camera = new OrthographicCamera( - this.distance * this.aspect, this.distance * this.aspect,             this.distance, - this.distance, 1, 1000 );
          this.camera.position.set(20, 10, 20);
          this.camera.rotation.order = 'YXZ';
          this.camera.rotation.y = - Math.PI / 4;
          this.camera.rotation.x = Math.atan( - 1 / Math.sqrt( 2 ) );
/**/     this.dom = this.renderer.domElement;
          this.controls = new OrbitControls( this.camera, this.dom );
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
/**/    this.renderer.setSize(w, h);
        this.camera.left = -w / 100;
        this.camera.right = w / 100;
        this.camera.top = h / 100;
        this.camera.bottom = -h / 100;
        this.camera.updateProjectionMatrix();
/**/   }
/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

// PROPS / GUI
const PRECISITION = 40;
const props = {
  displacement: 0.3, // 0 - 1
  displacementX: 0.8, // 0 - 1
  displacementY: 1, // 0 - 1
  speed: 1, // -20 - 20
  speedX: 1, // -20 - 20
  speedY: 1, // -20 - 20
  amplitude: 1, // 0 - 2
  height: 2, // -2 - 2
};

const gui = new dat.GUI();
gui.close();
gui.add(props, 'displacement', 0, 1);
gui.add(props, 'displacementX', 0, 1);
gui.add(props, 'displacementY', 0, 1);
gui.add(props, 'speed', -20, 20);
gui.add(props, 'speedX', 0, 20);
gui.add(props, 'speedY', 0, 20);
gui.add(props, 'amplitude', 0, 2);
gui.add(props, 'height', -1, 4);


// OBJECTS
class Plateau extends Object3D {
  constructor(size = 5, segment = 10, depth = 1) {
    super();
    this.size = size;
    this.segment = segment;
    this.depth = depth;
    this.part = this.size / this.segment;
    this.updateVertice = v => v;

    this.material = new MeshLambertMaterial({
      color: new Color(secondaryColor),
      // shading: FlatShading,
      side: DoubleSide,
      // wireframe: true,
    });

    this.geometry = new PlaneGeometry(this.size, this.size, this.segment, this.segment);
    let i;
    for (i = 1; i < this.segment; i++) {
      this.geometry.vertices[i].add(new Vector3(0, -this.part, this.depth));
      this.geometry.vertices[this.geometry.vertices.length - i - 1].add(new Vector3(0, this.part, this.depth));
      const line = (i - 1) * (this.segment + 1);
      this.geometry.vertices[line + (this.segment + 1)].add(new Vector3(this.part, 0, this.depth));
      this.geometry.vertices[line + (this.segment * 2) + 1].add(new Vector3(-this.part, 0, this.depth));
    }
    this.geometry.vertices[0].add(new Vector3(this.part, -this.part, this.depth));
    this.geometry.vertices[this.segment].add(new Vector3(-this.part, -this.part, this.depth));
    this.geometry.vertices[this.geometry.vertices.length - this.segment - 1].add(new Vector3(this.part, this.part, this.depth));
    this.geometry.vertices[this.geometry.vertices.length - 1].add(new Vector3(-this.part, this.part, this.depth));

    this.mesh = new Mesh(this.geometry, this.material);

    this.add(this.mesh);
    this.rotation.set(Math.PI / 2, 0, 0);

    this.update = this.update.bind(this);
  }
  update() {
    this.geometry.verticesNeedUpdate = true;
    let j, k;
    for (j = 2; j <= this.segment; j++) {
      for (k = 0; k < (this.segment - 1); k++) {
        this.updateVertice(this.geometry.vertices[(j + this.segment) + ((this.segment + 1) * k)]);
      }
    }
    this.rotation.z += 0.002;
  }
  updatePlateau(callback) {
    this.updateVertice = callback;
  }
}

// START
const plateau = new Plateau(8, PRECISITION, 0);
plateau.position.y = -2;

const noise = new Noise();
let t = 0;
plateau.updatePlateau((vertice) => {
  t += 0.00001 * props.speed;
  vertice.setZ((noise.simplex2((vertice.x * props.displacementX * props.displacement) + (t * props.speedX), (vertice.y * props.displacementY * props.displacement) + (t *props.speedY)) * props.amplitude) - props.height);1});

const ambientLight = new AmbientLight(0xaaaaaa);
const pointLight = new PointLight(0xffffff);
pointLight.position.y = props.height;

// ADDS
webgl.add(plateau);
webgl.add(ambientLight);
webgl.add(pointLight);

/* ---- CREATING ZONE END ---- */
/**/
/**/
/**/ /* ---- ON RESIZE ---- */
/**/ function onResize() {
      console.log('resize')
/**/   windowWidth = window.innerWidth;
/**/   windowHeight = window.innerHeight;
/**/   webgl.resize(windowWidth, windowHeight);
/**/ }
/**/ window.addEventListener('resize', onResize);
/**/ window.addEventListener('orientationchange', onResize);
/**/ /* ---- LOOP ---- */
/**/ function loop(){
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(loop);
/**/ }
/**/ loop();
