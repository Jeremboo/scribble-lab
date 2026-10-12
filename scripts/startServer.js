const { existsSync } = require('fs');

// Patch before loading canvas-sketch-cli so budo never lets the browser
// heuristically cache CSS across refreshes. LiveReload already busts the
// cache on save (?_livereload=…); a normal refresh was still able to reuse
// a stale style.css — which is why edits looked fine after save, then wrong
// again after reload.
const middlewarePath = require.resolve('canvas-sketch-cli/src/middleware');
const createMiddleware = require(middlewarePath);
require.cache[middlewarePath].exports = (opt = {}) => {
  const result = createMiddleware(opt);
  result.middleware.unshift((req, res, next) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname === '/' || /\.(css|html)$/i.test(pathname)) {
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
    }
    next();
  });
  return result;
};

const canvasSketchCli = require('canvas-sketch-cli');

const { DEFAULT_ARGS, DEFAULT_HTML_PATH } = require('./utils/constants');

module.exports = (path, name, customArgs = DEFAULT_ARGS, destination = path) => {
  const args = [`${path}app.js`, ...customArgs, `--title=${name}`, `--dir=${destination}`, `--output=${path}`, '--stream=gif', '--no-install'];

  // Check if a custom html file exists
  let htmlPath = `${path}/index.html`;
  if (!existsSync(htmlPath)) {
    htmlPath = DEFAULT_HTML_PATH;
  }
  args.push(`--html=${htmlPath}`);

  // Start
  console.log(`canvas-sketch-cli ${args.reduce((accumulator, currentValue) => (accumulator += `${currentValue} `), '')}`);
  canvasSketchCli(args);
};
