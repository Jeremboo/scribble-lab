import {
  BufferGeometry,
  BufferAttribute,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  PlaneBufferGeometry
} from 'three';

const VERTICES = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0];

export const createPlaneBuffer = () => {
  const geom = new BufferGeometry();
  geom.addAttribute(
    'position',
    new BufferAttribute(new Float32Array(VERTICES), 3)
  );
  return geom;
};

export const createAttribute = (nbrOfInstances, nbrOfAttributes) => {
  const attribute = new InstancedBufferAttribute(
    new Float32Array(nbrOfInstances * nbrOfAttributes),
    nbrOfAttributes
  );
  return attribute;
};

export default class InstancedGeom extends InstancedBufferGeometry {
  constructor(geometry, nbrOfInstances) {
    super();
    this.nbrOfInstances = nbrOfInstances;
    this.addAttribute('position', geometry.attributes.position.clone());
  }

  setAttribute(name, nbrOfAttributes) {
    const attribute = createAttribute(this.nbrOfInstances, nbrOfAttributes);
    this.addAttribute(name, attribute);

    return attribute;
  }
}
