const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const compiler = webpack(require('../webpack.config.js'));

// Create webpack dev server
const server = new WebpackDevServer(compiler);

module.exports = () => server.listen(3333, '0.0.0.0', () => {
  console.log('🤘 Let\'s rock! ');
});
