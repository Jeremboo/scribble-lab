var filesystem = require("fs");
var path = require('path');
var webpack = require('webpack');
var poststylus = require('poststylus');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var node_modules = path.resolve(__dirname, './node_modules');


var dir = process.env.DIR;
var directory = false;
var directories = filesystem.readdirSync('./');

if (!dir) {
  throw 'No path defined. please use `DIR=[PATH] npm start`';
}

for( var i = 0; i < directories.length ; i++) {
  if (directories[i] === dir) {
    directory = path.resolve(__dirname, './' + directories[i]);
    break;
  }
}

if (!directory) {
  throw ('The ' + directory +
  ' is not created. Pleaser use `DIR=' + process.env.DIR +
  ' npm run create`');
}

var config = {
    entry: [
      'webpack/hot/dev-server',
      'webpack-dev-server/client?http://localhost:3333',
      path.resolve(__dirname, './bootstrap.js')
    ],
    output: {
        path: directory + '/',
        filename: 'bundle.js',
    },
    devtool: "inline-source-map",
    resolve: {
      alias: {
        html: path.resolve(__dirname, directory + '/index.pug.html'),
        style: path.resolve(__dirname, directory + '/style.styl'),
        app: path.resolve(__dirname, directory + '/app.js'),
      },
    },
    module: {
      noParse: [],
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: node_modules,
          loader: 'babel',
        },
        {
          test: /\.(styl|css)$/,
          loader: 'style!css?sourceMap!stylus',
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          loader: 'file?name=imgs/[hash].[ext]',
          include: path.resolve(__dirname, './00_inspirations/'),
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
      new HtmlWebpackPlugin({
        title: dir + ' - Codevember2016',
        // template: path.resolve(__dirname, directory + '/index.pug.html'),
      }),
    ],
};

module.exports = config;
