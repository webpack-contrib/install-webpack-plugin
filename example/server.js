/**
 * Uncomment things line-by-line & watch the loader go!
 */

var config = require("./webpack.config.client");
var dev = require("webpack-dev-middleware");
var express = require("express");
var hot = require("webpack-hot-middleware");
var path = require("path");
var webpack = require("webpack");

var compiler = webpack(config);

express()
  .use(dev(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
    quiet: true,
  }))
  .use(hot(compiler, { reload: true }))
  .use(express.static("public"))
  .listen(3000)
;
