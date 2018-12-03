
import {
  Mesh, PlaneGeometry, ShaderMaterial, MeshBasicMaterial, Vector2, Color,
} from 'three';

import TweenLite, { Elastic } from 'gsap';

import vertMetaball from '../_shaders/metaball.v.glsl';
import fragMetaball from '../_shaders/metaball.f.glsl';

const BUBBLE_FORCE_FRICTION = 0.8;
const BUBBLE_GRAVITY_VELOCITY = 0.3;
const BUBBLE_MOUSE_VELOCITY = 0.3;
const BUBBLE_MOUSE_DIST = 0.5;

export default class Bubble extends Mesh {
  constructor (position, size, speed) {
    const geometry = new PlaneGeometry(size, size, 1, 1);
    // TODO raw shader material
    const material = new ShaderMaterial({
      vertexShader: vertMetaball,
      fragmentShader: fragMetaball,
      uniforms: {
        backgroundTexture: { type: 't', value: false },
        littleBubblePosition: { type: 'v2', value: new Vector2(0.5, 0.5) },
        color: { value: new Color('#00ff00') },
      },
      transparent: true,
      depthWrite: false,
    });
    // const material = new MeshBasicMaterial({
    //   color: new Color('#00ff00'),
    // });

    super(geometry, material);

    this.position.copy(position);
    this.speed = speed;
    this.attractionVelocity = Math.max(0, Math.min(0.3 * (5 - this.position.z), 0.3));
    console.log(this.attractionVelocity);


    this.mouseIn = false;
    this.center = new Vector2(0.5, 0.5);
    this.mousePosition = new Vector2(0.5, 0.5);
    this.littleBubblePosition = new Vector2(0.5, 0.5);
    this.littleBubbleForce = new Vector2();

    this.update = this.update.bind(this);

    this.scale.multiplyScalar(0.001);
  }

  /**
   * * **************
   * * ANIMATIONS
   * * **************
   */
  show () {
    const _d = {
      scale: this.scale.x,
    };

    TweenLite.to(_d, 0.8, {
      scale: 1,
      ease: Elastic.easeOut.config(1, 0.75),
      onUpdate: () => {
        this.scale.set(_d.scale, _d.scale, _d.scale);
      },
    });
  }

  /**
   * * **************
   * * UPDATE
   * * **************
   */
  update () {
    // Get mouse force
    const vecForce = this.mousePosition.clone().sub(this.littleBubblePosition);
    const force = Math.max(BUBBLE_MOUSE_DIST - vecForce.length(), 0) * BUBBLE_MOUSE_VELOCITY;
    this.littleBubbleForce.add(vecForce.multiplyScalar(force));
    // Apply mouse force and decrement him
    this.littleBubblePosition.add(this.littleBubbleForce);
    this.littleBubbleForce.multiplyScalar(BUBBLE_FORCE_FRICTION);
    // Apply gravity force (to the center)
    this.littleBubblePosition.add(this.center.clone().sub(this.littleBubblePosition).multiplyScalar(BUBBLE_GRAVITY_VELOCITY));

    // update material
    this.material.uniforms.littleBubblePosition.value = this.littleBubblePosition;

    // MOUVEMENT
    this.position.y += this.speed;

    if (this.mouseIn) {
      this.position.x += this.littleBubbleForce.x * this.attractionVelocity;
      this.position.y += this.littleBubbleForce.y * this.attractionVelocity;
    }
  }

  /**
   * * *******************
   * * MOUSE HANDLING
   * * *******************
   */
  // get an intersect.uv vector
  handleMouseMove (uv) {
    this.mouseIn = true;
    this.mousePosition = uv;
  }

  // init the mouse position to the center
  mouseOut () {
    this.mouseIn = false;
    this.mousePosition.set(0.5, 0.5);
  }
}
