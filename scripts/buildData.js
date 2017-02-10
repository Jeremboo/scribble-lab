const fs = require('fs');
const { createDataJSON, ask } = require('./utils.js');


let path = 'scribbles/';
const groupsName = fs.readdirSync(path);
const data = [];
let readme = `# Scribble lab

Just a regroupment of some searches, tests, experiments around javascript or CSS and their frameworks.

---`;

const addLine = text => { readme += `\n\n${text}`; };
const addPreview = (previewPath, name, link = '/') => {
  if (fs.existsSync(previewPath)) {
    readme += `
  <a href="${link}">
    <img alt="${name}" src="https://github.com/Jeremboo/codevember/blob/master/${previewPath}?raw=true" width="200">
  </a>`;
  }
};

let i;
for (i = 0; i < groupsName.length; i++) {
  const groupPath = `${path}${groupsName[i]}`;
  const dataPath = `${groupPath}/data.json`;

  if (fs.existsSync(dataPath)) {
    const groupData = JSON.parse(fs.readFileSync(dataPath));
    if (groupData.visible) {
      addLine(`##${groupData.link ? `[${groupData.name}](${groupData.link})` : groupData.name}`);
      addLine(groupData.description);
      addLine('<p align="center">');
      groupData.projects = [];
      const scribblesName = fs.readdirSync(groupPath);

      let j;
      for (j = 0; j < scribblesName.length ; j++) {
        const scribblePath = `${path}${groupsName[i]}/${scribblesName[j]}`;
        const scribbleDataPath = `${scribblePath}/data.json`;

        if (fs.existsSync(scribbleDataPath)) {
          const scribbleData = JSON.parse(fs.readFileSync(scribbleDataPath));

          // TODO get all .gif files to make into an array
          // if (fs.existsSync(scribblePath + '/preview.gif')) {
          //   scribbleData.preview = '/preview.gif';
          // } else {
          //   delete scribbleData.preview;
          // }
          // fs.writeFileSync(
          //   scribbleDataPath,
          //   JSON.stringify(scribbleData, null, 2), 'utf8'
          // );

          if (scribbleData.preview && scribbleData.visible) {
            const typeOfPreviewInfo = typeof (scribbleData.preview);
            if (typeOfPreviewInfo === 'string') {
              addPreview(scribbleData.path + scribbleData.preview, scribbleData.name, scribbleData.link);
            } else if (typeOfPreviewInfo === 'object') {
              let k;
              for (k = 0; k < scribbleData.preview.length; k++) {
                // TODO make a different name
                addPreview(scribbleData.path + scribbleData.preview[k], scribbleData.name, scribbleData.link);
              }
            }
          }
        }
      }
      data.push(groupData);

      readme += '\n</p>';
    }
  }
}
fs.writeFileSync('./data.json', JSON.stringify(data, null, 2), 'utf8');
fs.writeFileSync('./README.md', readme, 'utf8');
