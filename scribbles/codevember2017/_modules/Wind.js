import {
  Mesh, Color, Vector3, SplineCurve, Path, Object3D,
} from 'three';

import { MeshLine, MeshLineMaterial } from 'three.meshline';

import { getRandomFloat } from 'utils';

import { GUI } from 'dat.gui';
const gui = new GUI();

const props = {
  LINE_SPEED: 0.003,
  LINE_TURBULENCE: 1.3,
  LINE_WIDTH: 0.2,
  LINE_VISIBLE_LENGTH: 0.9,
  LINE_LENGTH_MAX: 2,
  LINE_OPACITY: 1,
  LINE_NBR_OF_POINTS_MAX: 5,
};

export class WindLine extends Mesh {
  constructor({
    width = 1,
    nbrOfPoints = getRandomFloat(3, props.LINE_NBR_OF_POINTS_MAX),
    length = getRandomFloat(0.5, props.LINE_LENGTH_MAX),
    disruptedOrientation = getRandomFloat(-0.2, 0.2),
    speed = props.LINE_SPEED,
    turbulence = 1.3,
  } = {}) {

    // Create the points of the line
    const points = [];
    const segmentLength = length / nbrOfPoints;
    points.push(new Vector3(0, 0, 0));
    for (let i = 1; i < nbrOfPoints; i++) {
      const pos = (segmentLength * i);
      points.push(new Vector3(
        (pos * disruptedOrientation) + getRandomFloat(-turbulence, turbulence),
        pos,
        0,
      ));
    }

    // Intance the geometry
    const curve = new SplineCurve(points);
    const path = new Path(curve.getPoints(50));
    const geometry = path.createPointsGeometry(50);

    const line = new MeshLine();
    line.setGeometry(geometry);

    // Material
    const dashArray = 2;
    const dashRatio = props.LINE_VISIBLE_LENGTH;
    const dashOffsetRight = 1.01;
    const dashOffsetLeft = dashArray * dashRatio;
    super(line.geometry, new MeshLineMaterial({
      lineWidth: width,
      dashArray,
      dashRatio,
      dashOffset: dashOffsetLeft,
      opacity: 0,
      transparent: true,
      depthWrite: false,
      color: new Color('#00ff00'),
    }));

    this.position.set(
      getRandomFloat(-10.8, 10),
      getRandomFloat(-6, 5),
      getRandomFloat(-2, 1),
    );

    this.speed = speed;
    this.dying = dashOffsetRight;
    this.update = this.update.bind(this);
  }

  update() {
    this.material.uniforms.dashOffset.value -= this.speed;

    const opacityTargeted = this.material.uniforms.dashOffset.value > (this.dying + 0.25) ? props.LINE_OPACITY : 0;
    this.material.uniforms.opacity.value += (opacityTargeted - this.material.uniforms.opacity.value) * 0.08;
  }

  isDied() {
    return this.material.uniforms.dashOffset.value < this.dying;
  }
}

export default class Wind extends Object3D {
  constructor(_props) {
    super();

    this.props = Object.assign({
      speed: 0.003,
      frequency: 0.9,
      turbulence: 1.3,
      disruptedOrientation: getRandomFloat(-0.2, 0.2),
      width: 0.2,
      length: 0.9,
      opacity: 1,
    }, _props);

    this.lines = [];
    this.lineNbr = -1;

    this.update = this.update.bind(this);

    // *********
    // GUI
    // try {
    //   const lineFolder = gui.addFolder('Lines');
    //   lineFolder.add(this, 'frequency', 0, 1).name('FREQUENCY');
    //   lineFolder.add(props, 'LINE_OPACITY', 0, 1).name('OPACITY');
    //   lineFolder.add(props, 'LINE_WIDTH', 0, 0.4).name('WIDTH');
    //   lineFolder.add(props, 'LINE_VISIBLE_LENGTH', 0.85, 0.99).name('LENGTH');
    //   lineFolder.add(this, 'speed', 0, 0.01).name('SPEED');
    //   lineFolder.add(this, 'turbulences', 0, 4).name('TURBULENCE');
    //   lineFolder.add(this, 'disruptedOrientation', 0, 0.5).name('DISRUPTED_ORIENTATION');
    //   lineFolder.add(props, 'LINE_NBR_OF_POINTS_MAX', 0, 10).name('POINTS_MAX');
    // } catch (e) {
    //
    // }
  }

  addWindLine() {
    const line = new WindLine(this.props);
    this.lines.push(line);
    this.add(line);
    this.lineNbr++;
  }

  removeWindLine() {
    this.remove(this.lines[0]);
    this.lines[0] = null;
    this.lines.shift();
    this.lineNbr--;
  }

  update() {
    if (Math.random() < this.props.frequency) {
      this.addWindLine();
    }

    let i;
    for (i = this.lineNbr; i >= 0; i--) {
      this.lines[i].update();

      if (this.lines[i].isDied()) {
        this.removeWindLine();
      }
    }
  }
}
