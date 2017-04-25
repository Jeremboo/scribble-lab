import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, TetrahedronBufferGeometry,
  Mesh, FlatShading, Color,
  ShaderMaterial, PointLightHelper, AmbientLight, PointLight,
  Vector3, MeshPhongMaterial, SphereGeometry, MeshBasicMaterial,
} from 'three';
import OrbitControls from 'OrbitControl';
import { GUI } from 'dat.gui/build/dat.gui';

const props = {
  showTardetedResult: false,
  rotationSpeed: 0.001,
  NBR_OF_LIGHTS: 3,
  LIGHT_DISTANCE: 200,
};

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = 0xaaaaaa;
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
/**/     this.camera.position.set(0, 0, 150);
/**/     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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


// ##
// SHADER
const vertInstanced = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vPos;

	void main()	{

    vNormal = normal;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vPos = (modelMatrix * vec4(position, 1.0 )).xyz;

    gl_Position = projectionMatrix *
               modelViewMatrix *
               vec4(position, 1.0);
	}
`;

const fragInstanced = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vPos;

  uniform vec3 color;
  uniform vec3 ambientLightColor;

  uniform vec3 lightsPosition[${props.NBR_OF_LIGHTS}];
  uniform float lightsDistance[${props.NBR_OF_LIGHTS}];
  uniform float lightsPower[${props.NBR_OF_LIGHTS}];

  void main()	{
    // V1 http://blog.edankwan.com/post/three-js-advanced-tips-shadow
    // vec3 pointLightPosition = lightsPosition[0];
    // float dProd = max(0.0, dot(vNormal, pointLightDirection)) + ambientLightColor.x;
    // gl_FragColor = vec4(color, 1.0) * vec4(dProd, dProd, dProd, 1.0);

    // V2 https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
    vec4 addedLights = vec4(ambientLightColor, 1.0);
    for(int l = 0; l < ${props.NBR_OF_LIGHTS}; l++) {
      vec3 lightDirection = normalize(lightsPosition[l] - vWorldPosition);
      addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0);
    }
    gl_FragColor = vec4(color, 1.0) * addedLights;
  }
`;


// ##
// LIGHT
const ambientLight = new AmbientLight(0xffffff, 0.5);
webgl.scene.add(ambientLight);
let i;
const lights = [];
for (i = 0; i < props.NBR_OF_LIGHTS; i++) {
  const light = new PointLight(0xffffff, 0.5, props.LIGHT_DISTANCE);
  webgl.scene.add(light);
  lights.push(light);
}
lights[0].position.set(0, 0, 50);
// lights[0].power = 2;
lights[1].position.set(50, 0, 0);
// lights[1].power = 6;
lights[2].position.set(0, 0, -50);
// lights[2].power = 12;

// ##
// OBJECT
class Tetra extends Object3D {
  constructor(showTargetedResult) {
    super();
    const color = new Color('#c15455');

    // ##
    // MATERIAL
    // https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
    // https://aerotwist.com/tutorials/an-introduction-to-shaders-part-2/
    if (showTargetedResult) {
      this.material = new MeshPhongMaterial({
        color,
        shading: FlatShading,
      });
      this.visible = false;
    } else {
      const colorVec3 = new Vector3(color.r, color.g, color.b);
      const uniforms = {};
      // const uniforms = UniformsUtils.merge([
      //   UniformsLib['lights'],
      // ]);
      uniforms.color = {
        type: 'vec3',
        value: colorVec3,
      };
      uniforms.ambientLightColor = {
        type: 'vec3',
        value: new Vector3(ambientLight.color.r, ambientLight.color.g, ambientLight.color.b),
      };
      uniforms.lightsPosition = {
        type: 'vec3v',
        value: lights.map(light => light.position),
      };
      uniforms.lightsDistance = {
        type: 'fv1',
        value: lights.map(light => light.distance),
      };
      uniforms.lightsPower = {
        type: 'fv1',
        value: lights.map(light => light.power),
      };
      this.material = new ShaderMaterial({
        vertexShader: vertInstanced,
        fragmentShader: fragInstanced,
        uniforms,
        // lights : true,
        shading: FlatShading,
      });
      this.material = new ShaderMaterial({
        vertexShader: vertInstanced,
        fragmentShader: fragInstanced,
        shading: FlatShading,
        // lights : true,
        uniforms,
      });
    }

    this.geometry = new TetrahedronBufferGeometry(20, 0);
    this.mesh = new Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.mesh.material.needsUpdate = true;
    this.rotation.x += props.rotationSpeed;
    this.rotation.y += props.rotationSpeed;
  }
}

// ##
// START
const customTetra = new Tetra();
const targetedTetra = new Tetra(true);

webgl.add(customTetra);
webgl.add(targetedTetra);

// ##
// HELPER
const toggleTargetedResult = show => {
  customTetra.visible = !show;
  targetedTetra.visible = show;
};
const gui = new GUI();
const targetedResultController = gui.add(props, 'showTardetedResult');
gui.add(props, 'rotationSpeed', 0, 0.1);
targetedResultController.onChange(toggleTargetedResult);

for (i = 0; i < props.NBR_OF_LIGHTS; i++) {
  const helper = new PointLightHelper(lights[i], lights[i].distance * 0.1);
  webgl.scene.add(helper);

  const lightDistanceHelper = new Mesh(
    new SphereGeometry(lights[i].distance, 16, 16),
    new MeshBasicMaterial({ wireframe: true, color: helper.material.color }),
  );
  lightDistanceHelper.position.copy(lights[i].position);
  lightDistanceHelper.material.transparent = true;
  lightDistanceHelper.material.opacity = 0.5;
  webgl.scene.add(lightDistanceHelper);
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
/**/ function _loop() {
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
