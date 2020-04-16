const fs = require('fs');

const startServer = require('./startServer');
const { askWitchChoice, askWitchChildDir, askToCreateDir, askBool } = require('./utils');
const { DEFAULT_ARGS, SCRIBBLE_PATH } = require('./utils/constants');
const createDataJSON = require('./utils/createDataJSON');

// Get the group
const groupPath = `${SCRIBBLE_PATH}${askWitchChildDir(SCRIBBLE_PATH, 'group')}/`;

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
const args = ['--new', ...DEFAULT_ARGS];
if (templateType) {
  args.push(`--template=${templateType}`)
}
startServer(path, name, args);
