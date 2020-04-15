const { existsSync } = require('fs');
const canvasSketchCli = require('canvas-sketch-cli');

const DEFAULT_HTML_PATH = './templates/index.html';

module.exports = (path, name, customArgs = []) => {
  const args = [`${path}index.js`, ...customArgs];

  // Check if a custom html file exists
  let htmlPath = `${path}/index.html`;
  if (!existsSync(htmlPath)) {
    htmlPath = DEFAULT_HTML_PATH;
  }

  // Start
  args.push('--open', '-p=3333', `--html=${htmlPath}`, `--title=${name}`, `--dir=${path}`);
  canvasSketchCli(args);
};