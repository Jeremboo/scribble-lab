// TODO 2024-05-23 jeremboo: Should be imported from three.js
import { Scene } from 'three';
import { CSS3DRenderer, CSS3DObject } from './CSS3DRenderer.js';

export default class DOMRenderer extends CSS3DRenderer {
  constructor(wrapper, camera) {
    super();

    this.camera = camera;
    this.scene = new Scene();

    // Create the inner wrapper
    this.content = document.createElement('div');
    this.content.append(...wrapper.childNodes);
    this.group = new CSS3DObject(this.content);
    this.scene.add(this.group);
    this.group.rotation.set(Math.PI * 0.5, Math.PI, Math.PI * 0.5);

    // Add the dom element in the DOM
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = 0;
    this.domElement.style.left = 0;
    wrapper.appendChild(this.domElement);
  }

  resize({ styleWidth, styleHeight }) {
    this.setSize(styleWidth, styleHeight);
  }

  _render() {
    this.render(this.scene, this.camera);
  }
}