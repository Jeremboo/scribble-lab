const { existsSync } = require('fs');
const canvasSketchCli = require('canvas-sketch-cli');

const {  DEFAULT_ARGS, DEFAULT_HTML_PATH } = require('./utils/constants');

module.exports = (path, name, customArgs = DEFAULT_ARGS, destination = path) => {
  const args = [`${path}index.js`, ...customArgs, `--title=${name}`, `--dir=${destination}`];

  // Check if a custom html file exists
  let htmlPath = `${path}/index.html`;
  if (!existsSync(htmlPath)) {
    htmlPath = DEFAULT_HTML_PATH;
  }
  args.push(`--html=${htmlPath}`);

  // Start
  canvasSketchCli(args);
};