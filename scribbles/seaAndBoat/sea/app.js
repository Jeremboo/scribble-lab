import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D,
  ShaderMaterial, Mesh, Color, PlaneBufferGeometry,
  TextureLoader, REPEAT_WRAPPING, DoubleSide, FogExp2,
  AmbientLight, Fog, HemisphereLight
} from 'three';

import OrbitControls from 'OrbitControl';

import props from 'props';

import water from 'water.png';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = 0xffffff;
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
         this.renderer.setClearColor(new Color(props.FOG_COLOR));
/**/     this.scene = new Scene();
         // this.scene.fog = new FogExp2(0xeff1b5, 0.0025);
         this.scene.fog = new Fog(props.FOG_COLOR, props.FOG_FAR * props.FOG_NEAR, props.FOG_FAR);
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 5, 10);
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
         this.renderer.setClearColor(new Color(props.FOG_COLOR));
/**/     this.scene.fog = new Fog(props.FOG_COLOR, props.FOG_FAR * props.FOG_NEAR, props.FOG_FAR)
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

const vertexShader = `
#define SCALE 10.0

varying vec2 vUv;

uniform float uTime;
uniform float uScale;
uniform float uAmplitude;

float calculateSurface(float x, float z) {
    float y = 0.0;
    y += (sin(x * 1.0 / uScale + uTime * 1.0) + sin(x * 2.3 / uScale + uTime * 1.5) + sin(x * 3.3 / uScale + uTime * 0.4)) * uAmplitude;
    y += (sin(z * 0.2 / uScale + uTime * 2.5) + sin(z * 1.8 / uScale + uTime * 1.8) + sin(z * 2.8 / uScale + uTime * 0.8)) * uAmplitude;
    return y;
}

void main() {
    vUv = uv;
    vec3 pos = position;

    float strength = 1.0;
    pos.y += strength * calculateSurface(pos.x, pos.z);
    pos.y -= strength * calculateSurface(0.0, 0.0);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;

uniform sampler2D uMap;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

void main() {
    vec2 uv = vUv * 10.0 + vec2(uTime * -0.05);

    uv.y += 0.01 * (sin(uv.x * 3.5 + uTime * 0.35) + sin(uv.x * 4.8 + uTime * 1.05) + sin(uv.x * 7.3 + uTime * 0.45)) / 3.0;
    uv.x += 0.12 * (sin(uv.y * 4.0 + uTime * 0.5) + sin(uv.y * 6.8 + uTime * 0.75) + sin(uv.y * 11.3 + uTime * 0.2)) / 3.0;
    uv.y += 0.12 * (sin(uv.x * 4.2 + uTime * 0.64) + sin(uv.x * 6.3 + uTime * 1.65) + sin(uv.x * 8.2 + uTime * 0.45)) / 3.0;

    vec4 tex1 = texture2D(uMap, uv * 1.0);
    vec4 tex2 = texture2D(uMap, uv * 1.0 + vec2(0.2));

    vec3 blue = uColor;
    gl_FragColor = vec4(blue + vec3(tex1.a * 0.9 - tex2.a * 0.02), 1.0);

    // FOG
    #ifdef USE_FOG
        #ifdef USE_LOGDEPTHBUF_EXT
            float depth = gl_FragDepthEXT / gl_FragCoord.w;
        #else
            float depth = gl_FragCoord.z / gl_FragCoord.w;
        #endif
        float fogFactor = smoothstep( fogNear, fogFar, depth );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
    #endif
}
`;

// OBJECTS
class Sea extends Object3D {
  constructor() {
    super();

    this.geometry = new PlaneBufferGeometry(50, 50, 20, 20);
    this.geometry.rotateX(-Math.PI / 2);

    const uniforms = {
      uMap: { type: 't', value: null },
      uTime: { type: 'f', value: 0 },
      uColor: { type: 'f', value: new Color(props.COLOR) },
      uScale: { type: 'f', value: props.SCALE },
      uAmplitude: { type: 'f', value: props.AMPL },
      // http://stackoverflow.com/questions/37243172/how-to-add-fog-to-texture-in-shader-three-js-r76/37365516#37365516
      fogColor: { type: 'f', value: new Color(props.FOG_COLOR) },
      fogNear: { type: 'f', value: props.FOG_NEAR },
      fogFar: { type: 'f', value: props.FOG_FAR },
    };

    this.customMaterial = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: DoubleSide,
      fog: true,
    });

    const textureLoader = new TextureLoader();
    textureLoader.load(water, (texture) => {
      this.customMaterial.uniforms.uMap.value = texture;
      texture.wrapS = texture.wrapT = REPEAT_WRAPPING;
    });

    this.mesh = new Mesh(this.geometry, this.customMaterial);
    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.customMaterial.uniforms.uTime.value += props.SPEED;
    this.customMaterial.uniforms.uScale.value = props.SCALE;
    this.customMaterial.uniforms.uAmplitude.value = props.AMPL;
    this.customMaterial.uniforms.uColor.value = new Color(props.COLOR);
  }
}

// START
// ADDS
webgl.add(new Sea());

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
