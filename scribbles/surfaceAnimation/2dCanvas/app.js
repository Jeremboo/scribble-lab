import SurfaceAnimation from 'SurfaceAnimation';
import { getRandomInt, getXBetweenTwoNumbersWithPercent } from 'utils'
import TweenLite from 'gsap'

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
    duration: 2,
  },
);

surfaceAnimation.initHelper();

surfaceAnimation.setThresholdSurface((idx2) => {
  return ((idx2.x / surfaceAnimation.width) * 0.5) + ((idx2.y / surfaceAnimation.height) * 0.5);
});


// STYLE
surfaceAnimation.parseCellSurface((cell, idx2) => {
  if (idx2.x < 4 || idx2.x > surfaceAnimation.width - 5) {
    cell.style.color = '#dd0958'
  }
});


surfaceAnimation.addRule((threshold, cell, t) => {
  const value = cell.getAttribute('data-content')
  if (t >= threshold) {
    cell.innerHTML = value
  } else if (t >= threshold - 0.1) {
    cell.style.backgroundColor = 'transparent'
    if (value !== ' ') {
      cell.innerHTML = SHUFFLING_VALUES[Math.floor(Math.random() * SHUFFLING_VALUES.length)];
    }
  } else if (t >= threshold - 0.2) {
    cell.style.backgroundColor = 'white'
  } else {
    cell.style.backgroundColor = 'transparent'
  }
});

setTimeout(() => {
  surfaceAnimation.play();
}, 500)
