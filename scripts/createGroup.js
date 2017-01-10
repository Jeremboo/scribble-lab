const { createDir, createDataJSON } = require('./utils');

// Create directory
const { name, path } = createDir('sketches/', 'Group');

// Create json file
createDataJSON(name, path);
