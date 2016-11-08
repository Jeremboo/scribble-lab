import React, { Component, PropTypes } from 'react';

export default class Canvas extends Component {
  constructor(props) {
    super(props);

    this.canvas = null;
    this.ctx = null;

    this.updateCanvas = this.updateCanvas.bind(this);
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    this.props.setCanvas(this.canvas);
  }

  updateCanvas(data = {}) {
    const { width, height, onUpdate } = this.props;
    const props = Object.assign(
      { width, height },
      typeof (data) === 'object' ? data : { data },
    );
    onUpdate(this.ctx, props);
  }

  render() {
    const { width, height } = this.props;
    return (
      <canvas
        ref={canvas => { this.canvas = canvas; }}
        className="CanvasTextureTool-canvas"
        width={width}
        height={height}
      />
    );
  }
}
Canvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  onUpdate: PropTypes.func,
  setCanvas: PropTypes.func,
};
Canvas.defaultProps = {
  width: 256,
  height: 256,
  onUpdate: f => f,
  setCanvas: f => f,
};
