var NpmInstallPlugin = require("npm-install-webpack-plugin");
var path = require("path");
var ReloadServerPlugin = require("reload-server-webpack-plugin");
var webpack = require("webpack");

module.exports = {
  context: process.cwd(),

  entry: {
    server: path.join(process.cwd(), "server.js"),
  },

  externals: [
    /^[a-z\-0-9]+$/,  // Every non-relative module is external
    function(context, request, callback) {
      if (/webpack\.config\./.test(request)) {
        return callback(null, path.join(context, request));
      }

      callback();
    },
  ],

  module: {
    loaders: [
      {
        loader: "style-loader",
        test: /\.css$/,
      },
      {
        loader: "css-loader",
        test: /\.css$/,
      },
    ],
  },

  node: {
    __filename: true,
    __dirname: true,
  },

  output: {
    filename: "[name].min.js",
    libraryTarget: "commonjs2",
    path: path.join(__dirname, "build"),
  },

  plugins: [
    new NpmInstallPlugin({
      cli: {
        save: true,
        saveExact: true,
      },
    }),

    new ReloadServerPlugin({
      script: path.join(__dirname, "build/server.min.js"),
    }),
  ],

  target: "node",
}
