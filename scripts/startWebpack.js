const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const compiler = webpack(require('../webpack.config.js'));

const server = new WebpackDevServer(compiler, {
  // contentBase: `/${dirPath}`,
  hot: true,
  historyApiFallback: true,
});

module.exports = () => server.listen(3333, '0.0.0.0', () => {
  console.log('Let\'s rock ! ');
});
