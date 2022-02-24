const { copyFileSync, existsSync, copySync, mkdirSync } = require('fs-extra');

const { createDir } = require('./utils');
const { PUBLIC_PATH, DEFAULT_CSS_PATH } = require('./utils/constants');
const getScribbleData = require('./utils/getScribbleData');
const startServer = require('./startServer');

// Get data from the user
const { scribblePath, groupName, scribbleName, name } = getScribbleData();

// Create the output folder
const outputGroupPath = createDir(PUBLIC_PATH, groupName);
const outputPath = createDir(outputGroupPath, scribbleName);

// Create the style.css file by copying the css template
let stylePath = `${scribblePath}style.css`;
if (!existsSync(stylePath)) {
  stylePath = DEFAULT_CSS_PATH;
}
copyFileSync(stylePath, `${outputPath}style.css`);

// Copy the assets
let assetsPath = `${scribblePath}assets`;
if (existsSync(assetsPath)) {
  const outputAssetPath = `${outputPath}assets`;
  if (!existsSync(outputAssetPath)) {
    mkdirSync(outputAssetPath);
  }
  copySync(assetsPath, outputAssetPath);
}

const args = ['--name=index', '--js=app.js', '--build'];

// Is minified or not
const arguments = process.argv.splice(2);
const noMinified = arguments.includes('noMinified');
if (noMinified) {
  args.push('--no-compress');
}

// TODO 2020-04-14 jeremboo: and what's about the dependenties? (like images?)

// Trigger canvas-sketch-cli
startServer(scribblePath, name, args, outputPath);
