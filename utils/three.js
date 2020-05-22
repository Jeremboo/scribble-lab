import { Vector3, Euler, Raycaster } from 'three';

export const getNormalizedPosFromScreen = (x, y) => new Vector3(
  ((x / window.innerWidth) * 2) - 1,
  -((y / window.innerHeight) * 2) + 1,
  0.5,
);

// https://stackoverflow.com/questions/13055214/mouse-canvas-x-y-to-three-js-world-x-y-z
export const getDistanceBetweenNormalizedMousePosAndPos = (normalizedMousePos, pos, camera) => {
  const nm = normalizedMousePos.clone()
  nm.unproject(camera);
  const dir = nm.sub(camera.position).normalize();
  const distance = (pos.z - camera.position.z) / dir.z;
  const mousePos = camera.position.clone().add(dir.multiplyScalar(distance));
  return pos.clone().sub(mousePos);
};

// https://www.gamedev.net/forums/topic/95637-random-point-within-a-sphere/
export const getrandomPosWithinASphere = (r) => {
  const theta = getRandomFloat(0, Math.PI * 2);
  const phi = getRandomFloat(-Math.PI * 0.5, Math.PI * 0.5);
  return new Vector3(
    r * Math.cos(theta) * Math.cos(phi),
    (r * 0.9) * Math.sin(phi),
    r * Math.sin(theta) * Math.cos(phi),
  );
};

/**
 * https://stackoverflow.com/questions/40485197/turning-random-cube-to-random-sphere-in-three-js?rq=1
 * @param {number} r
 */
export const getRandomPosAroundASphere = (r) => {
  return new Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5).normalize().multiplyScalar(r);
};

/**
 * Ty Robin <3
 * https://codepen.io/robin-dela/pen/dZXVrQ?editors=0010
 * https://threejs.org/docs/#api/core/Raycaster
 * @param {PerspectiveCamera|OrthographicCamera} camera
 * @param {Array<Object3D>} sceneChildren
 * @param {(Array<Intersection>, Vector2) => null} callback
 * @param {Mesh} targetedMesh
 */
export const onCursorTouchMeshes = (camera, sceneChildren = [], callback, targetedMesh) => {
  const raycaster = new Raycaster();
  const moveEvent = 'ontouchstart' in (window || navigator.msMaxTouchPoints) ? 'touchmove' : 'mousemove';
  window.addEventListener(moveEvent, (e) => {
    const mouseVec = getNormalizedPosFromScreen(
      e.clientX || e.touches[0].clientX,
      e.clientY || e.touches[0].clientY,
    );

    raycaster.setFromCamera(mouseVec, camera);
    const intersects = raycaster.intersectObjects(sceneChildren);
    if (!targetedMesh) {
      callback(intersects, mouseVec);
    } else {
      let i = 0;
      let targetedObjectIntersected = false;
      while (i < intersects.length && !targetedObjectIntersected) {
        if (intersects[i].object.uuid === targetedMesh.uuid) {
          targetedObjectIntersected = true;
          callback(intersects[i], mouseVec);
        }
        i += 1;
      }
    }
  });
};

/**
 * Get the width and the height of the field size from a specific distance
 * @param {Vector3} position
 * @param {PerspectiveCamera|OrthographicCamera} camera
 */
export const getCameraVisionFieldSizeFromPosition = (position = new Vector3(), camera) => {
  // (2 * Math.tan(radians(camera.fov) / 2)) => Always the same number. Can be optimized
  const height = (2 * Math.tan(radians(camera.fov) / 2)) * (camera.position.distanceTo(position));
  const width = camera.aspect * height;
  return {
    width,
    height,
  };
};

/**
 * Get a random Rotation
 */
export const getRandomEuler = () => new Euler(
  getRandomFloat(0, Math.PI * 2),
  getRandomFloat(0, Math.PI * 2),
  getRandomFloat(0, Math.PI * 2),
);
