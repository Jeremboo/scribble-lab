const fs = require('fs');

const startServer = require('./startServer');

const createDataJSON = require('./utils/createDataJSON');
const { askWitchChoice, askWitchChildDir, pathExist, askToCreateDir, askBool } = require('./utils');

// Get the group directory
let groupPath = process.env.DIR;

if (!groupPath || !pathExist(groupPath)) {
  // Select a dir in command line
  groupPath = 'scribbles/';
  groupPath += `${askWitchChildDir(groupPath, 'group')}/`;
}

// Create the directory
const { path, name } = askToCreateDir(groupPath, 'Sketch');

// Get the template requested
const types = ['default', 'three', 'regl', 'penplot'];
// TODO 2020-04-14 jeremboo: Redo the templates propertly, remove the useless ones
// const templatePath = 'templates/';
// const templateFiles = fs.readdirSync(templatePath);
// const types = templateFiles.filter(fileName => (fileName.indexOf('app.') !== -1));
const templateType = askWitchChoice(types, 'template');

// Create the data.json
createDataJSON(name, path);

// Create the style.css file by copying the css template
fs.copyFileSync('templates/style.css', `${path}/style.css`);

// Create the index.html if the user what a custom one
const customHTMLRequested = askBool('Custom index.html ? : ', false);
if (customHTMLRequested) {
  fs.copyFileSync('templates/index.html', `${path}/index.html`);
}

// START
const args = ['--new'];
if (templateType) {
  args.push(`--template=${templateType}`)
}
startServer(path, name, args);
