const fs = require('fs');
const path = require('path');
const { askWitchChildDir, pathExist } = require('./utils');

// DIRECTORY TO TEST
let sketchPath = process.env.DIR;

if (!sketchPath || !pathExist(sketchPath)) {
  // Select a dir in command line
  sketchPath = 'sketches/';
  sketchPath += `${askWitchChildDir(sketchPath, 'group')}/`;
  sketchPath += `${askWitchChildDir(sketchPath, 'sketch')}/`;
}

// Get the group path
const groupPath = path.dirname(sketchPath);

// Get data
const dataPath = `${sketchPath}/data.json`;
let name = 'A sketch';
if (fs.existsSync(dataPath)) {
  const sketchData = JSON.parse(fs.readFileSync(dataPath));
  name = sketchData.name;
}

// START WEBPACK
process.env.GROUP_PATH = groupPath;
process.env.SKETCH_PATH = sketchPath;
process.env.NAME = name;
require('./startWebpack')();
