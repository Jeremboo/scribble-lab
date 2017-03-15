import dat from 'dat.gui/build/dat.gui';

export const gui = new dat.GUI();
gui.close();

export const props = {
  skewXMax: 45,
  skewYMax: 0,
  distordXMax: 45,
  distordYMax: 45,
  scaleZ: 3,
  pressureTimeMax: 1500,
  sizeMax: 200,
  sizeMin: 36,
  showKeyboard: true,
  showRedMarkers: true,
  showBlueMarkers: true,
};

/**
 ************
 * MARKERS
 ************
 */
const markerFolder = gui.addFolder('Markers');
const showKeyboard = markerFolder.add(props, 'showKeyboard');
showKeyboard.onChange(() => {
  document.getElementById('wrapper').classList.toggle('hidden');
});
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
let updateLetter = f => f;
export const onUpdateLetters = (callback = f => f) => {
  updateLetter = callback;
};

function updateCharacters() {
  const chars = document.querySelectorAll('.character span');
  let i;
  for (i = 0; i < chars.length; i++) {
    updateLetter(chars[i]);
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

export const sizeMax = letterFolder.add(props, 'sizeMax', 1, 500);
sizeMax.onChange(updateCharacters);
