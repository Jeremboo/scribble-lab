import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

window.React = React;

// http://codepen.io/davidkpiano/pen/wMqXea

const MAX_BASE_FREQUENCY = 100;
const MAX_NUM_OCTAVE = 10;
const MAX_SEED = 10;
const MAX_SCALE = 50;
const TYPE = 'turbulence'; // fractalNoise | turbulence
const STITCH_TILES = 'stitch'; // noStitch | stitch

const FREQ = 50;


const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);

class SquigglyContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      id: 0,
      baseFrequency: 0.02,
      numOctaves: 3,
      seed: 0,
      scale: 2,
      type: 'turbulence',
      stitchTiles: 'noStitch',
    };
  }

  componentDidMount() {
    setInterval(() => {
      this.setState({
        id: this.state.id + 1,
        baseFrequency: getRandomFloat(0, MAX_BASE_FREQUENCY),
        numOctaves: getRandomInt(0, MAX_NUM_OCTAVE),
        seed: getRandomFloat(0, MAX_SEED),
        scale: getRandomFloat(0, MAX_SCALE),
        stitchTiles: STITCH_TILES,
        type: TYPE,
      });
    }, FREQ);
  }

  render() {
    return (
      <div style={{ filter: `url('#squiggly-${this.state.id}')` }}>
        <Squiggly id={this.state.id} {...this.state} />
        {this.props.children}
      </div>
    );
  }
}
SquigglyContainer.propTypes = {
  children: React.PropTypes.node,
};
SquigglyContainer.defaultProps = {
  children: null,
};

const Squiggly = (props) => {
  const { baseFrequency, numOctaves, stitchTiles, type, seed, scale } = props;
  const turbulenceProps = {
    baseFrequency,
    numOctaves,
    stitchTiles,
    type,
    seed,
  };
  const displacementMapProps = {
    scale,
  };

  return (
    <svg style={{ display: 'none' }} >
      <defs>
        <filter id={`squiggly-${props.id}`} >
          <feTurbulence
            {...turbulenceProps}
            result="noise"
          />
          <feDisplacementMap
            {...displacementMapProps}
            in="SourceGraphic"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};
Squiggly.propTypes = {
  id: PropTypes.number.isRequired,
  baseFrequency: PropTypes.number,
  numOctaves: PropTypes.number,
  seed: PropTypes.number,
  scale: PropTypes.number,
  type: PropTypes.string,
  stitchTiles: PropTypes.string,
};
Squiggly.defaultProps = {
  baseFrequency: 0.02,
  numOctaves: 3,
  seed: 0,
  scale: 2,
  type: 'turbulence',
  stitchTiles: 'noStitch',
};

ReactDOM.render(
  <SquigglyContainer>
    <div className="content squiggly">
      <h1 className="title">Codevember</h1>
      <p className="subtitle">day 2</p>
    </div>
  </SquigglyContainer>,
  document.getElementById('app')
);
