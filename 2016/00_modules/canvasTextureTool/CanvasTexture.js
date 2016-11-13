export default class CanvasTexture {
  constructor(THREE, width = 256, height = 256) {
    this.state = { width, height };
    this.canvas = null;
    this.context = null;
    this.texture = null;
    this.material = null;
    this.update = f => f;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    this.context = this.canvas.getContext('2d');

    this.texture = new THREE.Texture(this.canvas);
    this.texture.needsUpdate = true;

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      overdraw: true,
    });
  }

  drawCustomCanvas(props, onUpdate) {
    this.update = () => {
      onUpdate(this.context, Object.assign({}, this.state, props));
      this.texture.needsUpdate = true;
    };
  }
}
