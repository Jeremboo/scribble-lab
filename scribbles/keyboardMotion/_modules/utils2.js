// http://stackoverflow.com/questions/211703/is-it-possible-to-get-the-position-of-div-within-the-browser-viewport-not-withi
export const getPositionInViewport = (e) => {
  const offset = {
    x: 0, // e.offsetWidth / 2,
    y: 0, // e.offsetHeight / 2,
  };

  while (e) {
    offset.x += e.offsetLeft;
    offset.y += e.offsetTop;
    e = e.offsetParent;
  }

  if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {
    offset.x -= document.documentElement.scrollLeft;
    offset.y -= document.documentElement.scrollTop;
  } else if (document.body && (document.body.scrollTop || document.body.scrollLeft)) {
    offset.x -= document.body.scrollLeft;
    offset.y -= document.body.scrollTop;
  } else if (window.pageXOffset || window.pageYOffset) {
    offset.x -= window.pageXOffset;
    offset.y -= window.pageYOffset;
  }
  return offset;
};

export const addMarker = (x, y, color = 'red') => {
  const marker = document.createElement('div');
  marker.classList.add('marker');
  marker.classList.add(color);
  marker.style.left = `${x}px`;
  marker.style.top = `${y}px`;
  document.body.appendChild(marker);
};
