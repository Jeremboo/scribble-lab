import {
  BoxGeometry, MeshToonMaterial, Mesh, Color, Vector3,
} from 'three';

import { getRandomFloat, radians } from 'utils';

/**
 * Update current to attract him to the target using gravity and velocity
 * Elastic effect can be made
 * @param {Vector3 || Euler} current
 * @param {Vector3} target
 * @param {Number} gravity
 * @param {Number} velocity
 */
function applyAttraction(current, target, gravity, velocity) {
  const force = new Vector3();
  return () => {
    // const vecForce = current.clone().sub(target);
    // force.sub(vecForce.multiplyScalar(gravity));
    force.x -= ((current.x - target.x) * gravity);
    force.y -= ((current.y - target.y) * gravity);
    force.z -= ((current.z - target.z) * gravity);
    // current.add(force);
    current.x += force.x;
    current.y += force.y;
    current.z += force.z;
    force.multiplyScalar(velocity);
  };
}

/**
 * * *******************
 * * FLOATING CUBE
 * * *******************
 */
export default class FloatingCube extends Mesh {
  constructor(x, y, { force = 0.004, scale = getRandomFloat(0.5, 2), color = '#C9F0FF', disapear = true }) {
    // Create object
    const material = new MeshToonMaterial({
      color: new Color(color),
    });
    const geometry = new BoxGeometry(scale, scale, scale);
    super(geometry, material);
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

    this.attractPosition = applyAttraction(this.position, this.targetedPosition, force, 0.92);
    this.attractRotation = applyAttraction(this.rotation, this.targetedRotation, force * 2, 0.96);

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
    this.attractPosition();
    this.attractRotation();

    this.targetedRotation.multiplyScalar(0.1);
  }

  applyForce(force) {
    this.targetedRotation.add(force);
  }
}