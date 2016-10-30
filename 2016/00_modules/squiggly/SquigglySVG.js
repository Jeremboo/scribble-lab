import React from 'react';
import Squiggly from './Squiggly.js';
import SquigglyFilter from './SquigglyFilter.component.js';

export default class SquigglySVG extends Squiggly {
  render() {
    return (
      <g style={{ filter: this.getFilterName() }}>
        <defs>
          <SquigglyFilter {...this.state} />
        </defs>
        {this.props.children}
      </g>
    );
  }
}
