const fs = require('fs');
const copyDir = require('copy-dir');

const { askWitchChoice, askWitchChildDir, pathExist, askToCreateDir, createDataJSON } = require('./utils');

// WITCH REPO
let groupPath = process.env.DIR;

if (!groupPath || !pathExist(groupPath)) {
  // Select a dir in command line
  groupPath = 'scribbles/';
  groupPath += `${askWitchChildDir(groupPath, 'group')}/`;
}

// WITCH TYPE
// Get all app name
const templatePath = 'templates/';
const templateFiles = fs.readdirSync(templatePath);
const types = templateFiles.filter(fileName => (fileName.indexOf('app.') !== -1));

// CREATE DIR
const { path, name } = askToCreateDir(groupPath, 'Sketch');

// CLONE TEMPLATE AND KEEP THE GOOD APP
const typeFileName = askWitchChoice(types, 'template');
copyDir.sync(templatePath, path, (stat, filepath, filename) => {
  if (filename.indexOf('app.') !== -1) {
    return (filename === typeFileName);
  }
  return true;
});
fs.renameSync(`${path}/${typeFileName}`, `${path}/app.js`);

// CREATE DATA.json
createDataJSON(name, path);

// NPM START
process.env.GROUP_PATH = groupPath;
process.env.SKETCH_PATH = path;
process.env.NAME = name;
require('./startWebpack')();
