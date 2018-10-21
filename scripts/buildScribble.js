const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
config.mode = 'production';
config.output.path = path.resolve(__dirname, `../public/${dirs[1]}/${dirs[2]}`);
config.output.publicPath = '';
config.plugins.splice(0, 1);
config.optimization = {
  minimizer: [
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: { warnings: true, drop_console: true },
        comments: false,
        sourceMap: false,
        mangle: true,
        minimize: true,
      },
    }),
  ],
};

// https://github.com/webpack-contrib/mini-css-extract-plugin
if (config.module.rules[1].use[0] === 'style-loader') {
  config.module.rules[1].use[0] = MiniCssExtractPlugin.loader;
  config.plugins.push(new MiniCssExtractPlugin({
    // Options similar to the same options in webpackOptions.output
    // both options are optional
    filename: '[name].css',
    chunkFilename: '[id].css',
  }));
} else {
  throw new Error('ERROR: Cannot extract css files. The webpack style-loader rule is not correctly linked. See buildScrible.js l.36');
}

// Compile
console.log('🌪 Webpack compilation...');
webpack(config, (err, stats) => {
  // https://webpack.js.org/api/node/#error-handling
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }
  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors);
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
  console.log('👌 DONE');
});
