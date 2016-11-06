import threeJs from 'three-js';

const THREE = threeJs();
const OrbitControls = require('three-orbit-controls')(THREE)

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
/**/     this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     // this.renderer.setClearColor(new THREE.Color('rgba(0, 0, 0, 0)'));
/**/     this.scene = new THREE.Scene();
/**/     this.camera = new THREE.PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
/**/     this.camera.position.set(0, 0, 10);
/**/     this.controls.enableDamping = true;
/**/     this.controls.dampingFactor = 0.25;
/**/     this.controls.enableZoom = false;
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

const shaderVert = `
  varying vec2 vUv;

  void main()
  {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const shaderFrag = `
  float nbrOfStripes = 12.0;
  float edge = 0.8;
  float speed = 0.1;

  uniform float i;

  varying vec2 vUv;

  void main() {
    float vel = vUv.x + (i * speed);
    vec3 stripes = vec3(step(edge, abs(fract(vel * nbrOfStripes))));
    gl_FragColor = vec4(stripes, 1.0);
  }
`;
// OBJECTS
class Block extends THREE.Object3D {
  constructor() {
    super();

    this.i = 0.0;

    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(secondaryColor),
      shading: THREE.FlatShading,
    });
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        i: { type: 'f', value: 1.0 },
      },
      vertexShader: shaderVert,
      fragmentShader: shaderFrag,
    });

    this.geometry = new THREE.BoxGeometry(2, 2, 2);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.i += 0.05;
    this.position.y = (Math.cos(this.i) * 0.05) - 1;
    this.mesh.material.uniforms.i.value = this.i;
  }
}

// ADDS
webgl.add(new Block());

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
