import { Vector3 } from 'three';
import gsap from 'gsap';
import props from './props';

export default class MainCamera {
  constructor(camera) {
    this.camera = camera;

    this.target = new Vector3(); // Orbit center for camera.position
    this.lookAtTarget = new Vector3(); // Offset from target — drives lookAt independently
    this._lookAt = new Vector3();

    this.props = {
      y: props.initialCameraProps.y * 1.25,
      rotation: props.initialCameraProps.rotation,
      distance: props.initialCameraProps.distance * 1.2,
      offset: props.initialCameraProps.offset.clone(),
    }

    this.update = this.update.bind(this);
    this.update();
  }

  animateCameraProps(newProps, duration = 1) {
    const offset = newProps.offset || this.props.offset;
    const tweenProps = {
      duration,
      ease: 'power2.out',
    };

    gsap.to(this.props, {
      ...tweenProps,
      y: newProps.y || this.props.y,
      rotation: newProps.rotation || this.props.rotation,
      distance: newProps.distance || this.props.distance,
      onUpdate: () => {
        this.update();
      },
    });

    gsap.to(this.props.offset, {
      ...tweenProps,
      x: offset.x,
      y: offset.y,
      z: offset.z,
    });
  }

  animateCameraTarget(newPos, duration = 1, delay = 0) {
    gsap.to(this.target, {
      x: newPos.x,
      y: newPos.y,
      z: newPos.z,
      duration,
      ease: 'power2.inout',
      onUpdate: () => {
        this.update();
      },
      delay,
    });
  }

  /** Animate lookAt as an offset from `this.target` (rotation only). */
  animateLookAtTarget(offset, duration = 1, delay = 0) {
    gsap.to(this.lookAtTarget, {
      x: offset.x,
      y: offset.y,
      z: offset.z,
      duration,
      ease: 'power2.inout',
      onUpdate: () => {
        this.update();
      },
      delay,
    });
  }

  update() {
    this.camera.position.set(
      this.target.x + Math.cos(this.props.rotation) * this.props.distance + this.props.offset.x,
      this.target.y + Math.tan(this.props.y) * this.props.distance + this.props.offset.y,
      this.target.z + Math.sin(this.props.rotation) * this.props.distance + this.props.offset.z
    );
    this._lookAt.copy(this.target).add(this.lookAtTarget).add(this.props.offset);
    this.camera.lookAt(this._lookAt);
  }
}
