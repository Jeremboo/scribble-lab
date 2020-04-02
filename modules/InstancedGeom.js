import { InstancedBufferGeometry, InstancedBufferAttribute } from 'three';

export default class InstancedGeom extends InstancedBufferGeometry {
  constructor(geometry, nbrOfInstances) {
    super();
    this.nbrOfInstances = nbrOfInstances;
    this.addAttribute('position', geometry.attributes.position.clone());
  }

  createAttribute(name, nbrOfAttributes) {
    const attribute = new InstancedBufferAttribute(
      new Float32Array(this.nbrOfInstances * nbrOfAttributes),
      nbrOfAttributes
    );
    this.addAttribute(name, attribute);

    return attribute;
  }
}
