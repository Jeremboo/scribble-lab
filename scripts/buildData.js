const fs = require('fs');
const { createDataJSON, ask } = require('./utils.js');


let path = 'sketches/';
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
      const sketchesName = fs.readdirSync(groupPath);

      let j;
      for (j = 0; j < sketchesName.length ; j++) {
        const sketchPath = `${path}${groupsName[i]}/${sketchesName[j]}`;
        const sketchDataPath = `${sketchPath}/data.json`;

        if (fs.existsSync(sketchDataPath)) {
          const sketchData = JSON.parse(fs.readFileSync(sketchDataPath));

          // TODO get all .gif files to make into an array
          // if (fs.existsSync(sketchPath + '/preview.gif')) {
          //   sketchData.preview = '/preview.gif';
          // } else {
          //   delete sketchData.preview;
          // }
          // fs.writeFileSync(
          //   sketchDataPath,
          //   JSON.stringify(sketchData, null, 2), 'utf8'
          // );

          if (sketchData.preview && sketchData.visible) {
            const typeOfPreviewInfo = typeof (sketchData.preview);
            if (typeOfPreviewInfo === 'string') {
              addPreview(sketchData.path + sketchData.preview, sketchData.name, sketchData.link);
            } else if (typeOfPreviewInfo === 'array') {
              let k;
              for (k = 0; k < sketchData.preview.length; k++) {
                addPreview(sketchData.path + sketchData.preview[k], sketchData.name, sketchData.link);
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
