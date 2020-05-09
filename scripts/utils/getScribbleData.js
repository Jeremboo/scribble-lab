const fs = require('fs');

const { askWitchChildDir, askWitchChoice, getFilteredDirList } = require('.');
const { getCachedValue, setCachedValue } = require('./cache');
const { SCRIBBLE_PATH, SCRIBBLE_CACHE_KEY } = require('./constants');



// Get the scribble path
module.exports = () => {
  let groupName = '';
  let scribbleName = '';
  let scribblePath = SCRIBBLE_PATH;

  const groupDirectories = getFilteredDirList(SCRIBBLE_PATH);

  // Add the cached latest scribble
  const latestPath = getCachedValue(SCRIBBLE_CACHE_KEY);
  const latestPathString = `${latestPath} (latest)`;
  if (latestPath) {
    groupDirectories.unshift(latestPathString);
  }

  // Ask for the group
  groupName = askWitchChoice(groupDirectories, 'group');

  // Check if the lastest was selected or not
  if (groupName === latestPathString) {
    scribblePath += `${latestPath}/`;
    groupName = latestPath.split('/')[0];
    scribbleName = latestPath.split('/')[1];
  } else {
    scribblePath += `${groupName}/`;
    scribbleName = askWitchChildDir(scribblePath, 'scribble', true);
    scribblePath += `${scribbleName}/`;
  }

  // Get data
  const dataPath = `${scribblePath}/data.json`;
  let name = false;
  if (fs.existsSync(dataPath)) {
    const scribbleData = JSON.parse(fs.readFileSync(dataPath));
    name = scribbleData.name;
  }

  setCachedValue(SCRIBBLE_CACHE_KEY, `${groupName}/${scribbleName}`);

  return { scribblePath, groupName, scribbleName, name };
};
