import React, { Component, PropTypes } from 'react';

export default class CanvasTextureComponent extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { canvasTextures } = this.props;
    console.log(canvasTextures);
    return (
      <ul>
        {canvasTextures.map((canvasTexture, index) =>
          <li key={index}>
            {console.log(canvasTexture.canvas)}
            {canvasTexture.canvas}
          </li>)
        }
      </ul>
    );
  }
}
