const { askToCreateDir, createDir, createDataJSON } = require('./utils');

// Create directories
const { name, path } = askToCreateDir('sketches/', 'Group');
createDir(path, '_modules');
createDir(path, '_assets');

// Create json file
createDataJSON(name, path);
