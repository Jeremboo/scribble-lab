import React from 'react';
import Canvas from './Canvas.js';

// export default class CanvasTexture extends Canvas {
//   constructor(props) {
//     super(props);
//
//     this.state = {
//       p: 'cccc',
//     }
//
//     this.texture = null;
//     this.material = null;
//   }
//
//   componentDidMount() {
//     super.componentDidMount();
//     const { THREE } = this.props;
//     this.texture = new THREE.Texture(this.canvas);
//     this.texture.needsUpdate = true;
//     this.material = new THREE.MeshBasicMaterial({
//       map: this.texture,
//       overdraw: true,
//     });
//   }
//
//   updateCanvas(data = {}) {
//     super.updateCanvas(data);
//     this.texture.needsUpdate = true;
//   }
// }

export default class CanvasTexture {
  constructor(THREE, { width = 256, height = 256, onUpdate = f => f } = {}) {
    this.THREE = THREE;
    this.texture = null;
    this.material = null;

    this.canvas = <Canvas width={width} height={height} onUpdate={onUpdate} setCanvas={this.setCanvas} />;
    this.getCanvas = this.getCanvas.bind(this);
  }

  setCanvas(canvas) {
    const { THREE } = this;
    this.canvas = canvas;
    this.texture = new THREE.Texture(this.canvas);
    this.texture.needsUpdate = true;
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      overdraw: true,
    });
  }
  update() {
    this.texture.needsUpdate = true;
  }
}
