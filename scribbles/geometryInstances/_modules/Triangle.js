import {
  Object3D, ShapeBufferGeometry,
  MeshBasicMaterial, Mesh, FlatShading,
  Vector3, Shape, DoubleSide, Color,
  Vector2,
} from 'three';


const TRIANGLE_SIZE = 0.5;
const Z = 0;

export default class Watermark extends Object3D {
  constructor(camera) {
    super();
    this.camera = camera;
    this.color = new Color('#FF3D3D');

    // https://jsfiddle.net/atwfxdpd/10/
    this.mouse = { x: 0, y: 0 };
    // OBJECT
    const shape = new Shape([
      new Vector2(0, TRIANGLE_SIZE),
      new Vector2(TRIANGLE_SIZE, -TRIANGLE_SIZE),
      new Vector2(-TRIANGLE_SIZE, -TRIANGLE_SIZE),
      new Vector2(0, TRIANGLE_SIZE),
    ]);
    const geometry = new ShapeBufferGeometry(shape);
    const material = new MeshBasicMaterial({
      color: this.color,
      shading: FlatShading,
      side: DoubleSide,
    });

    this.triangleMesh = new Mesh(geometry, material);
    this.add(this.triangleMesh);

    document.addEventListener('mousemove', this.updateTrianglePosition.bind(this));
  }

  updateTrianglePosition(event) {
    this.mouse.x = ((event.clientX / window.innerWidth) * 2) - 1;
    this.mouse.y = -((event.clientY / window.innerHeight) * 2) + 1;

    // Make the sphere follow the mouse
    const vector = new Vector3(this.mouse.x, this.mouse.y, Z);
    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
    this.triangleMesh.position.copy(pos);
  }
}
