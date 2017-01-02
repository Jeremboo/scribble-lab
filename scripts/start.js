const fs = require('fs');

const askWitchChildDir = require('./utils').askWitchChildDir;

// DIRECTORY TEST
let dirPath = process.env.DIR;

if (!dirPath) {
  // Select a dir in command line
  dirPath = 'sketches/';
  dirPath += `${askWitchChildDir(dirPath, 'group')}/`;
  dirPath += `${askWitchChildDir(dirPath, 'sketch')}/`;
}

// Test the path
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
