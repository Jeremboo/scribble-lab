export default {
  debug: true,
  // colors
  bgColor: '#2D1A14',
  outlineColor: '#70584A',
  neutralColor: '#F8D6C4',
  pathColors: ['#B44351', '#63928A', '#DDC66B', '#7A8852'],
  pawnColors: ['#7DB8AB', '#F7DD76', '#A2B870', '#CD5974'],
  // board noise
  noiseX: 0,
  noiseY: 4.5,
  noiseScaleX: 0.1,
  noiseScaleY: 0.1,
  noiseAmpl: 5.5,
  noisePathElevation: 0.43,
  // hill noise (large rolling hills along the path — keeps detail noise above)
  hillNoiseX: 0,
  hillNoiseY: 0,
  hillNoiseScaleX: 0.006,
  hillNoiseScaleY: 0.007,
  hillNoiseAmpl: 60,
  // ground curve — left / right of the path (sides rise + stronger noise)
  groundCurveHeightLeft: 12,
  groundCurveRadiusLeft: 8.8,
  groundCurveHeightRight: 10,
  groundCurveRadiusRight: 2,
  groundNoiseAmplSideLeft: 3.5,
  groundNoiseAmplSideRight: 3.5,
  // board size
  boardWidth: 5,
  boardHeight: 15,
  boardPadding: 1,
  // initial camera position
  initialCameraOffsetY: 0,
  initialCameraY: 30,
  // camera position
  cameraOffsetY: 3,
  cameraY: 14.454,
  cameraZoomOut: 22,
  cameraZoom: 15.5, // gameplay / debug ortho zoom (higher = further)
  rotationSpeed: 0, // 0.001,
  // animation
  velocity: 0.1,
  maxCount: 14 + 11 * 10,
  advanceDuration: 50,

};