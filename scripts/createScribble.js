const fs = require('fs');

const startServer = require('./startServer');
const { askWitchChoice, askWitchChildDir, askToCreateDir, askBool } = require('./utils');
const { DEFAULT_ARGS, SCRIBBLE_PATH } = require('./utils/constants');
const createDataJSON = require('./utils/createDataJSON');

// Get the group
const groupPath = `${SCRIBBLE_PATH}${askWitchChildDir(SCRIBBLE_PATH, 'group')}/`;

// Create the directory
const { path, name } = askToCreateDir(groupPath, 'Sketch');

// Get the possibles templates
const types = {};
const templatePath = './templates/';
const templateFiles = fs.readdirSync(templatePath);
templateFiles.forEach(fileName => {
  if (fileName.includes('app.')) {
    const name = fileName.split('.')[1];
    types[name] = `${templatePath}${fileName}`;
  }
});
// Add default templates at the end
types['regl'] = 'regl';
types['penplot'] = 'penplot';
types['canvas (default)'] = 'default';
types['three (default)'] = 'three';
// Get the template type requested
const templateKey = askWitchChoice(Object.keys(types), 'template');
const templateType = types[templateKey];

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
