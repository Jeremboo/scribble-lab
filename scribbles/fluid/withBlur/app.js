import {
  WebGLRenderer, Color, Scene, PerspectiveCamera, SphereGeometry,
  FlatShading, Object3D, MeshBasicMaterial, Mesh, Clock, Vector2,
} from 'three';

import {
  EffectComposer, RenderPass,
  BlurPass, SavePass, ShaderPass, CombineMaterial,
  DepthPass, TexturePass,
} from 'postprocessing';

import BlurShader from 'BlurShader';
import ColorMatrixPass from 'ColorMatrixPass';
import OutlinePass from 'OutlinePass';

const clock = new Clock();

import { getRandomInt, getRandomFloat } from 'utils';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707',
/**/       secondaryColor = '#FF7F16',
/**/       bgColor = '#ffffff';
/**/ let windowWidth = window.innerWidth,
/**/     windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
        this.w = w;
        this.h = h;
/**/     this._meshCount = 0;
/**/     this._meshListeners = [];
/**/     this._renderer = new WebGLRenderer({
          // logarithmicDepthBuffer: true,
          antialias: true
         });
/**/     this._renderer.setPixelRatio(window.devicePixelRatio);
/**/     this._renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 10);
/**/     this.dom = this._renderer.domElement;
/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
        this.initPostprocessing();
/**/     this.resize(w, h); // set render size

/**/   }
  initPostprocessing() {
    this._composer = new EffectComposer(this._renderer, { depthTexture: true });

    const render = new RenderPass(this.scene, this.camera);
    // render.renderToScreen = true;
    this._composer.addPass(render);

    // const savePass = new SavePass();
    // this._composer.addPass(savePass);


    // BLUR
    // const blurPass = new BlurPass();
    // blurPass.renderToScreen = true;
    // this._composer.addPass(blurPass);

    // horizontal blur shader
    const blurFactor = 3 // make it an even integer
    const blurThreshold = 0.005
    const horizontalBlur = BlurShader.horizontal(blurFactor, blurThreshold);
    horizontalBlur.renderToScreen = true;
    horizontalBlur.material.uniforms.h.value = 1 / window.innerWidth
    // vertical blur shader
    // const verticalBlur = BlurShader.vertical(blurFactor, blurThreshold)
    // verticalBlur.renderToScreen = true;
    // verticalBlur.material.uniforms.v.value = 1 / window.innerHeight


    // const depthPass = new DepthPass(this.camera);
    // // depthPass.renderToScreen = true;
    // this._composer.addPass(depthPass);

    // const outlinePass = new OutlinePass(new Vector2(this.w, this.h), this.scene, this.camera);
    // outlinePass.renderToScreen = true;
    // this._composer.addPass(outlinePass);

    // const combinePass = new ShaderPass(new CombineMaterial(), 'texture1');
    // combinePass.material.uniforms.texture2.value = savePass.renderTarget.texture;
    // combinePass.material.uniforms.opacity1.value = 0.5;
    // combinePass.material.uniforms.opacity2.value = 0.5;
    // combinePass.renderToScreen = true;
    // this._composer.addPass(combinePass);

    // color matrix shader
    // const colorMatrix = new ColorMatrixPass();
    // colorMatrix.material.uniforms.tDiffuse.value = blurPass.renderTargetY.texture;
    // colorMatrix.material.uniforms.uMatrix.value = [
    //   1, 0, 0, 0,
    //   0, 1, 0, 0,
    //   0, 0, 1, 0,
    //   0, 0, 0, 120,
    // ];
    // colorMatrix.material.uniforms.uMultiplier.value = [0, 0, 0, 0];
    // colorMatrix.renderToScreen = true;
    // this._composer.addPass(colorMatrix);
  }
/**/   add(mesh) {
/**/     this.scene.add(mesh);
/**/     if (!mesh.update) return;
/**/     this._meshListeners.push(mesh.update);
/**/     this._meshCount++;
/**/   }
/**/   update() {
/**/     let i = this._meshCount;
/**/     while (--i >= 0) {
/**/       this._meshListeners[i].apply(this, null);
/**/     }
/**/     // this._renderer.render(this.scene, this.camera);
  this._composer.render(clock.getDelta());
/**/   }
/**/   resize(w, h) {
/**/     this.camera.aspect = w / h;
/**/     this.camera.updateProjectionMatrix();
/**/     this._renderer.setSize(w, h);
         this._composer.setSize(w, h);

/**/   }
/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

/**

https://codepen.io/delcore92/pen/wqqgPN
https://codepen.io/clindsey/pen/PKqyBe
https://vanruesc.github.io/postprocessing/public/docs/
https://codepen.io/Jeremboo/pen/RZqjao?editors=0010

**/

const COLORS = [
  '#474350',
  // '#f8fff4',
  // '#fcffeb',
  // '#fafac6',
  // '#fecdaa',
  '#AF4E4E',
  '#5E4EAF',
];

let t = 0;
const SPEED = 0.05;
const SIZE_MIN = 0.1;
const SIZE_MAX = 0.35;
const DIST_AMPL = 1.8;

// OBJECTS
class Sphere extends Object3D {
  constructor(size) {
    super();

    this.size = size;
    this.dist = {
      x: (SIZE_MAX - this.size) + (getRandomFloat(0, SIZE_MAX) * DIST_AMPL),
      y: (SIZE_MAX - this.size) + (getRandomFloat(0, SIZE_MAX) * DIST_AMPL),
    };
    this.color = new Color(COLORS[getRandomInt(0, COLORS.length)]);
    this.speed = getRandomFloat(-0.5, 0.5);

    this.rotation.x = getRandomFloat(0, Math.PI);
    this.rotation.y = getRandomFloat(0, Math.PI);
    this.rotation.z = getRandomFloat(0, Math.PI);

    this._material = new MeshBasicMaterial({
      color: this.color,
      shading: FlatShading,
    });
    this._geometry = new SphereGeometry(this.size, 16, 16);
    this._mesh = new Mesh(this._geometry, this._material);

    this.add(this._mesh);

    this.update = this.update.bind(this);
  }

  update() {
    // TODO update dist with noise
    // this.dist += getRandomFloat(-0.1, 0.1) * 0.01;
    this._mesh.position.x = Math.cos(t * this.speed) * this.dist.x;
    this._mesh.position.y = Math.sin(t * this.speed) * this.dist.y;
  }
}

// START
const spheres = [];
for (let i = 0; i < 20; i++) {
  const s = new Sphere(getRandomFloat(SIZE_MIN, SIZE_MAX));
  spheres.push(s);
  webgl.add(s);
}

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
      t += SPEED;
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();


/**

const blurFactor = 2 // make it an even integer
const blurThreshold = 0.005

setTimeout(() => {
  const wanderingCircles = new WanderingCircles(300, 5, 56)
  const flame = new Flame(30, 6)
  const cone = new Cone(15, 45, -35)
  new Simulation('js-app', [wanderingCircles, flame, cone], -56, -15, 22)
}, 0)

class Simulation {
  constructor (domId, entities, x = 0, y = 0, z = 0) {
    const camera = this.createCamera(80, x, y, z, window.innerWidth, window.innerHeight)
    camera.target = new THREE.Vector3(0, 0, 0)
    camera.lookAt(camera.target)
    const scene = new THREE.Scene()
    this.createLights(scene)
    const renderer = this.createRenderer(0x666666)
    document.getElementById(domId).appendChild(renderer.domElement)
    const {
      composer,
      effects
    } = this.createComposerAndEffects(scene, camera, renderer)
    const handleWindowResize = this.onWindowResize(camera, renderer, composer, effects)
    handleWindowResize()
    window.addEventListener('resize', handleWindowResize, false)
    entities.map(e => scene.add(e))
    const controls = this.addControls(camera)
    this.animate(composer, renderer, scene, camera, controls, entities, +(new Date()), effects)
  }

  addControls (camera) {
    const controls = new THREE.OrbitControls(camera)
    controls.target = camera.target
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.rotateSpeed = 0.1
    return controls
  }

  createComposerAndEffects (scene, camera, renderer) {
    const effects = {}
    const renderScene = new THREE.RenderPass(scene, camera)
    const strength = 0.5
    const radius = 3.1
    const threshold = 0.05
    effects.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), strength, radius, threshold)
    // fast anti alias shader
    effects.fxaa = new THREE.ShaderPass(THREE.FXAAShader)
    effects.fxaa.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight)
    // copy shader
    effects.copy = new THREE.ShaderPass(THREE.CopyShader)
    effects.copy.renderToScreen = true
    // horizontal blur shader
    effects.horizontalBlur = new THREE.ShaderPass(BlurShader.horizontal(blurFactor, blurThreshold))
    effects.horizontalBlur.uniforms.h.value = 1 / window.innerWidth
    // vertical blur shader
    effects.verticalBlur = new THREE.ShaderPass(BlurShader.vertical(blurFactor, blurThreshold))
    effects.verticalBlur.uniforms.v.value = 1 / window.innerHeight
    // color matrix shader
    effects.colorMatrix = new THREE.ShaderPass(THREE.ColorMatrixPass)
    effects.colorMatrix.uniforms.uMatrix.value = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 120
    ]
    effects.colorMatrix.uniforms.uMultiplier.value = [0, 0, 0, -117]
    const composer = new THREE.EffectComposer(renderer)
    composer.setSize(window.innerWidth, window.innerHeight)
    composer.addPass(renderScene)
    composer.addPass(effects.fxaa)
    composer.addPass(effects.horizontalBlur)
    composer.addPass(effects.verticalBlur)
    composer.addPass(effects.colorMatrix)
    composer.addPass(effects.bloom)
    composer.addPass(effects.copy)
    return {
      composer,
      effects
    }
  }

  onWindowResize (camera, renderer, composer, effects) {
    return event => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      composer.setSize(width, height)
      effects.horizontalBlur.uniforms.h.value = 1 / window.innerWidth
      effects.verticalBlur.uniforms.v.value = 1 / window.innerHeight
      effects.fxaa.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight)
    }
  }

  animate (composer, renderer, scene, camera, controls, entities, lastTime, effects) {
    const currentTime = +(new Date())
    const timeDelta = currentTime - lastTime
    entities.forEach(e => e.time += timeDelta / 1000)
    requestAnimationFrame(() => {
      this.animate(composer, renderer, scene, camera, controls, entities, currentTime, effects)
    })
    controls.update()
    composer.render()
  }

  createCamera (fov, x = 0, y = 0, z = 0, width, height) {
    const camera = new THREE.PerspectiveCamera(fov, width / height, 1, 1000)
    camera.position.x = x
    camera.position.y = y
    camera.position.z = z
    return camera
  }

  createLights (scene) {
    const light = new THREE.AmbientLight('#f8845e', 1.5)
    scene.add(light)
    const hemilight = new THREE.HemisphereLight('#b82d98', '#26688f', 0.5)
    scene.add(hemilight)
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
    dirLight.color.setHSL(0.1, 1, 0.95)
    dirLight.position.set(-1, 1.75, 1)
    dirLight.position.multiplyScalar(50)
    scene.add(dirLight)
  }

  createRenderer (clearColor = 0x000000) {
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.toneMapping = THREE.LinearToneMapping
    renderer.autoClear = true
    renderer.setClearColor(clearColor, 0)
    return renderer
  }
}

class WanderingCircles extends THREE.Mesh {
  static createMaterial (texture) {
    return new THREE.BAS.BasicAnimationMaterial({
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {value: 0}
      },
      uniformValues: {},
      varyingParameters: [
        'varying vec3 vColor;'
      ],
      vertexFunctions: [],
      vertexParameters: [
        'uniform float uTime;',
        'attribute vec3 aColor;',
        'attribute vec3 aPosition;',
        'attribute vec2 aOffset;'
      ],
      vertexInit: [
        'vColor = aColor;'
      ],
      vertexNormal: [],
      vertexPosition: [
        'float seed = 5625463739.0;',
        'transformed += aPosition + 2.0 * vec3(cos(uTime + aOffset.x), aOffset.y, sin(uTime + aOffset.x));'
      ],
      vertexColor: [],
      fragmentFunctions: [],
      fragmentParameters: [],
      fragmentInit: [],
      fragmentMap: [],
      fragmentDiffuse: [
        'diffuseColor.xyz = vColor;'
      ]
    })
  }

  static assignAttributes (geometry, prefabCount, spread, orbitRadius) {
    const aOffset = geometry.createAttribute('aOffset', 2)
    let offset = new THREE.Vector2()
    const aPosition = geometry.createAttribute('aPosition', 3)
    const position = new THREE.Vector3()
    const aColor = geometry.createAttribute('aColor', 3)
    const colors = [
      0xff80a0,
      0xff678d
    ]
    const color = new THREE.Color()
    for (let i = 0; i < prefabCount; i++) {
      color.set(colors[Math.floor(Math.random() * colors.length)])
      const [x, y, z] = WanderingCircles.randomSpherePoint(spread / 2)
      position.x = x
      position.y = y
      position.z = z
      geometry.setPrefabData(aPosition, i, position.toArray())
      geometry.setPrefabData(aColor, i, color.toArray())
      offset.x = Math.random() * orbitRadius
      offset.y = Math.random()
      geometry.setPrefabData(aOffset, i, offset.toArray())
    }
  }

  static randomSpherePoint (radius) { // https://stackoverflow.com/a/15048260
     var u = Math.random()
     var v = Math.random()
     var theta = 2 * Math.PI * u
     var phi = Math.acos(2 * v - 1)
     var x = ((radius * Math.random()) * Math.sin(phi) * Math.cos(theta))
     var y = ((radius * Math.random()) * Math.sin(phi) * Math.sin(theta))
     var z = ((radius * Math.random()) * Math.cos(phi))
     return [x, y, z]
  }

  constructor (count, size, spread) {
    const planeGeometry = new THREE.SphereGeometry(size / 2, 32, 32)
    const geometry = new THREE.BAS.PrefabBufferGeometry(planeGeometry, count)
    geometry.computeVertexNormals()
    geometry.bufferUvs()
    WanderingCircles.assignAttributes(geometry, count, spread, size * 5)
    const material = WanderingCircles.createMaterial()
    super(geometry, material)
    this.frustumCulled = false
  }

  get time () {
    return this.material.uniforms.uTime.value
  }

  set time (newTime) {
    this.material.uniforms.uTime.value = newTime
  }
}

class Cone extends THREE.Mesh {
  constructor (radius, height, y) {
    const material = new THREE.MeshLambertMaterial({color: 0xd77218})
    const geometry = new THREE.ConeGeometry(radius, height, 16)
    super(geometry, material)
    this.position.y = y
    this.rotation.x = Math.PI
  }
}

class Flame extends THREE.Mesh {
  static createMaterial (texture) {
    return new THREE.BAS.BasicAnimationMaterial({
      shading: THREE.FlatShading,
      side: THREE.FrontSide,
      uniforms: {
        uTime: {value: 0},
        uScalingFactor: {value: 4.9},
        uFreqMin: {value: 0.62},
        uFreqMax: {value: 0.72},
        uNoiseAmplitude: {value: 1},
        uNoiseFrequency: {value: 0.08},
        uQWidth: {value: 0},
        uAnimation: {value: new THREE.Vector3(0, 0.4, 0.05)},
        uColor1: {value: new THREE.Color(0xffbdce)},
        uColor2: {value: new THREE.Color(0xff80a0)},
        uColor3: {value: new THREE.Color(0xff678d)},
        uColor4: {value: new THREE.Color(0x6a5752)}
      },
      uniformValues: {},
      varyingParameters: [
        'varying vec3 vFlameColor;'
      ],
      vertexFunctions: [
        `
          vec3 mod289 (vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289 (vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute (vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
          vec4 taylorInvSqrt (vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        `, `
          float snoise (vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy)); // First corner
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz); // Other corners
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
            vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
            i = mod289(i); // Permutations
            vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
            // Gradients: 7x7 points over a square, mapped onto an octahedron.
            // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3  ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0) * 2.0 + 1.0;
            vec4 s1 = floor(b1) * 2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w); //Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w; // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
          }
        `, `
          # define NOISE_STEPS 1
          float turbulence (vec3 position, float minFreq, float maxFreq, float qWidth) {
            float value = 0.0;
            float cutoff = clamp(0.5 / qWidth, 0.0, maxFreq);
            float fade;
            float fOut = minFreq;
            for (int i = NOISE_STEPS; i >= 0 ; i--) {
              if (fOut >= 0.5 * cutoff) break;
              fOut *= 2.0;
              value += abs(snoise(position * fOut)) / fOut;
            }
            fade = clamp(2.0 * (cutoff - fOut) / cutoff, 0.0, 1.0);
            value += fade * abs(snoise(position * fOut)) / fOut;
            return 1.0 - value;
          }
        `
      ],
      vertexParameters: [
        'uniform float uScalingFactor;',
        'uniform float uFreqMin;',
        'uniform float uFreqMax;',
        'uniform float uQWidth;',
        'uniform float uTime;',
        'uniform float uNoiseAmplitude;',
        'uniform vec3 uAnimation;',
        'uniform float uNoiseFrequency;',
        'attribute vec3 aPosition;',
        'uniform vec3 uColor1;',
        'uniform vec3 uColor2;',
        'uniform vec3 uColor3;',
        'uniform vec3 uColor4;',
        `
          vec3 fireShade (float distance) {
            float c1 = saturate(distance * 5.0 + 0.5);
            float c2 = saturate(distance * 5.0);
            float c3 = saturate(distance * 3.4 - 0.5);
            vec3 a = mix(uColor1, uColor2, c1);
            vec3 b = mix(a, uColor3, c2);
            return mix(b, uColor4, c3);
          }
        `
      ],
      vertexInit: [],
      vertexNormal: [
        'objectNormal += aPosition;'
      ],
      vertexPosition: [
        'transformed += aPosition;',
        'float noise = turbulence(transformed * uNoiseFrequency + uAnimation * uTime, uFreqMin, uFreqMax, uQWidth);',
        'vFlameColor = fireShade(1.0 - saturate(abs(noise * uNoiseAmplitude)));',
        'transformed *= 1.0 - saturate(abs(noise * (uNoiseAmplitude * (uNoiseFrequency * uScalingFactor))));',
      ],
      vertexColor: [],
      fragmentFunctions: [],
      fragmentParameters: [],
      fragmentInit: [],
      fragmentMap: [],
      fragmentDiffuse: [
        'diffuseColor.rgb = vFlameColor;'
      ]
    })
  }

  constructor (radius, tesselation) {
    const model = new THREE.IcosahedronGeometry(radius, tesselation);
    const geometry = new THREE.BAS.ModelBufferGeometry(model);
    const material = Flame.createMaterial();
    super(geometry, material)
    this.castShadow = true
    this.receiveShadow = true
  }

  get time () {
    return this.material.uniforms.uTime.value
  }

  set time (newTime) {
    this.material.uniforms.uTime.value = newTime
  }
}



**/
