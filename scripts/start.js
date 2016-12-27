const fs = require('fs');
const readlineSync = require('readline-sync');
const path = require('path');


// DIRECTORY TEST
let dirPath = process.env.DIR;

if (!dirPath) {
  dirPath = 'sketches/';
  // WITCH GROUP ?
  const groups = fs.readdirSync(dirPath);
  if (groups[0] === '.DS_Store') groups.splice(0, 1); // TODO a revoir
  if (groups[0] === '00_WIP') groups.splice(0, 1); // TODO a revoir
  const group = groups[readlineSync.keyInSelect(groups, 'Witch group ? : ')];
  dirPath += `${group}/`;

  // WITCH SKETCH ?
  const sketches = fs.readdirSync(`./sketches/${group}/`);
  if (sketches[0] === '.DS_Store') sketches.splice(0, 1); // TODO a revoir
  const sketch = sketches[readlineSync.keyInSelect(sketches, 'Witch sketch ? : ')];
  dirPath += `${sketch}/`;
}

// TEST IF THE PATH EXIST
try {
  const fd = fs.openSync(dirPath, 'r');
} catch (err) {
  throw(
    `ERROR : ${dirPath} does not exist ! You can :

    - Select a good dirPath with the command 'npm start'
    - Directly select a dirPath with the command 'DIR=[mydirPath] npm start'
    - Create a new sketch with the command 'npm run create'
  `);
}

// START WEBPACK
process.env.DIR = `${dirPath}`;
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const compiler = webpack(require('../webpack.config.js'));

const server = new WebpackDevServer(compiler, {
  // contentBase: `/${dirPath}`,
  hot: true,
  historyApiFallback: true,
});
server.listen(3333, '0.0.0.0', () => {
  console.log('Let\'s rock ! ');
});
