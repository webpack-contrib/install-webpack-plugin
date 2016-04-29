var path = require("path");
var webpack = require("webpack");

var defaults = require("./webpack.config.defaults");

module.exports = Object.assign({}, defaults, {
  entry: {
    client: [
      "./src/client.js",
    ],
  },

  output: Object.assign({}, defaults.output, {
    libaryTarget: "var",
    path: path.join(defaults.context, "build/client"),
    publicPath: "/",
  }),

  target: "web",
});
