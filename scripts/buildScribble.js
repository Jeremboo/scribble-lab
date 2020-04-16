const { copyFileSync } = require('fs');

const { createDir } = require('./utils');
const { PUBLIC_PATH } = require('./utils/constants');
const getScribbleData = require('./utils/getScribbleData');
const startServer = require('./startServer');

// Get data from the user
const { scribblePath, groupName, scribbleName, name } = getScribbleData();

// Create the output folder
const outputGroupPath = createDir(PUBLIC_PATH, groupName);
const outputPath = createDir(outputGroupPath, scribbleName);

// Create the style.css file by copying the css template
copyFileSync(`${scribblePath}/style.css`, `${outputPath}/style.css`);

const args = ['--build', '--js:bundle.js'];

// Is minified or not
const arguments = process.argv.splice(2);
const noMinified = arguments.includes('noMinified');
if (noMinified) {
  args.push('--no-compress');
}

// TODO 2020-04-14 jeremboo: and what's about the dependenties? (like images?)

// Trigger canvas-sketch-cli
startServer(scribblePath, name, args, outputPath);
