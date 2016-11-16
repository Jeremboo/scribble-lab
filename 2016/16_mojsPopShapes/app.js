const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const elEchoes = document.getElementById('echoes');
const elShapes = document.getElementById('shapes');

const SHAPES = [
  {
    shape:      'rect',
    stroke:     '#FA6B6E',
  },{
    shape:      'circle',
    stroke:     'rgb(80, 103, 186)',
  },{
    shape:      'polygon',
    stroke:     'rgb(240, 142, 26)',
  },
  // ...
];

const createShape = (id, opts = {}) => {
  opts = Object.assign({ x: '50%', y: '50%', duration: 2000, rotation: 360, delay: 0 }, opts);
  const ECHO_OPTS = {
    parent: elEchoes,
    fill:         'none',
    strokeWidth:  { 15 : 0 },
    stroke:       '#E4D3EB',
    duration:     500,
    top:          opts.y,
    left:         opts.x,
  };
  const POS = {
    x:            getRandomInt(-200, 200),
    y:            getRandomInt(-200, 200),
  };

  let key = 0;
  const moveTo = dist => {
    let oldKey = key;
    key += dist;
    return {
      duration:   opts.duration * dist,
      angle:      { [opts.rotation * oldKey]    : opts.rotation * key, easing: 'linear.none' },
      x:          { [(oldKey === 0) ? 0 : 'to'] : POS.x * key,         easing: 'linear.none' },
      y:          { [(oldKey === 0) ? 0 : 'to'] : POS.y * key,         easing: 'linear.none' },
    };
  };

  const echo1 = new mojs.Shape({
    ...ECHO_OPTS,
    radius:       { 0 : 100 },
    duration:     600,
  });
  const echo2 = new mojs.Shape({
    ...ECHO_OPTS,
    radius:       { 0 : 80 },
    duration:     600,
    delay:        150,
  });
  const shape = new mojs.Shape({
    ...SHAPES[id],
    ...moveTo(0.25),
    parent: elShapes,
    fill:         'none',
    radius:       20,
    strokeWidth:  8,
    strokeDasharray: '100%',
    strokeDashoffset: { '-100%' : '0' },
    delay:        100,
    top:          opts.y,
    left:         opts.x,
  }).then({
    ...moveTo(0.5),
    strokeDasharray: false,
  }).then({
    ...moveTo(0.25),
    strokeDasharray: false,
    opacity:      { 1 : 0 },
  });

  return new mojs.Timeline({ delay: opts.delay }).add(echo1, echo2, shape);
};

const popShapes = (x = (window.innerWidth / 2), y = (window.innerHeight / 2)) => {
  const timeline = new mojs.Timeline();
  timeline.add(createShape(getRandomInt(0, SHAPES.length - 1), { x, y }));

  const length = getRandomInt(2, 5);
  for( let i = 1; i < length; i++){
    timeline.add(createShape(
      getRandomInt(0, SHAPES.length - 1),
      {
        x: x + getRandomInt(-50, 50),
        y: y + getRandomInt(-50, 50),
        delay: getRandomInt(100, 200) + (i * 300),
      },
    ));
  }
  return timeline;
};

// START

const margin = 100;

function pop(i = 3) {
  popShapes(getRandomInt(margin, window.innerWidth - margin),getRandomInt(margin, window.innerHeight - margin)).play();
  if (i !== 0) {
    setTimeout(() => {
      pop(i - 1);
    }, 200);
  }
}
pop();

document.body.addEventListener('click', (e) => { popShapes(e.clientX, e.clientY).play(); });

// const player = new MojsPlayer({ add: popShapes() });
// new MojsPlayer({ add: createShape(0) });
