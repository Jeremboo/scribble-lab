const fs = require('fs');
const { createDataJSON, ask } = require('./utils.js');

// TODO create a json by group with all of sketches
// update README.md with

// Read all json of groups

let path = 'sketches/';
const data = [];
let readme = `# Scribble lab

Just a regroupment of some searches, tests, experiments around javascript or CSS and their frameworks.

---
`;

// Get group data
const groupsName = fs.readdirSync(path);

let i;
for (i = 0; i < groupsName.length ; i++) {
  const groupPath = `${path}${groupsName[i]}`;
  const dataPath = `${groupPath}/data.json`;

  if (fs.existsSync(dataPath)) {
    const groupData = JSON.parse(fs.readFileSync(dataPath));
    readme += '\n\n## ' + groupData.name;
    readme += '\n\n' + groupData.description;
    readme += '\n\n<p align="center">';
    groupData.projects = [];
    const sketchesName = fs.readdirSync(groupPath);

    let j;
    for (j = 0; j < sketchesName.length ; j++) {
      const sketchPath = `${path}${groupsName[i]}/${sketchesName[j]}`;
      const sketchDataPath = `${sketchPath}/data.json`;

      if (fs.existsSync(sketchDataPath)) {
        const sketchData = JSON.parse(fs.readFileSync(sketchDataPath));

        if (fs.existsSync(sketchData.preview)) {
          readme += `
  <a href="${sketchData.link ? sketchData.link : '/'}">
    <img alt="${sketchData.name}" src="https://github.com/Jeremboo/codevember/blob/master/${sketchData.preview}?raw=true" width="200">
  </a>
          `;
        }
        // if (!sketchData.link) {
        //   // sketchData.date = new Date(`${groupsName[i].slice(groupsName[i].length - 4, groupsName[i].length)}-11-${sketchesName[j].slice(0, 2)}`);
        //   sketchData.link =  ask(`${sketchData.name} link ?`);
        //   fs.writeFileSync(
        //     sketchDataPath,
        //     JSON.stringify(sketchData, null, 2), 'utf8'
        //   );
        // }
        groupData.projects.push(sketchData);
      }
    }
    data.push(groupData);

    readme += '</p>';
  }
}
fs.writeFileSync('./data.json', JSON.stringify(data, null, 2), 'utf8');
fs.writeFileSync('./README.md', readme, 'utf8');
