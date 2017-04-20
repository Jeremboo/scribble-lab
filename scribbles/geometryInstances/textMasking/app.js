import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, ShapeBufferGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, PlaneGeometry,
  TextureLoader, ShaderMaterial, Vector3, Shape, DoubleSide,
  Vector2
} from 'three';

import texturePng from 'texture.png';
import texturePng2 from 'texture2.png';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#FE2F2F';
/**/ const bgColor = false // 'rgb(0, 0, 0)';
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

const vert = `
varying vec2 vUv;

void main()
{
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}
`;
const frag = `
uniform sampler2D texture;
uniform vec3 color;

varying vec2 vUv;

void main() {
    vec4 tex2 = texture2D( texture, vUv );
    gl_FragColor = vec4(color, tex2.x);
}
`;

// OBJECTS
// http://stackoverflow.com/questions/28011525/three-js-transparancy-with-shadermaterial
class Plane extends Object3D {
  constructor() {
    super();

    // First plane
    const color = new Color(secondaryColor);
    const texture = new TextureLoader().load(texturePng);
    const texture2 = new TextureLoader().load(texturePng2);
    this.material = new ShaderMaterial({
      uniforms: {
        texture: { type: 't', value: texture },
        color: { type: 'v3', value: new Vector3(color.r, color.g, color.b) },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });
    this.material.transparent = true;
    this.geometry = new PlaneGeometry(10, 5, 32);
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.position.z = 1;

    this.add(this.mesh);

    // Second plane
    this.material2 = new ShaderMaterial({
      uniforms: {
        texture: { type: 't', value: texture2 },
        color: { type: 'v3', value: new Vector3(1, 1, 1) },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });
    this.material2.transparent = true;
    this.geometry2 = new PlaneGeometry(10, 5, 32);
    this.mesh2 = new Mesh(this.geometry2, this.material2);
    this.mesh2.position.z = 1.0001;
    this.add(this.mesh2);

    this.update = this.update.bind(this);
  }

  update() {}
}

// START
const plane = new Plane();
webgl.add(plane);


// Tetrahedron who follow the mouse
// https://jsfiddle.net/atwfxdpd/10/
// OBJECT
const shape = new Shape([
    new Vector2(0.3, 0.4),
    new Vector2(1.0, 0.0),
    new Vector2(0.3, 1.0),
    new Vector2(0.3, 0.4)
  ]);
const geometry = new ShapeBufferGeometry(shape)
const material = new MeshBasicMaterial({
  color: new Color(secondaryColor),
  shading: FlatShading,
  side: DoubleSide,
});
const mesh = new Mesh(geometry, material);
webgl.add(mesh);

// MOUSE
const mouse = {x: 0, y: 0};
document.addEventListener('mousemove', (event) => {
  // Update the mouse variable
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Make the sphere follow the mouse
  const vector = new Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(webgl.camera);
  const dir = vector.sub(webgl.camera.position).normalize();
  const distance = -webgl.camera.position.z / dir.z;
  const pos = webgl.camera.position.clone().add(dir.multiplyScalar(distance));
  mesh.position.copy(pos);

  // Make the sphere follow the mouse
  //	mouseMesh.position.set(event.clientX, event.clientY, 0);
}, false);

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
