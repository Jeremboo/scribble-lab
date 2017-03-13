import { updateTransform } from 'props';
import { onUpdateLetter } from 'dashboard';

const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const alphabetSVG = {};

function loadSVG(letter) {
  const client = new XMLHttpRequest();
  client.open('GET', require(`../_assets/raw/letters/${letter}.svg`), false);
  // Following line is just to be on the safe side;
  // not needed if your server delivers SVG with correct MIME type
  client.overrideMimeType('image/svg+xml');
  client.onreadystatechange = (e) => {
    if (client.readyState === 4) {
      const status = client.status;
			// const data = (client.response || client.responseText) ? JSON.parse(client.response || client.responseText) : false;
      // console.log(status, client.response);
      alphabetSVG[letter] = client.responseText;
    }
  }
  client.send();
  // document.getElementById('svgContainer').appendChild(xhr.responseXML.documentElement);
}

for (let i = 0; i < alphabet.length; i++) {
  // console.log(require(`../_assets/raw/letters/${alphabet[i]}.svg`));
  loadSVG(alphabet[i]);
  // alphabetSVG[alphabet[i]] = require(`../_assets/letters/${alphabet[i]}.svg`);
}

onUpdateLetter((letter, charElm) => {
  charElm.innerHTML = alphabetSVG[letter];
  // TODO ajouter les lettres en svg
  updateTransform(charElm);
});
