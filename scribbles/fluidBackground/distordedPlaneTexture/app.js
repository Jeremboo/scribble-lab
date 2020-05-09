import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, PlaneBufferGeometry, ShaderMaterial,
  TextureLoader, Vector2, RepeatWrapping, NearestFilter
} from 'three';

const flatFrag = `
  precision highp float;
  precision highp int;

  varying vec2 vUv;

  uniform sampler2D background;
  uniform float timer;

  void main() {
    vec3 bg = texture2D(background, vUv).xyz;
    bg.y += vUv.x * cos(timer * 10.) * 0.1;
    bg.z -= vUv.y * sin(timer * 5.);
    gl_FragColor = vec4(bg, 1.0);
  }
`;
const flatVert = `
  precision highp float;
  precision highp int;

  varying vec2 vUv;

  uniform float timer;
  uniform float perlinDimension;
  uniform float perlinForce;
  uniform float perlinTransition;

  uniform vec2 directionTimer;
  uniform vec2 directionForce;

  // Perlin method
  // https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

  float cnoise(vec2 P){
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }

  void main()	{

    vec2 customUv = vec2(
      uv.x + directionTimer.x,
      uv.y + directionTimer.y
    );

    float noise = cnoise((customUv + timer) * perlinDimension) * perlinForce;

    vUv = vec2(
      (customUv.x) + (noise * directionForce.x),
      (customUv.y)
    );

    vec3 newPosition = position;

    vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 mvPosition = viewMatrix * worldPosition;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const gradient = './assets/gradient.jpg';

/**
 * * *******************
 * * CORE
 * * *******************
 */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 10);
    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size
  }
  add(mesh) {
    this.scene.add(mesh);
    if (!mesh.update) return;
    this.meshListeners.push(mesh.update);
    this.meshCount++;
  }
  update() {
    let i = this.meshCount;
    while (--i >= 0) {
      this.meshListeners[i].apply(this, null);
    }
    this.renderer.render(this.scene, this.camera);
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

const NOISE_SPEED      = 0.003;
const PERLIN_FORCE     = 0.03;
const PERLIN_DIMENSION = 1;

const DIRECTION_VELOCITY = -0.013;

const WIDTH = 20;
const HEIGHT = 10;

export default class FlatFluidColor extends Mesh {
  constructor(backgroundTexture) {
    backgroundTexture.wrapS = RepeatWrapping;
    backgroundTexture.wrapT = RepeatWrapping;
    backgroundTexture.minFilter = NearestFilter;

    const geometry = new PlaneBufferGeometry(WIDTH, HEIGHT, 100, 100);
    const material = new ShaderMaterial({
      uniforms : {
        background       : { value : backgroundTexture },
        timer            : { value : 0 },
        perlinForce      : { value : PERLIN_FORCE },
        perlinDimension  : { value : PERLIN_DIMENSION },
        perlinTransition : { value : 1 },
        directionTimer   : { value : new Vector2() },
        directionForce   : { value : new Vector2() },
      },
      vertexShader   : flatVert,
      fragmentShader : flatFrag
    });
    super(geometry, material);

    this.position.x = 0;
    this.position.y = 0;

    this.directionTimer = new Vector2();
    this.directionForce = new Vector2();

    // Save the size values
    this.userData.startingWidth = WIDTH;
    this.userData.startingHeight = HEIGHT;

    this.update = this.update.bind(this);
  }

  setDirectionForce(x, y) {
    this.directionForce.x = x;
    this.directionForce.y = y;
  }

  update() {
    this.material.uniforms.timer.value += NOISE_SPEED;

    this.material.uniforms.directionTimer.value.x += this.directionForce.x * 0.8;
    this.material.uniforms.directionTimer.value.y += this.directionForce.y;

    this.material.uniforms.directionForce.value.x += ((this.directionForce.x * 1000) - this.material.uniforms.directionForce.value.x) * 0.07;
    this.material.uniforms.directionForce.value.y = this.directionForce.y;
  };
}

// Loader
const loader = new TextureLoader();
loader.load(gradient, (backgroundTexture) => {
  const plane = new FlatFluidColor(backgroundTexture);
  webgl.add(plane);

  document.body.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    plane.setDirectionForce(
      x * DIRECTION_VELOCITY,
      y * DIRECTION_VELOCITY
    );
  })
});

/**
 * * *******************
 * * RESIZE && LOOP
 * * *******************
 */
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
// LOOP
function loop() {
  webgl.update();
  requestAnimationFrame(loop);
}
loop();
