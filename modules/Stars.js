import { TetrahedronBufferGeometry, Mesh, ShaderMaterial, Color } from 'three';

import InstancedGeom from './InstancedGeom';
import { getRandomFloat } from './utils';

/**
 * * *******************
 * * MAIN
 * * *******************
 */

const starGeometry = new TetrahedronBufferGeometry(1, 0);

export default class Starts extends Mesh {
  constructor(nbrOfStars = 300) {
    const instanciedStars = new InstancedGeom(starGeometry, nbrOfStars);

    // PROPS
    const positionAttribute = instanciedStars.createAttribute('_position', 3);
    const scaleAttribute = instanciedStars.createAttribute('_scale', 1);
    const rotationAttribute = instanciedStars.createAttribute('_rotation', 1);

    for (let i = 0; i < nbrOfStars; i++) {
      const scalar = getRandomFloat(2, 10);
      positionAttribute.setXYZ(
        i,
        Math.random() * Math.sign(Math.random() - 0.5) * scalar,
        Math.random() * Math.sign(Math.random() - 0.5) * scalar,
        Math.random() * Math.sign(Math.random() - 0.5) * scalar
      );
      scaleAttribute.setX(i, getRandomFloat(0.03, 0.05));
      rotationAttribute.setX(i, Math.PI * Math.random() * 2);
    }

    // Material
    const material = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.75 },
        color: { value: new Color('#ffffff') }
      },
      vertexShader: `
      attribute float _scale;
      attribute vec3 _position;
      attribute float _rotation;

      uniform float time;

        void main() {
          #include <begin_vertex>

            mat4 rotationMatrix = mat4(
              vec4(cos(_rotation), -sin(_rotation), 0.0, 0.0),
              vec4(sin(_rotation), cos(_rotation), 0.0, 0.0),
              vec4(0.0, 0.0, 1.0, 0.0),
              vec4(0.0, 0.0, 0.0, 1.0)
          );

          float scale = _scale * sin(_scale * 100. + time);

          mat4 scaleMatrix = mat4(
            vec4(scale, 0.0, 0.0, 0.0),
            vec4(0.0, scale, 0.0, 0.0),
            vec4(0.0, 0.0, scale, 0.0),
            vec4(0.0, 0.0, 0.0, 1.0)
          );

          transformed = (rotationMatrix * scaleMatrix * vec4((position), 1.0)).xyz;
          transformed += _position;

          #include <project_vertex>
        }
      `,
      fragmentShader: `
        uniform float opacity;
        uniform vec3 color;
        uniform float time;
        void main() {
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true
    });

    super(instanciedStars, material);

    this.update = this.update.bind(this);
  }
  update() {
    this.material.uniforms.time.value += 0.01;
  }
}
