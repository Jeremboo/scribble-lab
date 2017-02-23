const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const compiler = webpack(require('../webpack.config.js'));

require('./getScribbleData')();

// Create webpack dev server
const server = new WebpackDevServer(compiler, {
  // contentBase: `/${dirPath}`,
  hot: true,
  historyApiFallback: true,
});

server.listen(3333, '0.0.0.0', () => {
  console.log('Let\'s rock ! ');
});
