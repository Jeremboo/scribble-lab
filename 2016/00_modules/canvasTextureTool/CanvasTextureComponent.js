import React, { Component, PropTypes } from 'react';

export default class CanvasTextureComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { canvas } = this.props;
    return (
      <ul>
        {canvas.map((canv, index) =>
          <li key={index}>
            {canv}
          </li>)
        }
      </ul>
    );
  }
}
