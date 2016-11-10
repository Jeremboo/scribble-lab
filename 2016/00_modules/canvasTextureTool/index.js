import CanvasTexture from './CanvasTexture';
import './canvasTextureTool.styl';

const createCanvas = (width = window.innerWidth, height = window.innerHeight) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  return {
    canvas,
    context,
  };
};

const CanvasTextureTool = THREE => {

  // TODO error message if THREE is not here.

  // INIT
  const canvasArr = [];
  const canvasNameArr = [];
  const canvasWrapper = document.createElement('div');

  // DOM RENDER WITH REACT
  canvasWrapper.id = 'canvas-texture-wrapper';
  canvasWrapper.className = 'CanvasTextureTool-wrapper';
  document.body.appendChild(canvasWrapper);

  return {
    createCanvasTexture: (name = `canvas-${canvasArr.length}`, width = 256, height = 256) => {
      if (canvasNameArr.indexOf(name) !== -1) {
        console.log('Err: Cannot have the same name', name);
        return;
      }
      const canvasTexure = new CanvasTexture(THREE, width, height);

      // HTML
      const HTML = `
        <li class="CanvasTexture">
          <button id="${name}-open" class="CanvasTexture-button">${name}</button>
          <div id="${name}-window" class="CanvasTexture-window">
            <button id="${name}-close" class="CanvasTexture-button_close">x</button>
          </div>
        </li>
      `;
      canvasWrapper.insertAdjacentHTML('beforeend', HTML);

      // ACTIONS
      const openBtn = document.getElementById(`${name}-open`);
      const closeBtn = document.getElementById(`${name}-close`);
      const canvasWindow = document.getElementById(`${name}-window`);
      openBtn.addEventListener('click', () => {
        openBtn.classList.add('CanvasTextureTool-hidden');
        canvasWindow.classList.remove('CanvasTextureTool-hidden');
      });
      closeBtn.addEventListener('click', () => {
        openBtn.classList.remove('CanvasTextureTool-hidden');
        canvasWindow.classList.add('CanvasTextureTool-hidden');
      });
      canvasWindow.appendChild(canvasTexure.canvas);

      // SAVE
      canvasArr.push(canvasTexure);
      canvasNameArr.push(name);
      return canvasTexure;
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
