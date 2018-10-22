import { GUI } from 'dat.gui';

const props = {
  Y: 4,

  // SHAPE
  SHAPE_AMPLITUDE: 0.7,
  SHAPE_COMPLEXITY: 0.6,
  SHAPE_SPEED: -0.003,

  // COLOR
  COLOR_RANGE: 2,
  COLOR_COMPLEXITY: 0.5,
  COLOR_AMPLITUDE: 1.8,
  COLOR_SPEED: -0.005,
  COLOR_MAIN: '#27236e',
  COLOR_SECONDARY: '#8f2633',

  // ALPHA
  ALPHA_RANGE: 1.85,
  ALPHA_COMPLEXITY: 0.8,
  ALPHA_SPEED: -0.0046,

  // POSTPROCESS
  //  BLUR
  BLUR_RESOLUTION: 0.35,
  BLUR_KERNEL_SIZE: 3,
  //  NOISE
  NOISE_RANGE: 0.68,
  NOISE_BLACK_LAYER: 0.56,

  debug: {
    postProcess: {
      disabled: false,
    },
    orbitControlsMainCamera: true,
    webglHelper: false,
    disableWebgl: false,
  },
};

export default props;


export const gui = new GUI({ load: {
  preset: 'Default',
  remembered: {
    Default: {
      0: Object.assign({}, props),
    },
    jagged: {
      0: {
        Y: 0.3,
        BLUR_RESOLUTION: 0.5,
        BLUR_KERNEL_SIZE: 3,
        NOISE_RANGE: 0.6,
        NOISE_BLACK_LAYER: 0.99,
        SHAPE_AMPLITUDE: 1.8,
        SHAPE_COMPLEXITY: 1.1,
        SHAPE_SPEED: -0.0025,
        COLOR_RANGE: 1.4,
        COLOR_COMPLEXITY: 0.6,
        COLOR_SPEED: 0.001,
        ALPHA_RANGE: 0.9,
        ALPHA_COMPLEXITY: 1.6,
        ALPHA_SPEED: -0.00015,
      },
    },
    shadow: {
      0: {
        Y: 4,
        BLUR_RESOLUTION: 0.7969133637320238,
        BLUR_KERNEL_SIZE: 5,
        NOISE_RANGE: 1,
        NOISE_BLACK_LAYER: 1,
        SHAPE_AMPLITUDE: 0.7589178011373428,
        SHAPE_COMPLEXITY: 0.6706875753920386,
        SHAPE_SPEED: -0.003057039462347061,
        COLOR_MAIN: '#04003e',
        COLOR_SECONDARY: '#ffb2bc',
        COLOR_RANGE: 2.2833017404790628,
        COLOR_COMPLEXITY: 1.0015509219369292,
        COLOR_AMPLITUDE: 0.8736860244701017,
        COLOR_SPEED: -0.014526968809236603,
        ALPHA_RANGE: 0.8405996898156127,
        ALPHA_COMPLEXITY: 1.7294502843356885,
        ALPHA_SPEED: 0.007530587627089438,
      },
    },
  },
},
});
gui.remember(props);
