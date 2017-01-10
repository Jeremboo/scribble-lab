const fs = require('fs');
const copyDir = require('copy-dir');

const { askWitchChoice, askWitchChildDir, pathExist, createDir, createDataJSON } = require('./utils');

// WITCH REPO
let dirPath = process.env.DIR;

if (!dirPath || !pathExist(dirPath)) {
  // Select a dir in command line
  dirPath = 'sketches/';
  dirPath += `${askWitchChildDir(dirPath, 'group')}/`;
}

// WITCH TYPE
// Get all app name
const templatePath = 'templates/';
const templateFiles = fs.readdirSync(templatePath);
const types = templateFiles.filter(fileName => (fileName.indexOf('app.') !== -1));

// CREATE DIR
const { path, name } = createDir(dirPath, 'Sketch');

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
process.env.DIR = path;
process.env.NAME = name;
require('./startWebpack')();
