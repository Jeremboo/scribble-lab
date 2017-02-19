import { GUI } from 'dat.gui/build/dat.gui';

const props = {
  SCALE: 10,
  AMPL: 0.3,
  SPEED: 0.01,
  COLOR: '#90A2BF',
  FOG_COLOR: '#DD0606',
  FOG_NEAR: 0.1,
  FOG_FAR: 10,
};

const gui = new GUI();
gui.add(props, 'SCALE', 1, 20);
gui.add(props, 'AMPL', 0.01, 2);
gui.add(props, 'SPEED', 0.01, 0.05);
gui.addColor(props, 'COLOR');
gui.addColor(props, 'FOG_COLOR');
gui.add(props, 'FOG_NEAR', 0, 1);
gui.add(props, 'FOG_FAR', 1, 100);

export default props;
