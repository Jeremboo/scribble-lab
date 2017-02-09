import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import dat from 'dat-gui';

window.React = React;

const CONST = {
  SCALE: 15,  // 5
  BASE_FREQUENCY: 0.04, // 0.03
  NUM_OCTAVE: 3,
  TYPE: 'fractalNoise', // fractalNoise | turbulence
  FREQ: 50,
};

const gui = new dat.GUI();
gui.add(CONST, 'SCALE', 0, 50);
gui.add(CONST, 'BASE_FREQUENCY', 0, 1.0);
gui.add(CONST, 'NUM_OCTAVE', 1, 5).step(1);
gui.add(CONST, 'TYPE', ['fractalNoise', 'turbulence']);
gui.add(CONST, 'FREQ', 25, 500);


const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);

class SquigglyContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      id: 0,
      seed: 0,
      scale: 2,
      baseFrequency: 0.02,
      numOctaves: 3,
      type: 'turbulence',
    };

    this.loop = this.loop.bind(this);
  }

  componentDidMount() {
    this.loop();
  }

  loop() {
    const id = this.state.id + 1;
    this.setState({
      id,
      seed: id,
      scale: CONST.SCALE,
      baseFrequency: CONST.BASE_FREQUENCY,
      numOctaves: CONST.NUM_OCTAVE,
      type: CONST.TYPE,
    });
    setTimeout(this.loop, CONST.FREQ);
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
  const { baseFrequency, numOctaves, type, seed, scale } = props;
  const turbulenceProps = {
    baseFrequency,
    numOctaves,
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
};
Squiggly.defaultProps = {
  baseFrequency: 0.02,
  numOctaves: 3,
  seed: 0,
  scale: 2,
  type: 'turbulence',
};

ReactDOM.render(
  <SquigglyContainer>
    <div className="content">
      <h1 className="title">Codevember</h1>
      <p className="subtitle">day 2</p>
    </div>
    <p className="f">
      <a target="_blank" href="http://www.jeremieboulay.fr">@Jeremboo</a>
      <br /> ┗|｀O´|┛
    </p>
  </SquigglyContainer>,
  document.getElementById('app')
);
