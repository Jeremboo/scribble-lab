import { SphereBufferGeometry, MeshBasicMaterial, Mesh, Object3D } from 'three';

import { getRandomFloat } from 'utils';

const starGeometry = new SphereBufferGeometry(0.5, 2, 2);
const starMaterial = new MeshBasicMaterial({
  color: 0xecf0f1,
  transparent: true,
  opacity: 0.5
});

class Star extends Mesh {
  constructor() {
    super(starGeometry, starMaterial);

    this.t = Math.random() * 4;
    this.scaleScalar = getRandomFloat(0.03, 0.1);
    this.rotation.z = Math.PI * Math.random() * 2;
    this.position
      .set(
        Math.random() * Math.sign(Math.random() - 0.5),
        Math.random() * Math.sign(Math.random() - 0.5),
        Math.random() * Math.sign(Math.random() - 0.5)
      )
      .normalize()
      .multiplyScalar(getRandomFloat(2, 10));

    this.update = this.update.bind(this);
  }

  update() {
    this.t += 0.01;
    this.scale.set(
      Math.sin(this.t) * this.scaleScalar,
      Math.sin(this.t) * this.scaleScalar,
      Math.sin(this.t) * this.scaleScalar
    );
  }
}

/**
 * * *******************
 * * MAIN
 * * *******************
 */
export default class Starts extends Object3D {
  constructor(nbrOfStars = 300) {
    super();

    this.nbrOfStars = nbrOfStars;

    // TODO do instancied Stars
    for (let i = 0; i < this.nbrOfStars; i++) {
      const star = new Star();
      this.add(star);
    }

    this.update = this.update.bind(this);
  }
  update() {
    for (let i = 0; i < this.nbrOfStars; i++) {
      this.children[i].update();
    }
  }
}
