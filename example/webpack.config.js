var path = require("path");
var ReloadServerPlugin = require("reload-server-webpack-plugin");
var webpack = require("webpack");

module.exports = {
  context: __dirname,

  entry: {
    server: path.join(__dirname, "server.js"),
  },

  externals: /^[a-z\-0-9]+$/,  // Every non-relative module is external

  module: {
    postLoaders: [
      {
        exclude: /node_modules/,
        loader: "npm-install-loader",
        test: /\.js$/,
      },
    ],
  },

  output: {
    filename: "[name].min.js",
    libraryTarget: "commonjs2",
    path: path.join(__dirname, "build"),
  },

  plugins: [
    new ReloadServerPlugin({
      script: path.join(__dirname, "build/server.min.js"),
    }),
  ],

  target: "node"
}
