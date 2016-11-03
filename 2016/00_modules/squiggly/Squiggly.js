import React, { Component, PropTypes } from 'react';
import SquigglyFilter from './SquigglyFilter.component.js';

export default class Squiggly extends Component {
  constructor(props) {
    super(props);

    this.started = false;

    this.state = Object.assign({
      i: 0,
      seed: 0,
    }, this.props);

    this.loop = this.loop.bind(this);
    this.getFilterName = this.getFilterName.bind(this);
  }

  componentDidMount() {
    this.start();
  }

  componentDidUpdate() {
    this.start();
  }

  getFilterName() {
    return `url('#${this.props.id}-${this.state.i}')`;
  }

  start() {
    if (this.props.start) {
      if (!this.started) {
        this.started = true;
        this.loop();
      }
    } else {
      this.started = false;
    }
  }

  loop() {
    if (this.props.start) {
      this.setState({ i: (this.state.i + 1) % 10 });
      setTimeout(this.loop, this.props.freq);
    }
  }

  render() {
    return (
      <div id={this.props.id} style={{ filter: this.getFilterName() }}>
        <svg style={{ display: 'none' }} >
          <SquigglyFilter {...this.props} />
        </svg>
        {this.props.children}
      </div>
    );
  }
}

// TODO Context
Squiggly.propTypes = {
  id: PropTypes.string,
  children: PropTypes.node,
  scale: PropTypes.number,
  baseFrequency: PropTypes.number,
  numOctaves: PropTypes.number,
  type: PropTypes.string,
  freq: PropTypes.number,
  start: PropTypes.bool,
};
Squiggly.defaultProps = {
  id: 'squiggly',
  children: null,
  scale: 2,
  baseFrequency: 0.02,
  numOctaves: 2,
  type: 'turbulence', // fractalNoise | turbulence
  freq: 50,
  start: true,
};
