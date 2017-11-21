var fs = require('fs');
var path = require('path');
var ip = require('ip');
var webpack = require('webpack');
var poststylus = require('poststylus');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var port = 3333;
var ipAdress = ip.address() + ':' + port;
var myLocalIp = 'http://' + ipAdress + '/';

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
      publicPath: myLocalIp,
      devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]',
    },
    devtool: "eval-source-map",
    devServer: {
      // compress: true,
      contentBase: path.resolve(__dirname, scribble_path + '/'),
      headers: { 'Access-Control-Allow-Origin': '*' },
      historyApiFallback: true,
      disableHostCheck: true,
      host: '0.0.0.0',
      hot: true,
      inline: true,
      port: port,
      // Release of webpack-dev-server 2.4.3 => https://github.com/webpack/webpack-dev-server/issues/882
      public: ipAdress,
    },
    resolve: {
      alias: {
        html: path.resolve(__dirname, scribble_path + '/index.pug.html'),
        style: path.resolve(__dirname, scribble_path + '/style.styl'),
        app: path.resolve(__dirname, scribble_path + '/app.js'),
        postprocessing: path.resolve(__dirname, './node_modules/postprocessing/build/postprocessing.js'),
      },
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: node_modules,
          loader: 'babel-loader',
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
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { sourceMap: true },
            },
            {
              loader: 'stylus-loader',
              options: { sourceMap: true },
            },
          ],
        },
        {
          test: /\.(png|jpe?g|gif)$/,
          loader: 'file-loader?name=imgs/[hash].[ext]',
          include: [ './assets/', assets ],
          exclude: [ './assets/raw/', assets + 'raw/' ],
        },
        {
          test: /\.(svg)$/,
          loader: 'raw-loader',
          include: [ './assets/raw/', assets + 'raw/' ],
        },
        {
          test: /\.(html|pug)$/,
          loader: 'pug-loader',
        },
        {
          test: /\.(eot|svg|ttf|woff(2)?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'file-loader?name=fonts/[name].[ext]',
          include: [ './assets/', assets ],
        },
        { test: /\.(glsl|frag|vert)$/, exclude: node_modules, loader: 'raw-loader' },
        { test: /\.(glsl|frag|vert)$/, exclude: node_modules, loader: 'glslify-loader' },
      ],
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.LoaderOptionsPlugin({
        debug: true,
        options: {
          stylus: {
            use: [poststylus(['autoprefixer'])],
          },
        },
      }),
      new HtmlWebpackPlugin({
        title: name,
        template: path.resolve(__dirname, './index.html'),
      }),
    ],
};

module.exports = config;
