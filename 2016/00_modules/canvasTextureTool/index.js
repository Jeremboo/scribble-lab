import CanvasTexture from './CanvasTexture';
import './canvasTextureTool.styl';

export default class CanvasTextureTool {
  constructor(THREE) {
    if (!THREE) {
      // TODO create true error
      console.log('Err: Three.js must be passed in parameter');
      return;
    }

    this.THREE = THREE;

    this.canvasNameArr = [];
    this.canvasWrapper = document.createElement('ul');

    // Init canvas wrapper into the dom
    this.canvasWrapper.id = 'canvas-texture-wrapper';
    this.canvasWrapper.className = 'CanvasTextureTool-wrapper';
    document.body.appendChild(this.canvasWrapper);

    // Listener on keycode to toggle canvasWrapper
    document.body.addEventListener('keydown', (e) => {
      console.log(e);
      // TODO toggle canvasWrapper if Cmd+h pressed
    });

    // this.createCanvasTexture = this.createCanvasTexture.bind(this);
  }

  createCanvasTexture(name = `canvas-${this.canvasNameArr.length}`, width = 256, height = 256) {
    if (this.canvasNameArr.indexOf(name) !== -1) {
      // TODO create true error
      console.log('Err: Cannot have the same name', name);
      return;
    }

    // HTML
    const HTML = `
      <li class="CanvasTexture">
        <button id="${name}-open" class="CanvasTexture-button">${name}</button>
        <div id="${name}-window" class="CanvasTexture-window CanvasTexture-hidden">
          <button id="${name}-close" class="CanvasTexture-close"></button>
        </div>
      </li>
    `;
    this.canvasWrapper.insertAdjacentHTML('beforeend', HTML);
    // ACTIONS
    const openBtn = document.getElementById(`${name}-open`);
    openBtn.addEventListener('click', () => {
      openBtn.classList.add('CanvasTexture-hidden');
      canvasWindow.classList.remove('CanvasTexture-hidden');
    });
    const closeBtn = document.getElementById(`${name}-close`);
    closeBtn.addEventListener('click', () => {
      openBtn.classList.remove('CanvasTexture-hidden');
      canvasWindow.classList.add('CanvasTexture-hidden');
    });
    // CANVAS
    const canvasTexure = new CanvasTexture(this.THREE, width, height);
    const canvasWindow = document.getElementById(`${name}-window`);
    canvasWindow.appendChild(canvasTexure.canvas);

    // SAVE
    this.canvasNameArr.push(name);
    return canvasTexure;
  }
}
