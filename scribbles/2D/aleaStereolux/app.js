import {
  Mesh, Color, BoxGeometry, PlaneGeometry, TextureLoader, SphereBufferGeometry, MeshBasicMaterial, PointLight, ShadowMaterial, Group, Vector3,
} from 'three';
import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import Renderer from '../../../modules/Renderer.three';
import OrbitControls from '../../../modules/OrbitControls';
import { getRandomFloat, getRandomItem } from '../../../utils';
import { distance } from '../../../utils/vec2';

// TODO 2022-02-25 jeremboo:
/**
 * TODO:
 * - Créer deux ombres de différentes couleurs selon les deux sources lumineuses.
 * - Ajouter la typographie en texture
 * - Faire en sorte que les cubes ne se touchent pas (voir portfolio)
 */


// TODO 2022-02-25 jeremboo: use this
// https://stackoverflow.com/questions/11473755/how-to-detect-collision-in-three-js
// const isCollide = (obj1, obj2) => {
//   const obj1Attributes = Player.geometry.attributes.position.array.length;
//   for (let vertexIndex = 0; vertexIndex < obj1Attributes; vertexIndex++)
//   {
//       var localVertex = new THREE.Vector3().fromBufferAttribute(Player.geometry.attributes.position, vertexIndex).clone();
//       var globalVertex = localVertex.applyMatrix4(Player.matrix);
//       var directionVector = globalVertex.sub( Player.position );

//       var ray = new THREE.Raycaster( Player.position, directionVector.clone().normalize() );
//       var collisionResults = ray.intersectObjects( collidableMeshList );
//       if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() )
//       {
//           // a collision occurred... do something...
//       }
//   }
// }


const PROPS = {
  bgColor: '#ffffff',
  blockNbr: 5,
  blockLenghts: [1, 1, 1, 2.5],
  blockColors1: ['#F55A5A', '#598CF5', '#30EB64'],
  blockColors2: ['#598CF5', '#2F64D7', '#B48CFC',],
  // shadows: [0.05, 0.05],
  shadows: [0.06],
  planeScale: 0.4,
  distanceMin: 0.9,
  distanceTitleMinX: 2,
  distanceTitleMinY: 1,
};

const blocks = [];

class Block extends Mesh {
  constructor(color) {
    super(
      new BoxGeometry(1, getRandomItem(PROPS.blockLenghts), 1),
      new MeshBasicMaterial({ color: new Color(color) })
    );
    this.castShadow = true;
    this.position.z = 0.5;
    this.update = this.update.bind(this);
  }

  updatePosition() {
    this.rotation.z = Math.random() * Math.PI * 2;
    this.position.x = getRandomFloat(-2, 2);
    this.position.y = getRandomFloat(-4, 4);
  }

  update({ playhead }) {}
}

class Light extends Group {
  constructor() {
    super();

    this.light = new PointLight(0xffffff, 1, 100);
    this.light.position.set(
      getRandomFloat(-2, 2),
      getRandomFloat(-3, 3),
      getRandomFloat(0, 9)
    );
    this.light.castShadow = true;
    this.light.shadow.mapSize.width = 2048;
    this.light.shadow.mapSize.height = 2048;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 20;
    this.add(this.light);

    this.sphere = new Mesh(new SphereBufferGeometry(0.08, 32, 32), new MeshBasicMaterial({ color: 0x333333 }))
    this.sphere.position.z = 2;
    this.add(this.sphere);

    this.update = this.update.bind(this);
  }

  update() {
    this.sphere.position.x = this.light.position.x;
    this.sphere.position.y = this.light.position.y;
  }
}

class Shadow extends Mesh {
  constructor(opacity) {
    super(
      new PlaneGeometry(210 * PROPS.planeScale, 297 * PROPS.planeScale),
      new ShadowMaterial({ color: 0x000000, opacity })
    );
    this.receiveShadow = true;
  }
}


canvasSketch(({ context }) => {
  // * GUI *******
  const gui = new GUI();

  // * Init ******
  const renderer = new Renderer({ canvas: context.canvas });
  const controls = new OrbitControls(renderer.camera, context.canvas);
  renderer.setClearColor(PROPS.bgColor, 1);
  renderer.shadowMap.enabled = true;
  // renderer.shadowMap.type = PCFSoftShadowMap; // default PCFShadowMap

  // * Title ******
  const title = new Mesh(new PlaneGeometry(4, 2, 1), new MeshBasicMaterial())
  title.position.x = getRandomFloat(-1, 1.5);
  title.position.y = getRandomFloat(-3.8, 3.8);


  const titleFolder = gui.addFolder('title');
  titleFolder.add(title.position, 'x', -5, 5);
  titleFolder.add(title.position, 'y', -5, 5);

  const data = {
    x: 4
  };
  titleFolder.add(data, 'x', 2, 7).onChange(() => {
    console.log(data.x);
  })


  title.position.z = -0.01;
  renderer.add(title);

  const loader = new TextureLoader();
  loader.load('./assets/title.png', (texture) => {
    title.material.map = texture;
    title.material.needsUpdate = true;
  })

  // * Blocks ******
  const addBlock = (block) => {
    block.updatePosition();
    // TODO 2022-02-25 jeremboo: Test with physic instead
    let isFarEnought = true;
    const { x, y, dist } = distance(title.position.x, title.position.y, block.position.x, block.position.y);
    // isFarEnought = Math.abs(x) > PROPS.distanceTitleMinX && Math.abs(y) > PROPS.distanceTitleMinY;
    isFarEnought = dist > 1.5;
    blocks.forEach((b) => {
      const { dist } = distance(b.position.x, b.position.y, block.position.x, block.position.y);
      if (isFarEnought && dist < PROPS.distanceMin) {
        isFarEnought = false;
      }
    });

    if (isFarEnought) {
      const boxGui = gui.addFolder(`box-${block.id}`)
      boxGui.add(block.position, 'x', -5, 5);
      boxGui.add(block.position, 'y', -5, 5);
      boxGui.add(block.rotation, 'z', -Math.PI, Math.PI).name('rotation');
      blocks.push(block);
      renderer.add(block);
    } else {
      addBlock(block);
    }
  }

  let i = 0;
  let length = PROPS.blockNbr * 0.5 - (Math.random() < 0.5 ?  0 : 1);
  const color1 = getRandomItem(PROPS.blockColors1);
  for (i = 0; i < length; i++) {
    const block = new Block(color1);
    addBlock(block);
  }

  length = PROPS.blockNbr - length;
  const color2 = getRandomItem(PROPS.blockColors2)
  for (i = 0; i < length; i++) {
    const block = new Block(color2);
    addBlock(block);
  }

  // * Lights ******
  //Create a DirectionalLight and turn on shadows for the light
  for (i = 0; i < PROPS.shadows.length; i++) {
    // Shadow
    const shadow = new Shadow(PROPS.shadows[0]);
    renderer.add(shadow);

    // Light
    const light = new Light();
    renderer.add(light);

    const lightGui = gui.addFolder(`light-${i + 1}`)
    lightGui.open();
    // lightGui.add(light.light, 'intensity', 0, 1).step(0.01);
    lightGui.add(shadow.material, 'opacity', 0, 1).name('shadow');
    lightGui.add(light.position, 'x', -5, 5).step(0.1);
    lightGui.add(light.position, 'y', -5, 5).step(0.1);
    lightGui.add(light.light.position, 'z', 0, 10).name('z').step(0.01);
  }

  // TODO 2022-02-25 jeremboo: jouer avec les layers


  // * Camera ******
  const lookAt = () => {
    renderer.camera.lookAt(new Vector3());
  }
  renderer.camera.position.x = getRandomFloat(-3, 0);
  renderer.camera.position.y = getRandomFloat(-3, 0);
  lookAt();

  const cameraGui = gui.addFolder('camera');
  cameraGui.add(renderer.camera.position, 'x', -5, 5).onChange(lookAt);
  cameraGui.add(renderer.camera.position, 'y', -5, 5).onChange(lookAt)


  return {
    resize(props) {
      renderer.resize(props);
    },
    render(props) {
      renderer.update(props);
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
}, {
  // fps: 15, // 24
  // duration: 4,
  dimensions: 'A4',
  scaleToView: true,
  animate: true,
  context: 'webgl',
  // pixelsPerInch: 300,
  // units: 'in'
});
