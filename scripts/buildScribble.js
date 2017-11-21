const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

require('./getScribbleData')();

const dirs = process.env.SKETCH_PATH.split(path.sep);

// Update webpack config
const config = require('../webpack.config');
config.entry = [
  'babel-polyfill',
  path.resolve(__dirname, '../bootstrap.js'),
];
// config.debug = false;
config.devServer = {};
config.devtool = '';
config.output.path = path.resolve(__dirname, `../public/${dirs[1]}/${dirs[2]}`);
config.output.publicPath = '';
config.plugins.splice(0, 1);
config.plugins.push(new webpack.optimize.UglifyJsPlugin({
  compress: { warnings: true, drop_console: true },
  comments: false,
  sourceMap: false,
  mangle: true,
  minimize: true,
}));

// TODO add extractTextPlugin
// config.module.rules[1].loader = ExtractTextPlugin.extract('style', 'css?sourceMap!stylus');
// config.plugins.push(new ExtractTextPlugin('styles.css', {
//   disable: false,
//   allChunks: true,
// }));

// Compile
console.log(config)
const compiler = webpack(config);
compiler.run((err, stats) => {
  console.log(err);
  console.log(stats);
});
