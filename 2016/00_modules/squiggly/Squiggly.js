import React, { Component, PropTypes } from 'react';
import SquigglyFilter from './SquigglyFilter.component.js';

export default class Squiggly extends Component {
  constructor(props) {
    super(props);

    this.state = Object.assign({
      i: 0,
      seed: 0,
      scale: 2,
      baseFrequency: 0.02,
      numOctaves: 3,
      type: 'turbulence',
    }, this.props);

    this.loop = this.loop.bind(this);
    this.getFilterName = this.getFilterName.bind(this);
  }

  componentDidMount() {
    this.loop();
  }

  // TODO start() stop()

  loop() {
    this.setState({ i: this.state.i + 1 });
    setTimeout(this.loop, this.props.freq);
  }

  getFilterName() {
    return `url('#squiggly-${this.state.i}')`;
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
};
Squiggly.defaultProps = {
  id: null,
  children: null,
  scale: 2,
  baseFrequency: 0.02,
  numOctaves: 3,
  type: 'turbulence',
};
