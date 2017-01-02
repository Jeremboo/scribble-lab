const fs = require('fs');
const camelCase = require('camelcase');

const ask = require('./utils').ask;
const createDir = require('./utils').createDir;
const createDataJSON = require('./utils').createDataJSON;

// Create directory
const name = ask('Group name : ');
const nameToCamelCase = camelCase(name);
const path = `sketches/${nameToCamelCase}`;
createDir(path);

// Create json file
createDataJSON(name, path);
