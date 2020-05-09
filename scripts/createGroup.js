const { askToCreateDir, createDir } = require('./utils');
const createDataJSON = require('./utils/createDataJSON');

// Create directories
const { name, path } = askToCreateDir('scribbles/', 'Group');
createDir(path, '_modules');
createDir(path, '_assets');

// Create json file
createDataJSON(name, path);
