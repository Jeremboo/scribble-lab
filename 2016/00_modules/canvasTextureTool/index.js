import './canvasTextureTool.styl';

// TODO
// noiseTexture
// perlinNoiseTexture
// gradientTexture
// perlinGradientNoiseTexture
// customTexture
// fusionTexture // superpose

const CanvasTextureTool = (THREE, { width = 256, height = 256, onUpdate = f => f } = {}) => {
  const canvas = document.createElement('canvas');
  canvas.id = 'canvas-texture';
  canvas.className = 'CanvasTextureTool-canvas';
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  let texture = false;
  let material = false;
  if (THREE) {
    texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    material = new THREE.MeshBasicMaterial({ map: texture, overdraw: true });
  }

  const update = (data = {}) => {
    const props = Object.assign(
      { width, height },
      typeof (data) === 'object' ? data : { data }
    );
    onUpdate(ctx, props);
    if (THREE) {
      texture.needsUpdate = true;
    }
  };
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
    texture,
    material,
  };
};
export default CanvasTextureTool;
