const { askToCreateDir, createDataJSON } = require('./utils');

// Create directory
const { name, path } = askToCreateDir('sketches/', 'Group');

// Create json file
createDataJSON(name, path);
