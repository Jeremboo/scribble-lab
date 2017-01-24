import React from 'react';
import Squiggly from './index.js';
import SquigglyFilter from './SquigglyFilter.component.js';

export default class SquigglySVG extends Squiggly {
  render() {
    return (
      <g id={this.props.id} style={{ filter: this.getFilterName() }}>
        <defs>
          <SquigglyFilter {...this.state} />
        </defs>
        {this.props.children}
      </g>
    );
  }
}
