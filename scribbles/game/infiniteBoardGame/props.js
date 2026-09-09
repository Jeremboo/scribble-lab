import { Vector3 } from 'three';
export default {
  debug: true,
  // colors
  bgColors:       ['#34241F', '#1A322E', '#342C14', '#203226'],
  outlineColors:  ['#B08A78', '#6E9488', '#B09A5C', '#7A9070'],
  neutralColors:  ['#F6EFE6', '#E8F0EC', '#F4F0DC', '#ECF0E6'],
  pathColors:     ['#E04E3A', '#2A8F7E', '#E0A820', '#6B8F3E'],
  pawnColors:     ['#6ED4C4', '#F0D060', '#9ED46E', '#8EB4E8'],
  fogNearColor: '#4d3207',
  fogFarColor: '#181200',
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
  // atmosphere
  fogNear: 70,
  fogFar: 90,
  // animation
  velocity: 0.1,
  nextBoardDuration: 50,

  lootChance: 0.15,

};