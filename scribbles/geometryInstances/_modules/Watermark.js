import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, ShapeBufferGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, PlaneGeometry,
  TextureLoader, ShaderMaterial, Vector3, Shape, DoubleSide,
  Vector2,
} from 'three';

import texture from 'texture.png';
import textureWithBorder from 'texture2.png';

const PLANE_HEIGHT = 6.5;
const NBR_OF_PLANE = 10;
const Z = 0;

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

export default class Watermark extends Object3D {
  constructor() {
    super();

    this.color = new Color('#FF3D3D');
    this.whiteColor = new Color('#ffffff');

    this.texture = new TextureLoader().load(texture);
    this.textureWithBorder = new TextureLoader().load(textureWithBorder);

    // ###
    // buildOneWatermark
    // http://stackoverflow.com/questions/28011525/three-js-transparancy-with-shadermaterial
    this.geometry = new PlaneGeometry(PLANE_HEIGHT * 2, PLANE_HEIGHT);
    this.coloredMaterial = new ShaderMaterial({
      uniforms: {
        texture: { type: 't', value: this.texture },
        color: { type: 'v3', value: new Vector3(this.color.r, this.color.g, this.color.b) },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });
    this.coloredMaterial.transparent = true;
    this.whiteMaterial = new ShaderMaterial({
      uniforms: {
        texture: { type: 't', value: this.textureWithBorder },
        color: { type: 'v3', value: new Vector3(this.whiteColor.r, this.whiteColor.g, this.whiteColor.b) },
      },
      vertexShader: vert,
      fragmentShader: frag,
    });
    this.whiteMaterial.transparent = true;

    for (let i = 0; i < NBR_OF_PLANE; i++) {
      this.buildOneWatermark(-i);
    }

    // ##
    // COMPLETE PLANES
    const z = (Z * 2) + 0.001;
    const planeTop = new Mesh(
      new PlaneGeometry(PLANE_HEIGHT * 4, PLANE_HEIGHT * 2),
      new MeshBasicMaterial({
        color: this.whiteColor,
      })
    );
    planeTop.position.set(0, PLANE_HEIGHT * 1.5, z);
    this.add(planeTop);

    const planeLeft = new Mesh(
      new PlaneGeometry(PLANE_HEIGHT, PLANE_HEIGHT * NBR_OF_PLANE),
      new MeshBasicMaterial({
        color: this.whiteColor,
      })
    );
    planeLeft.position.set(
      -PLANE_HEIGHT * 1.5,
      -PLANE_HEIGHT * (NBR_OF_PLANE - 1) * 0.5,
      z,
    );
    this.add(planeLeft);

    const planeRight = new Mesh(
      new PlaneGeometry(PLANE_HEIGHT, PLANE_HEIGHT * NBR_OF_PLANE),
      new MeshBasicMaterial({
        color: this.whiteColor,
      })
    );
    planeRight.position.set(
      PLANE_HEIGHT * 1.5,
      -PLANE_HEIGHT * (NBR_OF_PLANE - 1) * 0.5,
      z
    );
    this.add(planeRight);

    this.update = this.update.bind(this);
  }

  buildOneWatermark(i) {
    const posY = PLANE_HEIGHT * i * 0.8;
    const posZ = (Z * 2) - (i * 0.0001);
    const coloredMesh = new Mesh(this.geometry, this.coloredMaterial);
    coloredMesh.position.z = posZ;
    coloredMesh.position.y = posY;
    this.add(coloredMesh);

    // Second plane
    const whiteMesh = new Mesh(this.geometry, this.whiteMaterial);
    whiteMesh.position.z = posZ + 0.0001;
    whiteMesh.position.y = posY;
    this.add(whiteMesh);
  }

  update() {
    this.position.y += 0.01;
    // this.rotation.y += 0.001
  }
}
