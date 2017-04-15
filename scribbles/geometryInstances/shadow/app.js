import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, TetrahedronBufferGeometry,
  MeshBasicMaterial, Mesh, FlatShading, Color, UniformsLib,
  UniformsUtils, ShaderMaterial, PointLightHelper, AmbientLight, PointLight,
  Vector3,
} from 'three';

import OrbitControls from 'OrbitControl';

import { COLORS } from 'props';
import { getRandomAttribute } from 'utils';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = 0xaaaaaa // 'rgb(0, 0, 0)';
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
/**/     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
/**/     this.controls.enableDamping = true;
/**/     this.controls.dampingFactor = 0.1;
/**/     this.controls.rotateSpeed = 0.1;
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

// GLSL

const vertInstanced = `
	void main()	{
    gl_Position = projectionMatrix *
               modelViewMatrix *
               vec4(position, 1.0);
	}
`;

const fragInstanced = `
  uniform vec3 color;

  void main()	{
    gl_FragColor = vec4(color, 1.0);
  }
`;


// ##
// LIGHT
const ambiantLight = new AmbientLight(0xffffff, 0.5);
webgl.scene.add(ambiantLight);
const lights = [];
for (let i = 0; i < 4; i++) {
  const light = new PointLight(0xffffff, 0.5, 200);
  webgl.scene.add(light);
  lights.push(light);
}
lights[0].position.set(35, 20, 47);
lights[0].power = 2.5;
lights[1].position.set(-20, 50, -100);
lights[2].position.set(-50, 30, 110);
lights[2].power = 12;
lights[3].position.set(35, 30, 230);
lights[3].power = 8;
// helpers
for (let i = 0; i < 4; i++) {
  const helper = new PointLightHelper(lights[i], 10);
  webgl.scene.add(helper);
}


// OBJECTS
class Tetra extends Object3D {
  constructor() {
    super();

    // ##
    // MATERIAL
    // https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
    // https://aerotwist.com/tutorials/an-introduction-to-shaders-part-2/
    const color = new Color(getRandomAttribute(COLORS));
    const colorVec3 = new Vector3(color.r, color.g, color.b);
    const uniforms = UniformsUtils.merge([
      UniformsLib['lights'],
    ]);
    uniforms.color = {
      type: 'vec3',
      value: colorVec3,
    };
    this.material = new ShaderMaterial({
      vertexShader: vertInstanced,
      fragmentShader: fragInstanced,
      uniforms,
      lights: true,
      shading: FlatShading,
    });

    this.geometry = new TetrahedronBufferGeometry(2, 0);
    this.mesh = new Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.x += 0.03;
    this.rotation.y += 0.03;
  }
}

// START
const ex = new Tetra();

// ADDS
webgl.add(ex);

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
/**/ function _loop() {
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
