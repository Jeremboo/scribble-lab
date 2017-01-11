var fs = require("fs");
var path = require('path');
var ip = require('ip');
var webpack = require('webpack');
var poststylus = require('poststylus');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var myLocalIp = 'http://' + ip.address() + ':3333/';
var node_modules = path.resolve(__dirname, './node_modules');

// DIRECTORY TEST
var directory = process.env.DIR;
var name = process.env.NAME;

// WEBPACK CONFIG
var config = {
    entry: [
      'webpack/hot/dev-server',
      'webpack-dev-server/client?' + myLocalIp,
      path.resolve(__dirname, './bootstrap.js')
    ],
    output: {
        path: path.resolve(__dirname, directory + '/'),
        filename: 'bundle.js',
    },
    debug: true,
    devtool: "eval-source-map",
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
          query: {
            plugins: [
              [ "module-resolver", {
                'root': ['./modules', './assets'],
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
          include: path.resolve(__dirname, './assets/'),
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
      new HtmlWebpackPlugin({
        title: name,
        // template: path.resolve(__dirname, directory + '/index.pug.html'),
      }),
    ],
};

module.exports = config;
