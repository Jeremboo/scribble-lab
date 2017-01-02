const fs = require('fs');
const camelCase = require('camelcase');
const copyDir = require('copy-dir');

const ask = require('./utils').ask;
const askWitchChoice = require('./utils').askWitchChoice;
const askWitchChildDir = require('./utils').askWitchChildDir;
const testDirPath = require('./utils').testDirPath;
const createDataJSON = require('./utils').createDataJSON;


// WITCH REPO
let dirPath = process.env.DIR;

if (!dirPath) {
  // Select a dir in command line
  dirPath = 'sketches/';
  dirPath += `${askWitchChildDir(dirPath, 'group')}/`;
}
testDirPath(dirPath);


// WITCH TYPE
// Get all app name
const templatePath = 'templates/';
const templateFiles = fs.readdirSync(templatePath);
const types = templateFiles
.filter(fileName => ((fileName.indexOf('app.') !== -1))) // && fileName.length > 6))
// .map(fileName => fileName.slice(4, -3))
;

const typeFileName = askWitchChoice(types, 'template');

// const typeSelected = askWitchChoice(types, 'template');
// let i = 0;
// let typeFileName = false;
// while (!typeFileName && i < templateFiles.length) {
//   if (templateFiles[i].indexOf(typeSelected) !== -1) {
//     typeFileName = templateFiles[i];
//   }
// }
// if (!typeFileName) throw('ERROR : The type selected is unknow');

// WITCH NAME
const name = ask('Witch sketch name : ');
const nameToCamelCase = camelCase(name);
dirPath += nameToCamelCase;

// CLONE TEMPLATE AND KEEP THE GOOD APP
fs.mkdirSync(dirPath);
copyDir.sync(templatePath, dirPath, (stat, filepath, filename) => {
  if (filename.indexOf('app.') !== -1) {
    return (filename === typeFileName);
  }
  return true;
});
fs.renameSync(`${dirPath}/${typeFileName}`, `${dirPath}/app.js`);

// CREATE DATA.json
createDataJSON(name, dirPath);

// NPM START
process.env.DIR = dirPath;
require('./startWebpack')();
