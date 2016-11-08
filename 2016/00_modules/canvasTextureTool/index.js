import React from 'react';
import ReactDOM from 'react-dom';

import CanvasTexture from './CanvasTexture';
import CanvasTextureComponent from './CanvasTextureComponent';
import './canvasTextureTool.styl';

// TODO
// noiseTexture
// perlinNoiseTexture
// gradientTexture
// perlinGradientNoiseTexture
// customTexture
// fusionTexture // superpose

const CanvasTextureTool = THREE => {

  // TODO error message if THREE is not here.

  // INIT
  const canvas = [];
  const canvasWrapper = document.createElement('div');
  const render = () => {
    ReactDOM.render(
      <CanvasTextureComponent canvas={canvas} />,
      canvasWrapper
    );
  };

  // DOM RENDER WITH REACT
  canvasWrapper.id = 'canvas-texture-wrapper';
  canvasWrapper.className = 'CanvasTextureTool-wrapper';
  document.body.appendChild(canvasWrapper);
  render();

  return {
    createCanvas: (props = {}) => {
      canvas.push(<CanvasTexture {...props} THREE={THREE} />);
      console.log(canvas[0]);
      render();
    },
  };
};

//
// const CanvasTextureTool = (THREE, { width = 256, height = 256, onUpdate = f => f } = {}) => {
//   const canvas = document.createElement('canvas');
//   canvas.id = 'canvas-texture';
//   canvas.className = 'CanvasTextureTool-canvas';
//   canvas.width = width;
//   canvas.height = height;
//
//   const ctx = canvas.getContext('2d');
//
//   let texture = false;
//   let material = false;
//   if (THREE) {
//     texture = new THREE.Texture(canvas);
//     texture.needsUpdate = true;
//     material = new THREE.MeshBasicMaterial({ map: texture, overdraw: true });
//   }
//
//   const update = (data = {}) => {
//     const props = Object.assign(
//       { width, height },
//       typeof (data) === 'object' ? data : { data }
//     );
//     onUpdate(ctx, props);
//     if (THREE) {
//       texture.needsUpdate = true;
//     }
//   };
//   update();
//
//   // DOM RENDER WITH REACT
//   let canvasWrapper = document.getElementById('canvas-texture-wrapper');
//   if (!canvasWrapper) {
//     canvasWrapper = document.createElement('div');
//     canvasWrapper.id = 'canvas-texture-wrapper';
//     canvasWrapper.className = 'CanvasTextureTool-wrapper';
//     document.body.appendChild(canvasWrapper);
//   }
//   const render = () => {
//     ReactDOM.render(
//       <CanvasTextureComponent title="Title" />,
//       canvasWrapper
//     );
//   };
//   render();
//   //canvasWrapper.appendChild(canvas);
//
//   return {
//     update,
//     canvas,
//     texture,
//     material,
//   };
// };

export default CanvasTextureTool;
