const fs = require('fs');
const { askWitchChildDir, pathExist } = require('./utils');

// DIRECTORY TEST
let dirPath = process.env.DIR;

if (!dirPath || !pathExist(dirPath)) {
  // Select a dir in command line
  dirPath = 'sketches/';
  dirPath += `${askWitchChildDir(dirPath, 'group')}/`;
  dirPath += `${askWitchChildDir(dirPath, 'sketch')}/`;
}

// Get data
const dataPath = `${dirPath}/data.json`;
let name = ' A sketch';
if (fs.existsSync(dataPath)) {
  const sketchData = JSON.parse(fs.readFileSync(dataPath));
  name = sketchData.name;
}

// START WEBPACK
process.env.DIR = dirPath;
process.env.NAME = name;
require('./startWebpack')();
