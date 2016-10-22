const STYLES = [
  'basic',
  'new',
];

const faces = document.getElementsByClassName('side');

let styleId = 0;
window.setInterval(() => {
  const oldStyle = STYLES[styleId];
  styleId = (styleId + 1) % STYLES.length;
  let i;
  for (i = 0; i < faces.length; i++) {
    faces[i].classList.remove(oldStyle);
    faces[i].classList.add(STYLES[styleId]);
  }
}, 1000);
