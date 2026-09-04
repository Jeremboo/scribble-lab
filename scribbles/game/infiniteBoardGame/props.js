import { Vector3 } from 'three';
export default {
  debug: true,
  // colors
  bgColors:      ['#2D1A14', '#142420', '#2A1E10', '#1A2014'],
  outlineColors: ['#7A5A52', '#4A6B63', '#7A6B48', '#5A6648'],
  neutralColors: ['#F8D6C4', '#D4E6E0', '#F5E8C0', '#E4E8C8'],
  pathColors:    ['#C94B5A', '#4F9A8E', '#E0B84A', '#6F8F4E'],
  pawnColors:    ['#7DB8AB', '#F0D56A', '#8FB87A', '#D4687A'],
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
  initialCameraProps: {
    y: 0.95,
    offset: new Vector3(0, -2, 0),
    rotation: -Math.PI * 0.75,
    distance: 45,
  },
  inGameCameraProps: {
    y: 0.62,
    offset: new Vector3(0, 3, 0),
    rotation: -Math.PI * 0.75,
    distance: 55,
  },
  // animation
  velocity: 0.1,
  nextBoardDuration: 50,

  lootChance: 0.15,

};