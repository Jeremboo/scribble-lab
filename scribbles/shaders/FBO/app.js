import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, NearestFilter, RGBFormat,
  FloatType, ShaderMaterial, DataTexture,
} from 'three';

import { getRandomFloat } from 'utils';

import FBOParticle from 'FBOParticle';

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
/**/     this.renderer = new WebGLRenderer({ antialias: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     if (bgColor) this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 1000);
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

/**
 * DOCS
 *
 * FBO: http://barradeau.com/blog/?p=621
 */

const SIZE = 250;
/**
**********
* DATA TEXTURE
**********
*/
const TEXTURE_WIDTH = 256;
const TEXTURE_HEIGHT = 256;

const getRandomData = (w, h, size) => {
  let len = w * h * 3;
  const data = new Float32Array(len);
  while (len--) data[len] = getRandomFloat(-size, size);
  return data;
};
const data = getRandomData(TEXTURE_WIDTH, TEXTURE_HEIGHT, SIZE);
const positions = new DataTexture(data, TEXTURE_WIDTH, TEXTURE_HEIGHT, RGBFormat, FloatType);
positions.needsUpdate = true;


/**
 **********
 * FBO
 **********
 */

/** *********
 * PARTICLE MATERIAL
 */
const particleShaderMaterial = new ShaderMaterial({
  uniforms: {
    // Will be set after the FBO.update() call
    positions: { type: 't', value: null },
    pointSize: { type: 'f', value: 2 },
  },
  vertexShader: `
    uniform sampler2D positions; // RenderTarget containing the transformed positions
    uniform float pointSize;
    void main() {
      // the mesh is a normalized square so the uvs = the xy positions of the vertices
      vec3 pos = texture2D( positions, position.xy ).xyz;
      // pos now contains a 3D position in space, we can use it as a regular vertex

      // regular projection of our position
      gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

      // sets the point size
      gl_PointSize = pointSize;
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4( vec3( 1.0 ), 0.25 );
    }
  `,
});

/** *********
 * PARTICLE POSITION
 */
const simulationShaderMaterial = new ShaderMaterial({
  uniforms: { positions: { type: 't', value: positions } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = vec2(uv.x, uv.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform sampler2D positions;
    varying vec2 vUv;
    void main() {
        vec3 pos = texture2D( positions, vUv ).rgb;
        gl_FragColor = vec4( pos,1.0 );
    }
  `,
});

/** *********
 * INIT
 */
const particles = new FBOParticle(
  TEXTURE_WIDTH,
  TEXTURE_HEIGHT,
  simulationShaderMaterial,
  particleShaderMaterial,
  webgl.renderer,
);
webgl.add(particles);

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
