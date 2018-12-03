var fs = require('fs');
var path = require('path');
var ip = require('ip');
var webpack = require('webpack');
var poststylus = require('poststylus');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var port = 3333;
var ipAdress = ip.address() + ':' + port;
var myLocalIp = 'http://' + ipAdress + '/';

var name = process.env.NAME;

// PATHS
var scribblePath = path.resolve(__dirname, process.env.SKETCH_PATH);
var assetsPaths       = [
  path.resolve(__dirname, 'assets'),
  path.resolve(__dirname, process.env.GROUP_PATH + '/_assets')
];
var modulesPaths      = [
  path.resolve(__dirname, 'modules'),
  path.resolve(__dirname, process.env.GROUP_PATH + '/_modules'),
];
var rawPaths          = [
  path.resolve(assetsPaths[0], 'raw'),
  path.resolve(assetsPaths[1], 'raw'),
];
var nodeModulesPath   = path.resolve(__dirname, './node_modules');

// WEBPACK CONFIG
var config = {
    node: {
      fs: "empty"
    },
    mode: 'development',
    entry: [
      'babel-polyfill',
      'webpack/hot/dev-server',
      'webpack-dev-server/client?' + myLocalIp,
      path.resolve(__dirname, './bootstrap.js')
    ],
    output: {
      path: scribblePath + '/',
      filename: 'bundle.js',
      // publicPath: myLocalIp,
      publicPath: '/',
      devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]',
    },
    devtool: "eval-source-map",
    devServer: {
      // compress: true,
      contentBase: scribblePath + '/',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
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
        html: scribblePath + '/index.pug.html',
        style: scribblePath + '/style.styl',
        app: scribblePath + '/app.js',
        postprocessing: path.resolve(__dirname, './node_modules/metabubbles/build/postprocessing.js'),
      },
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          exclude: nodeModulesPath,
          query: {
            plugins: [
              [ 'module-resolver', {
                'root': [
                  ...assetsPaths,
                  ...modulesPaths
              ],
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
          include: assetsPaths,
          exclude: rawPaths,
        },
        {
          test: /\.(mp4)$/,
          loader: 'file-loader?name=videos/[hash].[ext]',
          include: assetsPaths,
          exclude: rawPaths,
        },
        {
          test: /\.(svg)$/,
          loader: 'raw-loader',
          include: rawPaths,
        },
        {
          test: /\.(eot|svg|ttf|woff(2)?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'file-loader?name=fonts/[name].[ext]',
          include: assetsPaths,
        },
        { test: /\.(glsl|frag|vert)$/, exclude: nodeModulesPath, loader: 'raw-loader' },
        { test: /\.(glsl|frag|vert)$/, exclude: nodeModulesPath, loader: 'glslify-loader' },
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
        description: '',
        template: path.resolve(__dirname, './index.html'),
      }),
    ],
};

module.exports = config;
