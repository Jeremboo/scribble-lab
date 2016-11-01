import threeJs from 'three-js';
import canvasTextureTool from '../00_modules/canvasTextureTool';

const THREE = threeJs();

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
/**/     this.renderer = new THREE.WebGLRenderer({ antialias: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     this.renderer.setClearColor(new THREE.Color(bgColor));
/**/     this.scene = new THREE.Scene();
/**/     this.camera = new THREE.PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 10);
/**/     this.dom = this.renderer.domElement;
/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
/**/     this.resize(w, h); // set render size
/**/   }
/**/   add(obj) {
/**/     if (obj.mesh) this.scene.add(obj);
/**/     if (!obj.update) return;
/**/     this.meshListeners.push(obj.update);
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

const pistilVert = `
  varying vec2 vUv;
  uniform mat4 rotationForceMatrix;
  uniform sampler2D springinessMap;

  void main() {
    vUv = uv;

    vec4 flexTexture = texture2D(springinessMap, vUv);

    vec4 oldPos = vec4(position, 1.0);

    vec4 targetPos = oldPos * rotationForceMatrix;
    vec4 pos = oldPos + ((targetPos - oldPos) * flexTexture.x);

    gl_Position = projectionMatrix * modelViewMatrix * pos;
  }
`;
const pistilFrag = `
  uniform vec4 blueColor;
  uniform vec4 color;

  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(mix(color.rgb, blueColor.rgb, vUv.x), 1.0);
  }
`;

const VEL = 0.05;
const NBR_OF_PISTILS = 30;
const COLORS = [
  [249, 183, 112],
  [246, 150, 122],
  [255, 156, 148],
  [255, 208, 129],
  [190, 214, 170],
  [135, 118, 178],
  [105, 156, 166],
  [149, 193, 188],
  [214, 147, 153],
  [175, 115, 147],
  [194, 156, 178],
];
const getRotationMatrix = vectRotation => {
  const m = new THREE.Matrix4();
  const m1 = new THREE.Matrix4();
  const m2 = new THREE.Matrix4();
  const m3 = new THREE.Matrix4();

  m1.makeRotationX(-vectRotation.x);
  m2.makeRotationY(-vectRotation.y);
  m3.makeRotationY(-vectRotation.z);

  m.multiplyMatrices(m1, m2);
  m.multiply(m3);

  return m;
};
const getVec4Color = color => {
  const r = color[0] / 256;
  const g = color[1] / 256;
  const b = color[2] / 256;
  const v4 = new THREE.Vector4(r, g, b, 1);
  return v4;
};
const traverseArr = (arr, fct) => {
  const l = arr.length;
  let i = 0;
  for (i; i < l; i++) {
    fct(arr[i]);
  }
};
const getRandomFloat = (min, max) => Math.random() * (max - min) + min;
const getRandomEuler = () => new THREE.Euler(getRandomFloat(0, 6.2831), getRandomFloat(0, 6.2831), getRandomFloat(0, 6.2831));

class Pistil extends THREE.Object3D {
  constructor(positionZ) {
    super();

    // ##
    // INIT
    this.segments = 32;
    this.radiusSegment = 32;
    this.size = getRandomFloat(0.01, 0.1);
    this.length = getRandomFloat(this.size * 10, this.size * 50);
    this.curve = this.createCustomCurve();
    this.pistilHeadPosition = this.curve.getPoints()[this.curve.getPoints().length - 1];
    this.pistilHeadPosition.z += positionZ;

    // - STEM
    // -- geometry
    this.pistilStemGeometry = new THREE.TubeGeometry(this.curve, this.segments, this.size, this.radiusSegment / 2);
    // -- material
    // TODO refactor
    this.canvasTexture = new canvasTextureTool((context, props) => {
      const { width, height } = props
      const gradient = context.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgb(0, 0, 0)');
      gradient.addColorStop(1, 'rgb(255, 255, 255)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    });
    this.transitionTexture = new THREE.Texture(this.canvasTexture.canvas);
    this.transitionTexture.needsUpdate = true;

    this.stemShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        rotationForceMatrix: { type: 'm4', value: new THREE.Matrix4() },
        color: { type: 'v4', value: getVec4Color(COLORS[0]) },
        blueColor: { type: 'v4', value: getVec4Color([39, 53, 92]) },
        springinessMap: { type: 't', value: this.transitionTexture },
      },
      vertexShader: pistilVert,
      fragmentShader: pistilFrag,
    });
    // -- mesh
    this.pistilStemMesh = new THREE.Mesh(this.pistilStemGeometry, this.stemShaderMaterial);
    this.pistilStemMesh.position.z = positionZ;

    // - HEAD
    // -- pistilHead geometry/mesh
    this.pistilHeadGeometry = new THREE.SphereGeometry(getRandomFloat(this.size * 3.5, this.size * 5), this.radiusSegment, this.segment);
    // -- material
    this.headMaterial = new THREE.MeshBasicMaterial({ color: 0x324270 });
    // -- mesh
    this.pistilHeadMesh = new THREE.Mesh(this.pistilHeadGeometry, this.headMaterial);
    this.pistilHeadObject = new THREE.Object3D();
    this.pistilHeadObject.add(this.pistilHeadMesh);
    // -- position
    this.pistilHeadMesh.position.copy(this.pistilHeadPosition);

    // PISTIL (STEM + HEAD )
    this.add(this.pistilStemMesh);
    this.add(this.pistilHeadObject);

    // ##
    // INIT POSITION & SIZE
    this.rotation.copy(getRandomEuler());
  }

  update(matrixDistRotation) {
    this.pistilStemMesh.material.uniforms.rotationForceMatrix.value = matrixDistRotation;
  }

  createCustomCurve() {
    const CustomSinCurve = THREE.Curve.create(
      // custom curve constructor
      (length, curve) => {
        this.curve = (curve === undefined) ? 1 : curve;
        this.length = (length === undefined) ? 1 : length;
      },
      // getPoint: t is between 0-1
      (t) => {
        const tx = 0;
        const ty = Math.sin(t * this.curve);
        const tz = t * this.length;

        return new THREE.Vector3(tx, ty, tz);
      }
    );
    return new CustomSinCurve(this.length, this.curve);
  }
}


class PlanetPistil extends THREE.Object3D {
  constructor() {
    super();

    this.pistils = [];
    this.size = 2;

    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(secondaryColor),
      shading: THREE.FlatShading,
      wireframe: true,
    });
    this.geometry = new THREE.SphereGeometry(this.size, 32, 32);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
    this.setRandomRotation = this.setRandomRotation.bind(this);
    this.createPistil = this.createPistil.bind(this);

    // INIT
    this.setRandomRotation();
    document.body.addEventListener('click', this.setRandomRotation);

    for (let i = 0; i < NBR_OF_PISTILS; i++) {
      this.createPistil();
    }
  }

  update() {
    const distRotation = this.targetedRotation.toVector3().sub(this.rotation.toVector3());
    const distRotationMatrix = getRotationMatrix(distRotation);

    this.rotation.setFromVector3(this.rotation.toVector3().add(distRotation.multiplyScalar(VEL)));

    traverseArr(this.pistils, pistil => {
      pistil.update(distRotationMatrix);
    });

    if (Math.random() > 0.99) {
      // this.setRandomRotation();
    }
  }

  setRandomRotation() {
    this.targetedRotation = getRandomEuler();
  }

  createPistil() {
    const p = new Pistil(this.size);
    this.add(p);
    this.pistils.push(p);
  }
}

// START
const planetPistil = new PlanetPistil();

// ADDS
webgl.add(planetPistil);

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
