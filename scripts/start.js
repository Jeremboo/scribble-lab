const fs = require('fs');

const askWitchChildDir = require('./utils').askWitchChildDir;
const testDirPath = require('./utils').testDirPath;

// DIRECTORY TEST
let dirPath = process.env.DIR;

if (!dirPath) {
  // Select a dir in command line
  dirPath = 'sketches/';
  dirPath += `${askWitchChildDir(dirPath, 'group')}/`;
  dirPath += `${askWitchChildDir(dirPath, 'sketch')}/`;
}

// Test the path
testDirPath(dirPath);

// START WEBPACK
process.env.DIR = `${dirPath}`;
require('./startWebpack')();
