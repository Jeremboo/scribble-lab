const fs = require('fs');
const path = require('path');
const { askWitchChildDir, pathExist } = require('./utils');

module.exports = () => {
  // DIRECTORY TO TEST
  let scribblePath = process.env.DIR;

  if (!scribblePath || !pathExist(scribblePath)) {
    // Select a dir in command line
    scribblePath = 'scribbles/';
    scribblePath += `${askWitchChildDir(scribblePath, 'group')}/`;
    scribblePath += `${askWitchChildDir(scribblePath, 'scribble')}/`;
  }

  // Get the group path
  const groupPath = path.dirname(scribblePath);

  // Get data
  const dataPath = `${scribblePath}/data.json`;
  let name = 'A scribble';
  if (fs.existsSync(dataPath)) {
    const scribbleData = JSON.parse(fs.readFileSync(dataPath));
    name = scribbleData.name;
  }

  // START WEBPACK
  process.env.GROUP_PATH = groupPath;
  process.env.SKETCH_PATH = scribblePath;
  process.env.NAME = name;
};
