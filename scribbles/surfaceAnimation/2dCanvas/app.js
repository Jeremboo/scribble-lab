import { Noise } from 'noisejs'
import TweenLite from 'gsap'

import SurfaceAnimation from 'SurfaceAnimation';

const SHUFFLING_VALUES = [
  '!', '§', '$', '%',
  '&', '/', '(', ')',
  '=', '?', '_', '<',
  '>', '^', '°', '*',
  '#', '-', ':', ';', '~',
];

const WORDS = [
  ' 01    Tolyblood                         2017',
  ' 02    Oho\'s The King                    2017',
  ' 03    Naypal                            2017',
  ' 04    Yentrée                           2017',
  ' 05    Jhibuya K                         2017',
  ' 06    Epdate Required                   2016',
  ' 07    Tonfiance                         2016',
  ' 08    Auibus                            2016',
  ' 09    Iroupie Resistance                2016',
  ' 10    Mnicef                            2016',
  ' 11    Eicochet                          2016',
  ' 12    Mori                              2015',
  ' 13    Ship Food                         2014',
  ' 14    Triggers                          2014',
  ' 15    Gobelins Sound Experiments        2014',
  ' 16    Luminaria                         2014',
  ' 17    Odissey                           2014',
  ' 18    Sauna                             2012',
  ' 19    Atmosphere                        2012',
  ' 20    Polymorphisme                     2012',
  '                                             ',
  ' A1    About                                 ',
];

// START
const surfaceAnimation = new SurfaceAnimation(
  WORDS,
  document.getElementById('wrapper'),
  {
    duration: 1,
  },
);

surfaceAnimation.initHelper();

// init threshold values
const noise = new Noise(20)
surfaceAnimation.setThresholdSurface((idx2) => {
  let value = 0;
  let min = 0.1;
  // ------------------- Gradient 45°
  // value = ((idx2.x / surfaceAnimation.width) * 0.5) + ((idx2.y / surfaceAnimation.height) * 0.5);
  // ------------------- Simplex noise / 25
  min = 0.5
  value = (Math.abs(noise.simplex2(idx2.x / 25, idx2.y / 25)) * 0.2)
  // ------------------- Simplex noise / 60 + seuil
  // min = 0.5
  // value = (Math.abs(noise.simplex2(idx2.x / 80, idx2.y / 80)) * 0.5)
  // ------------------- Simplex noise / 25 + gradient X
  // min = 0.5
  // value = (Math.abs(noise.simplex2(idx2.x / 25, idx2.y / 25)) * 0.2) + ((idx2.x / surfaceAnimation.width) * 0.2)
  return min + value;
});

// STYLE
surfaceAnimation.parseCellSurface((cell, idx2) => {
  if (idx2.x < 4 || idx2.x > surfaceAnimation.width - 5) {
    cell.style.color = '#dd0958'
  }
});

surfaceAnimation.setRules((threshold, cell, t) => {
  const value = cell.getAttribute('data-content');
  if (t >= threshold) {
    cell.innerHTML = value;
  } else if (t >= threshold - 0.3) {
    cell.style.backgroundColor = 'transparent';
    if (value !== ' ') {
      cell.innerHTML = SHUFFLING_VALUES[Math.floor(Math.random() * SHUFFLING_VALUES.length)];
      cell.style.transform = `scale(${1 - (threshold - t)})`
      cell.style.opacity = 1 - (threshold - t) * 2
    }
  } else if (t >= threshold - 0.5) {
    cell.style.opacity = 1 - (threshold - t) * 2
    cell.style.backgroundColor = '#6C3D6C';
  }
});

setTimeout(() => {
  surfaceAnimation.play();
}, 500);
