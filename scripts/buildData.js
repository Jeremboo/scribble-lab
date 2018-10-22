const fs = require('fs');
const { getFilteredDirList } = require('./utils');

/**
 * * ******************
 * * UTILS
 * * ******************
 */

const sortByDate = arr => arr.sort((a, b) => new Date(b.date) - new Date(a.date));

const addLine = text => `\n\n${text}`;
const buildPreview = (previewPath, name, link) => {
  if (fs.existsSync(previewPath)) {
    const gifLink = `https://github.com/Jeremboo/codevember/blob/master/${previewPath}`;
    const l = link || gifLink;
    return `
  <a href="${l}">
    <img alt="${name}" src="${gifLink}?raw=true" width="200">
  </a>`;
  }
};


/**
 * * ******************
 * * GET GROUPS DATA AND SORT BY DATE
 * * ******************
 */

let i, j, k;
const path = 'scribbles/';
const groupsName = getFilteredDirList(path);
let data = [];

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


/**
 * * ******************
 * * WRITE THE PROJECT LIST
 * * ******************
 */
const title = '# Scribble lab';
const description = 'Just a regroupment of some searches, tests, experiments around javascript or CSS and their frameworks.';
let projectList = `${title}

${description}

-[All GIFs](/PREVIEWS.md)`;

for (i = 0; i < data.length; i++) {
  const group = data[i];
  if (group.visible) {
    projectList += addLine(`## ${group.link ? `[${group.name}](${group.link})` : group.name}`);
    projectList += addLine(group.description);
    projectList += addLine('<p align="center">');

    for (j = 0; j < group.scribbles.length; j++) {
      const scribble = group.scribbles[j];
      if (scribble.preview && scribble.visible) {
        const typeOfPreviewInfo = typeof (scribble.preview);
        if (typeOfPreviewInfo === 'string') {
          projectList += buildPreview(scribble.path + scribble.preview, scribble.name, scribble.link);
        } else if (typeOfPreviewInfo === 'object') {
          for (k = scribble.preview.length - 1; k >= 0; k--) {
            projectList += buildPreview(scribble.path + scribble.preview[k], scribble.name, scribble.link);
          }
        }
      }
    }
    projectList += '\n</p>';
  }
}
fs.writeFileSync('./README.md', projectList, 'utf8');


/**
 * * ******************
 * * WRITE THE README
 * * ******************
 */

let previewList = `${title}

${description}

- [All Projects](/README.md)

<p align="center">`;

let previewsListed = [];


for (i = 0; i < data.length; i++) {
  if (data[i].visible) {
    for (j = 0; j < data[i].scribbles.length; j++) {
      const scribble = data[i].scribbles[j];

      if (scribble.visible) {
        const date = scribble.date;
        const link = scribble.link.length && scribble.link || data[i].link.length && data[i].link || '';

        // TODO: rework that (function in a loop)
        const injectPreview = (previewPath) => {
          const previewData = buildPreview(
            scribble.path + previewPath,
            scribble.name,
            link,
          );
          if (typeof previewData !== 'undefined') {
            previewsListed.push({ data: previewData, date });
          } else {
            console.log(`ERROR: ${previewPath} not found.`);
          }
        };

        if (typeof scribble.preview === 'string') {
          injectPreview(scribble.preview);
        } else {
          for (k = 0; k < scribble.preview.length; k++) {
            const preview = scribble.preview[k];
            injectPreview(preview);
          }
        }
      }
    }
  }
}

previewsListed = sortByDate(previewsListed);

for (i = 0; i < previewsListed.length; i++) {
  previewList += previewsListed[i].data;
}

previewList += '\n</p>';

fs.writeFileSync('./PREVIEWS.md', previewList, 'utf8');
