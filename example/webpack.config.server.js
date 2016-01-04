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

    postLoaders: [
      {
        exclude: /node_modules/,
        loader: "npm-install-loader",
        query: {
          cli: {
            save: true,
            saveExact: false,
          },
        },
        test: /\.js$/,
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
    new ReloadServerPlugin({
      script: path.join(__dirname, "build/server.min.js"),
    }),
  ],

  target: "node",
}
