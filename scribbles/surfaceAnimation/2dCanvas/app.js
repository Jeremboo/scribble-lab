import { Noise } from 'noisejs'

import SurfaceAnimation from '../_modules/SurfaceAnimation';

const SHUFFLING_VALUES = [
  '!', '§', '$', '%',
  '&', '/', '(', ')',
  '=', '?', '_', '<',
  '>', '^', '°', '*',
  '#', '-', ':', ';', '~',
];

const WORDS = [
  ' ++   -------------------------------   ++',
  ' ++                                     ++',
  ' ++     Tolyblood                       ++',
  ' ++     Oho\'s The King                  ++',
  ' ++     Naypal                          ++',
  ' ++     Yentrée                         ++',
  ' ++     Jhibuya K                       ++',
  ' ++     Epdate Required                 ++',
  ' ++     Tonfiance                       ++',
  ' ++     Auibus                          ++',
  ' ++     Iroupie Resistance              ++',
  ' ++     Mnicef                          ++',
  ' ++     Eicochet                        ++',
  ' ++                                     ++',
  ' ++   -------------------------------   ++',
];

const wrapper = document.createElement('div');
wrapper.id = 'wrapper';
document.body.append(wrapper);

// START
const surfaceAnimation = new SurfaceAnimation(
  WORDS,
  document.getElementById('wrapper'),
  {
    duration: 2,
  },
);

surfaceAnimation.initHelper();

// init threshold values
const noise = new Noise(20)
surfaceAnimation.setThresholdSurface((idx2) => {
  let value = 0;
  let min = 0.1;
  /* ------------------- Gradient 45° */
  // value = ((idx2.x / surfaceAnimation.width) * 0.5) + ((idx2.y / surfaceAnimation.height) * 0.5);
  /* ------------------- Simplex noise / 25 */
  // min = 0.5
  // value = (Math.abs(noise.simplex2(idx2.x / 25, idx2.y / 25)) * 0.2)
  /* ------------------- Simplex noise / 60 + seuil */
  min = 0.5
  value = (Math.abs(noise.simplex2(idx2.x / 80, idx2.y / 80)) * 0.5)
  /* ------------------- Simplex noise / 25 + gradient X */
  // min = 0.5
  // value = (Math.abs(noise.simplex2(idx2.x / 25, idx2.y / 25)) * 0.2) + ((idx2.y / surfaceAnimation.width) * 0.2)
  return min + value;
});

// STYLE
surfaceAnimation.parseCellSurface((cell, idx2) => {
  if (idx2.x < 4 || idx2.x > surfaceAnimation.width - 5 || idx2.y === 0 || idx2.y === WORDS.length - 1) {
    cell.style.color = '#4BC5FA'
  }
});

surfaceAnimation.setRules((threshold, cell, t) => {
  const value = cell.getAttribute('data-content');
  const percent = Math.min(1, 1 - (threshold - t));
  /* ------------------- Width (to animate the size) */
  // cell.style.width = `${percent * 0.8}em`
  if (t >= threshold) {
    cell.innerHTML = value;
  } else if (t >= threshold * 0.8) {
    // Init transparent value
    cell.style.backgroundColor = 'transparent';
    if (value !== ' ') {
      cell.innerHTML = SHUFFLING_VALUES[Math.floor(Math.random() * SHUFFLING_VALUES.length)];

      /* ------------------- Transform scale */
      cell.style.transform = `scale(${percent})`
      /* ------------------- Opacity */
      cell.style.opacity = percent
    }
  } else if (t >= threshold * 0.6) {
    /* ------------------- Opacity */
    // cell.style.opacity = (1 - percent) * 2
    /* ------------------- BackgroundColor */
    cell.style.backgroundColor = '#909EC6';
  }
});

setTimeout(() => {
  surfaceAnimation.play();
}, 500);
