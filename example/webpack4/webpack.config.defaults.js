var NpmInstallPlugin = require('npm-install-webpack-plugin');
var path = require('path');

module.exports = {
  context: process.cwd(),

  externals: [],

  module: {
    rules: [
      { test: /\.css$/, loader: 'style-loader' },
      {
        test: /\.css$/,
        loader: 'css-loader',
        options: { localIdentName: '[name]-[local]--[hash:base64:5]' }
      },
      { test: /\.eot$/, loader: 'file-loader' },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: { cacheDirectory: true },
        exclude: /node_modules/
      },
      { test: /\.(png|jpg)$/, loader: 'url-loader', options: { limit: 8192 } }, // Inline base64 URLs for <= 8K images
      {
        test: /\.svg$/,
        loader: 'url-loader',
        options: { mimetype: 'image/svg+xml' }
      },
      {
        test: /\.ttf$/,
        loader: 'url-loader',
        options: { mimetype: 'application/octet-stream' }
      },
      {
        test: /\.(woff|woff2)$/,
        loader: 'url-loader',
        options: { mimetype: 'application/font-woff' }
      }
    ]
  },

  output: {
    chunkFilename: '[id].[hash:5]-[chunkhash:7].js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    filename: '[name].js'
  },

  plugins: [
    new NpmInstallPlugin({
      yarn: true,
      dev: function(module, path) {
        return (
          [
            'babel-preset-react-hmre',
            'webpack-dev-middleware',
            'webpack-hot-middleware'
          ].indexOf(module) !== -1
        );
      }
    })
  ],

  resolve: {
    alias: {
      react: 'react-lite',
      'react-dom': 'react-lite'
    },
    modules: [path.join(process.cwd(), 'lib'), 'node_modules']
  }
};
