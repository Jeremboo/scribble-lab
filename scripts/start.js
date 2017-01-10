const { askWitchChildDir, pathExist } = require('./utils');

// DIRECTORY TEST
let dirPath = process.env.DIR;

if (!dirPath || !pathExist(dirPath)) {
  // Select a dir in command line
  dirPath = 'sketches/';
  dirPath += `${askWitchChildDir(dirPath, 'group')}/`;
  dirPath += `${askWitchChildDir(dirPath, 'sketch')}/`;
}

// START WEBPACK
process.env.DIR = dirPath;
require('./startWebpack')();
