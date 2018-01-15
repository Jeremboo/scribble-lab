const fs = require('fs');
const { getFilteredDirList } = require('./utils');

const path = 'scribbles/';
const groupsName = getFilteredDirList(path);
let data = [];

/*
  GET GROUPS DATA AND SORT BY DATE
*/
const sortByDate = (arr) => arr.sort((a, b) => new Date(b.date) - new Date(a.date));

let i, j;
for (i = 0; i < groupsName.length; i++) {
  const groupPath = `${path}${groupsName[i]}`;
  const dataPath = `${groupPath}/data.json`;

  if (fs.existsSync(dataPath)) {
    const groupData = JSON.parse(fs.readFileSync(dataPath));

    groupData.scribbles = [];
    const scribblesName = getFilteredDirList(groupPath);
    const scribbles = [];

    for (j = 0; j < scribblesName.length; j++) {
      const scribblePath = `${path}${groupsName[i]}/${scribblesName[j]}`;
      const scribbleDataPath = `${scribblePath}/data.json`;

      if (fs.existsSync(scribbleDataPath)) {
        const scribbleData = JSON.parse(fs.readFileSync(scribbleDataPath));
        scribbles.push(scribbleData);
      }
    }
    groupData.scribbles = sortByDate(scribbles);
    data.push(groupData);
  }
}
data = sortByDate(data);
fs.writeFileSync('./data.json', JSON.stringify(data, null, 2), 'utf8');

/*
  WRITE THE README
*/


let readme = `# Scribble lab

Just a regroupment of some searches, tests, experiments around javascript or CSS and their frameworks.

---`;

const addLine = text => { readme += `\n\n${text}`; };
const addPreview = (previewPath, name, link) => {
  if (fs.existsSync(previewPath)) {
    const gifLink = `https://github.com/Jeremboo/codevember/blob/master/${previewPath}`;
    const l = link || gifLink;
    readme += `
  <a href="${l}">
    <img alt="${name}" src="${gifLink}?raw=true" width="200">
  </a>`;
  }
};

for (i = 0; i < data.length; i++) {
  const group = data[i];
  if (group.visible) {
    addLine(`## ${group.link ? `[${group.name}](${group.link})` : group.name}`);
    addLine(group.description);
    addLine('<p align="center">');

    for (j = 0; j < group.scribbles.length; j++) {
      const scribble = group.scribbles[j];
      if (scribble.preview && scribble.visible) {
        const typeOfPreviewInfo = typeof (scribble.preview);
        if (typeOfPreviewInfo === 'string') {
          addPreview(scribble.path + scribble.preview, scribble.name, scribble.link);
        } else if (typeOfPreviewInfo === 'object') {
          let k;
          for (k = scribble.preview.length - 1; k >= 0; k--) {
            // TODO mame a different name
            addPreview(scribble.path + scribble.preview[k], scribble.name, scribble.link);
          }
        }
      }
    }
  }
  readme += '\n</p>';
}
fs.writeFileSync('./README.md', readme, 'utf8');
