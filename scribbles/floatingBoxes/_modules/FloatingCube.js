import {
  BoxGeometry, MeshToonMaterial, Mesh, Vector3,
} from 'three';

import { getRandomFloat, radians } from '../../../modules/utils';

/**
 * Update current to attract him to the target using gravity and velocity
 * Elastic effect can be made
 * @param {Vector3 || Euler} current
 * @param {Vector3} target
 * @param {Number} gravity
 * @param {Number} velocity
 */
function applyAttraction(current, target, velocity, friction) {
  const force = new Vector3();
  return () => {
    // const vecForce = current.clone().sub(target);
    // force.sub(vecForce.multiplyScalar(velocity));
    force.x -= ((current.x - target.x) * velocity);
    force.y -= ((current.y - target.y) * velocity);
    force.z -= ((current.z - target.z) * velocity);
    // current.add(force);
    current.x += force.x;
    current.y += force.y;
    current.z += force.z;
    force.multiplyScalar(friction);
  };
}

/**
 * * *******************
 * * FLOATING CUBE
 * * *******************
 */
export default class FloatingCube extends Mesh {
  constructor(x, y, {
    force = 0.004, scale = getRandomFloat(0.5, 2), color = '#C9F0FF', disapear = true,
    rotationFriction = 0.96,
  }) {
    // Create object
    const material = new MeshToonMaterial({
      color,
    });
    const faceMaterials = [
      material, // Left side
      material, // Right side
      material, // Top side
      material, // Bottom side
      material, // Front side
      undefined,  // Back side. Not need to be rendered
    ];
    const geometry = new BoxGeometry(scale, scale, scale);
    super(geometry, faceMaterials);
    this.castShadow = true;
    this.receiveShadow = false;

    // init
    // this.position.set(x, y, -1);
    this.position.set(x, y, getRandomFloat(-4, -1));
    this.rotation.set(
      getRandomFloat(radians(-30), radians(30)),
      getRandomFloat(radians(-30), radians(30)),
      0,
    );

    // Animation
    // this.targetedPosition = new Vector3(x, y, scale * -0.25);
    this.targetedPosition = new Vector3(x, y, -((scale * 0.5) - 0.5));
    this.targetedRotation = new Vector3();

    this.positionForce = new Vector3();
    this.positionVelocity = force;
    this.positionFriction = 0.92;
    this.rotationForce = new Vector3();
    this.rotationVelocity = force * 2;
    this.rotationFriction = rotationFriction;

    if (disapear) {
      setTimeout(() => {
        this.targetedPosition.set(x, y, -scale);
        this.targetedRotation.set(
          getRandomFloat(radians(-30), radians(30)),
          getRandomFloat(radians(-30), radians(30)),
          0,
        );
      }, getRandomFloat(4000, 4500));
    }

    this.update = this.update.bind(this);
  }

  update() {
    this.updatePosition();
    this.updateRotation();

    this.targetedRotation.multiplyScalar(0.1);
  }

  applyForce(force) {
    this.targetedRotation.add(force);
  }

  updateRotation() {
    this.rotationForce.x -= ((this.rotation.x - this.targetedRotation.x) * this.rotationVelocity);
    this.rotationForce.y -= ((this.rotation.y - this.targetedRotation.y) * this.rotationVelocity);
    // this.rotationForce.z -= ((this.rotation.z - this.targetedRotation.z) * this.rotationVelocity);

    this.rotation.x += this.rotationForce.x;
    this.rotation.y += this.rotationForce.y;
    // this.rotation.z += this.rotationForce.z;
    this.rotationForce.multiplyScalar(this.rotationFriction);
  }

  updatePosition() {
    const vecForce = this.position.clone().sub(this.targetedPosition);
    this.positionForce.sub(vecForce.multiplyScalar(this.positionVelocity));

    this.position.add(this.positionForce);
    this.positionForce.multiplyScalar(this.positionFriction);
  }

  /**
   * * *******************
   * * FRONT MATERIAL
   * * *******************
   */
  setTexture(texture) {
    this.material[4] = new MeshToonMaterial({
      map: texture,
    });
  }

  setMaterial(material) {
    this.material[4] = material;
  }
}
