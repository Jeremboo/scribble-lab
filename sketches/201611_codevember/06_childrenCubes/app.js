const faces = document.getElementsByClassName('side');
const COLORS = [
  '#f4f3d2',
  '#F1515C',
  '#22D4BE',
  '#433D3A',
];
const BORDER_STYLE = [
  'solid',
  'dashed',
];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const removeElementFromArray = (element, array) => {
  const arr = [...array];
  const index = arr.indexOf(element)
  if (index > -1) arr.splice(index, 1);
  return arr;
}
const getRandomElm = (arr = COLORS) => arr[getRandomInt(0, arr.length - 1)];
window.setInterval(() => {
  let i;
  let backgroundColor = getRandomElm();
  let newColorArray = removeElementFromArray(backgroundColor, COLORS);
  let fontColor = getRandomElm(newColorArray);
  const borderTextColor = getRandomElm();
  const randomColors = Math.random() > 0.6;
  const border = {
    width: `${getRandomInt(0, 3)}px`,
    style: getRandomElm(BORDER_STYLE),
    color: getRandomElm(),
  };
  for (i = 0; i < faces.length; i++) {
    if (randomColors) {
      backgroundColor = getRandomElm();
      newColorArray = removeElementFromArray(backgroundColor, COLORS);
      fontColor = getRandomElm(newColorArray);
    }
    faces[i].style.color = fontColor;
    faces[i].style.backgroundColor = backgroundColor;
    faces[i].style.borderColor = border.color;
    faces[i].style.borderWidth = border.width;
    faces[i].style.borderStyle = border.style;
    faces[i].style.textShadow = `1px 0 0 ${borderTextColor}, -(1px) 0 0 ${borderTextColor}, 0 1px 0 ${borderTextColor}, 0 -(1px) 0 ${borderTextColor}, 1px 1px ${borderTextColor}, -1px -1px 0 ${borderTextColor}, 1px -1px 0 ${borderTextColor}, -1px 1px 0 ${borderTextColor}`;
  }
}, 150);
