import './canvasTextureTool.styl';

// export default class CanvasTextureTool {
//   constructor(update = f => f, props = { w: 256, h: 256 }) {
//     this.canvas = document.createElement('canvas');
//     this.canvas.id = 'canvas-texture';
//     this.canvas.className = 'CanvasTextureTool-canvas';
//     this.ctx = this.canvas.getContext('2d');
//
//     this.width = this.canvas.width = props.w;
//     this.height = this.canvas.height = props.h;
//     this.update = () => update(this);
//     update(this);
//
//     this.canvasWrapper = document.getElementById('canvas-texture-wrapper');
//     if (!this.canvasWrapper) {
//       this.canvasWrapper = document.createElement('div');
//       this.canvasWrapper.id = 'canvas-texture-wrapper';
//       this.canvasWrapper.className = 'CanvasTextureTool-wrapper';
//       document.body.appendChild(this.canvasWrapper);
//     }
//     this.canvasWrapper.appendChild(this.canvas);
//   }
// }

// TODO
// noiseTexture
// perlinNoiseTexture
// gradientTexture
// perlinGradientNoiseTexture
// customTexture
//fusionTexture // superpose

const CanvasTextureTool = (onUpdate = f => f, props = { width: 256, height: 256 }) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.id = 'canvas-texture';
  canvas.className = 'CanvasTextureTool-canvas';

  canvas.width = props.width;
  canvas.height = props.height;
  const update = () => onUpdate(ctx, props);
  update();

  // let canvasWrapper = document.getElementById('canvas-texture-wrapper');
  // if (!canvasWrapper) {
  //   canvasWrapper = document.createElement('div');
  //   canvasWrapper.id = 'canvas-texture-wrapper';
  //   canvasWrapper.className = 'CanvasTextureTool-wrapper';
  //   document.body.appendChild(canvasWrapper);
  // }
  // canvasWrapper.appendChild(canvas);

  return {
    update,
    canvas,
  };
};
export default CanvasTextureTool;
