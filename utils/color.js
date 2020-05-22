
export const getRandomHexa = () =>
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 16)]
;
export const getRandomColor = (type = '#') => {
  let color = `${type}`;
  for (let i = 0; i < 6; i++ ) {
      color += getRandomHexa();
  }
  return color;
}

/**
 * https://gist.github.com/jedfoster/7939513
 * @param {*} color_1
 * @param {*} color_2
 * @param {*} weight
 */
export const mixColors = (color_1, color_2, weight) => {
  function d2h(d) { return d.toString(16) }  // convert a decimal value to hex
  function h2d(h) { return parseInt(h, 16) } // convert a hex value to decimal

  weight = (typeof (weight) !== 'undefined') ? weight : 50 // set the weight to 50%, if that argument is omitted

  let color = '#'

  for (let i = 0; i <= 5; i += 2) { // loop through each of the 3 hex pairs—red, green, and blue
    let v1 = h2d(color_1.substr(i, 2)), // extract the current pairs
      v2 = h2d(color_2.substr(i, 2)),

       // combine the current pairs from each source color, according to the specified weight
      val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)))

    while (val.length < 2) { val = `0${val}` } // prepend a '0' if val results in a single digit

    color += val // concatenate val to our new color string
  }

  return color // PROFIT!
}

export const componentToHex = (c) => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};
export const rgbToHex = (r, g, b) => {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
export const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R<255)?R:255;
  G = (G<255)?G:255;
  B = (B<255)?B:255;

  const RR = ((R.toString(16).length==1)?'0'+R.toString(16):R.toString(16));
  const GG = ((G.toString(16).length==1)?'0'+G.toString(16):G.toString(16));
  const BB = ((B.toString(16).length==1)?'0'+B.toString(16):B.toString(16));

  return RR+GG+BB;
}