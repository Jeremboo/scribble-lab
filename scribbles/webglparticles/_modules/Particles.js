import { Points, BufferGeometry, BufferAttribute } from 'three';

// TODO 2021-11-01 jeremboo: Move that in GLOBAL MODULE
export default class Particles extends Points {
  constructor(width, height, material) {
    let i;
    const l = width * height;
    const vertices = new Float32Array(l * 3);
    for (i = 0; i < l; i++) {
      const i3 = i * 3;
      vertices[i3] = (i % width) / height;
      vertices[i3 + 1] = (i / width) / height;
    }

    const particleGeom = new BufferGeometry();
    particleGeom.addAttribute('position', new BufferAttribute(vertices, 3));

    super(particleGeom, material);
  }
}
