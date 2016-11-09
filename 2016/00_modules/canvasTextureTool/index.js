import './canvasTextureTool.styl';

// TODO
// noiseTexture
// perlinNoiseTexture
// gradientTexture
// perlinGradientNoiseTexture
// customTexture
// fusionTexture // superpose

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
  const canvasWrapper = document.createElement('div');

  // DOM RENDER WITH REACT
  canvasWrapper.id = 'canvas-texture-wrapper';
  canvasWrapper.className = 'CanvasTextureTool-wrapper';
  document.body.appendChild(canvasWrapper);

  return {
    createCanvasTexture: ({ width = 256, height = 256, onUpdate = f => f, name = `canvas-${canvasArr.length}` } = {}) => {
      // canvas
      const { canvas, context } = createCanvas(width, height);
      canvas.className = 'CanvasTextureTool-canvas';

      // three.js texture and material
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      const material = new THREE.MeshBasicMaterial({ map: texture, overdraw: true });

      // update for loop
      const update = (data = {}) => {
        const props = Object.assign(
          { width, height },
          typeof (data) === 'object' ? data : { data }
        );
        onUpdate(context, props);
        texture.needsUpdate = true;
      };
      update();

      // show in dom
      canvasWrapper.appendChild(canvas);

      // save and return
      const props = {
        name, canvas, context, texture, material, update,
      };
      canvasArr.push(props);
      return props;
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
