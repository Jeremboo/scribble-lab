const fs = require('fs');

const { askWitchChildDir } = require('.');
const { SCRIBBLE_PATH } = require('./constants');

module.exports = () => {
  // Get the scribble path
  let scribblePath = SCRIBBLE_PATH;
  const groupName = askWitchChildDir(scribblePath, 'group');
  scribblePath += `${groupName}/`;
  const scribbleName = askWitchChildDir(scribblePath, 'scribble', true);
  scribblePath += `${scribbleName}/`;

  // Get data
  const dataPath = `${scribblePath}/data.json`;
  let name = false;
  if (fs.existsSync(dataPath)) {
    const scribbleData = JSON.parse(fs.readFileSync(dataPath));
    name = scribbleData.name;
  }

  return { scribblePath, groupName, scribbleName, name };
};
