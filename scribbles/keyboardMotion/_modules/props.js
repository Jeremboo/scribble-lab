import dat from 'dat.gui/build/dat.gui';

export const gui = new dat.GUI();
gui.close();

export const props = {
  skewXMax: 45,
  skewYMax: 0,
  distordXMax: 45,
  distordYMax: 45,
  scaleZ: 3,
  showRedMarkers: true,
  showBlueMarkers: true,
  pressureTimeMax: 1500,
  sizeMax: 200,
  sizeMin: 36,
};

/**
 ************
 * TRANSFORM V2
 ************
 */
export const updateTransform = (elm) => {
  elm.style.transform = `skewX(${
    (0.5 - elm.getAttribute('data-x')) * props.skewXMax
  }deg) skewY(${
    (0.5 - elm.getAttribute('data-y')) * props.skewYMax
  }deg) perspective(100px) scaleZ(${
    props.scaleZ
  }) rotateX(${
    -(0.5 - elm.getAttribute('data-y')) * props.distordYMax
  }deg) rotateY(${
    (0.5 - elm.getAttribute('data-x')) * props.distordXMax
  }deg)`;
  const pressureDuration = elm.getAttribute('data-pressureTime') / props.pressureTimeMax;
  elm.style.fontSize = `${Math.min(props.sizeMin + (pressureDuration * props.sizeMax), props.sizeMax)}px`;
};

/**
 ************
 * MARKERS
 ************
 */
const markerFolder = gui.addFolder('Markers');
const showRedMarkers = markerFolder.add(props, 'showRedMarkers');
showRedMarkers.onChange(() => {
  document.body.classList.toggle('_hideRedMarkers');
});
const showBlueMarkers = markerFolder.add(props, 'showBlueMarkers');
showBlueMarkers.onChange(() => {
  document.body.classList.toggle('_hideBlueMarkers');
});

/**
 ************
 * LETTER TRANSFORM
 ************
 */
function updateCharacters() {
  const chars = document.querySelectorAll('.character span');
  let i;
  for (i = 0; i < chars.length; i++) {
    updateTransform(chars[i]);
  }
}

const letterFolder = gui.addFolder('Letters');
const skewXMax = letterFolder.add(props, 'skewXMax', 0, 180);
skewXMax.onChange(updateCharacters);
const distordXMax = letterFolder.add(props, 'distordXMax', 0, 180);
distordXMax.onChange(updateCharacters);
const distordYMax = letterFolder.add(props, 'distordYMax', 0, 180);
distordYMax.onChange(updateCharacters);
const scaleZ = letterFolder.add(props, 'scaleZ', 0, 10);
scaleZ.onChange(updateCharacters);
// const skewYMax = letterFolder.add(props, 'skewYMax', 0, 180);
// skewYMax.onChange(updateCharacters);

const sizeMax = letterFolder.add(props, 'sizeMax', props.sizeMin, 500);
sizeMax.onChange(updateCharacters);
