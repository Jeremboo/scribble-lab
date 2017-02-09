import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MultiMaterial, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide,
} from 'three';
import ThreeTextureTool from 'threejs-texture-tool';

const textureTool = new ThreeTextureTool();

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#ffffff';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = '#0001FF';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
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

const COLUMN_NUMBER = 34;
const CUBE_SIZE = 3;

const drawCanvasStripes = (context, props, specificPosFunc) => {
  const { width, height, increment } = props;
  const columnWidth = width / (COLUMN_NUMBER * 0.5);
  context.beginPath();
  context.fillStyle = bgColor;
  context.fillRect(0, 0, width, height);
  context.lineWidth = columnWidth * 0.15;
  context.strokeStyle = mainColor;
  let i;
  for (i = 0; i <= COLUMN_NUMBER; i++) {
    const dist = (columnWidth * i) - (increment % columnWidth);
    specificPosFunc(dist, columnWidth);
  }
  context.stroke();
};

// OBJECTS
class Block extends Object3D {
  constructor() {
    super();

    this.i = 0.0;
    this.diagonalStripeTexture = textureTool.createCanvasTexture();
    this.diagonalStripeTexture.drawCustomCanvas({ increment: this.i }, (context, props) => {
      drawCanvasStripes(context, props, (dist, columnWidth) => {
        context.moveTo(-columnWidth, dist);
        context.lineTo(dist, -columnWidth);
      });
    });
    this.diagonalReverseStripeTexture = textureTool.createCanvasTexture();
    this.diagonalReverseStripeTexture.drawCustomCanvas({ increment: this.i }, (context, props) => {
      const { width } = props;
      drawCanvasStripes(context, props, (dist, columnWidth) => {
        context.moveTo(width - dist, -columnWidth);
        context.lineTo(width + columnWidth, dist);
      });
    });
    this.verticalStripeTexture = textureTool.createCanvasTexture();
    this.verticalStripeTexture.drawCustomCanvas({ increment: this.i }, (context, props) => {
      const { height } = props;
      drawCanvasStripes(context, props, dist => {
        context.moveTo(dist, height);
        context.lineTo(dist, 0);
      });
    });
    this.horizontalStripeTexture = textureTool.createCanvasTexture();
    this.horizontalStripeTexture.drawCustomCanvas({ increment: this.i }, (context, props) => {
      const { height } = props;
      drawCanvasStripes(context, props, dist => {
        context.moveTo(dist, height);
        context.lineTo(dist, 0);
      });
    });

    this.materials = [];
    this.materials.push(this.horizontalStripeTexture.material);
    this.materials.push(this.verticalStripeTexture.material);
    this.materials.push(this.diagonalStripeTexture.material);
    this.materials.push(this.diagonalReverseStripeTexture.material);
    this.materials.push(this.horizontalStripeTexture.material);
    this.materials.push(this.verticalStripeTexture.material);

    this.geometry = new BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE, 20, 20);
    this.material = new MultiMaterial(this.materials);
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.rotation.set(1.52, 0, 0);
    this.add(this.mesh);

    this.floorGeometry = new PlaneGeometry(CUBE_SIZE + 0.1, CUBE_SIZE + 0.1, 1);
    this.floorMaterial = new MeshBasicMaterial({ color: '#0001E6', side: DoubleSide });
    this.floor = new Mesh(this.floorGeometry, this.floorMaterial);
    this.floor.position.set(-0.15, -CUBE_SIZE, 0.2);
    this.floor.rotation.set(1.52, 0, 0);
    this.add(this.floor);

    this.rotation.set(0.25, 0.7, 0);
    this.update = this.update.bind(this);
  }

  update() {
    this.i += 0.25;
    const dist = (Math.cos(this.i * 0.2) * 0.1) - 1
    this.mesh.position.y = dist;
    this.floor.scale.set(dist, dist, dist);
    // TODO fix threejs-texture-tool
    this.verticalStripeTexture.update({ increment: this.i });
    this.horizontalStripeTexture.update({ increment: this.i });
    this.diagonalStripeTexture.update({ increment: this.i });
    this.diagonalReverseStripeTexture.update({ increment: this.i });
  }
}


// ADDS
webgl.add(new Block());


/* ---- CREATING ZONE END ---- */
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
