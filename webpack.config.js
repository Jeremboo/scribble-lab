var fs = require('fs');
var path = require('path');
var ip = require('ip');
var webpack = require('webpack');
var poststylus = require('poststylus');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var myLocalIp = 'http://' + ip.address() + ':3333/';

// DIRECTORIES
var assets = path.resolve(__dirname, process.env.GROUP_PATH + '/_assets/');
var modules = path.resolve(__dirname, process.env.GROUP_PATH + '/_modules/');
var scribble_path = process.env.SKETCH_PATH;
var name = process.env.NAME;
var node_modules = path.resolve(__dirname, './node_modules');

// WEBPACK CONFIG
var config = {
    entry: [
      'babel-polyfill',
      'webpack/hot/dev-server',
      'webpack-dev-server/client?' + myLocalIp,
      path.resolve(__dirname, './bootstrap.js')
    ],
    output: {
        path: path.resolve(__dirname, scribble_path + '/'),
        filename: 'bundle.js',
    },
    debug: true,
    devtool: 'eval-source-map',
    resolve: {
      alias: {
        html: path.resolve(__dirname, scribble_path + '/index.pug.html'),
        style: path.resolve(__dirname, scribble_path + '/style.styl'),
        app: path.resolve(__dirname, scribble_path + '/app.js'),
      },
    },
    module: {
      noParse: [],
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: node_modules,
          loader: 'babel',
          query: {
            plugins: [
              [ 'module-resolver', {
                'root': [modules, assets, './modules/', './assets/'],
              }],
            ]
          },
        },
        {
          test: /\.(styl|css)$/,
          loader: 'style!css?sourceMap!stylus',
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          loader: 'file?name=imgs/[hash].[ext]',
          include: [ './assets/', assets ],
        },
        {
          test: /\.(html|pug)$/,
          loader: 'pug',
        },
      ],
    },
    stylus: {
      use: [
        poststylus(['autoprefixer'])
      ]
    },
    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.optimize.DedupePlugin(),
      new HtmlWebpackPlugin({
        title: name,
        // template: path.resolve(__dirname, scribble_path + '/index.pug.html'),
      }),
    ],
};

module.exports = config;
