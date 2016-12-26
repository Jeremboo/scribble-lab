import React, { PropTypes } from 'react';

const SquigglyFilter = (props) => {
  const { id, i, baseFrequency, numOctaves, type, scale } = props;
  const turbulenceProps = {
    baseFrequency,
    numOctaves,
    type,
    seed: i,
  };
  const displacementMapProps = {
    scale,
  };

  return (
    <filter id={`${id}-${i}`} >
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
  );
};
// TODO see react context
SquigglyFilter.propTypes = {
  id: PropTypes.string.isRequired,
  i: PropTypes.number,
  baseFrequency: PropTypes.number,
  numOctaves: PropTypes.number,
  scale: PropTypes.number,
  type: PropTypes.string,
};
SquigglyFilter.defaultProps = {
  i: 0,
  baseFrequency: 0.02,
  numOctaves: 3,
  scale: 2,
  type: 'turbulence',
};

export default SquigglyFilter;
