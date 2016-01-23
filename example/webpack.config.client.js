var NpmInstallPlugin = require("npm-install-webpack-plugin");
var path = require("path");
var webpack = require("webpack");

module.exports = {
  context: __dirname,

  devtool: "#inline-source-map",

  entry: {
    client: [
      "webpack-hot-middleware/client?reload=true",
      "./client.js",
    ],
  },

  module: {
    loaders: [
      {
        loader: "style-loader",
        test: /\.css$/,
      },
      {
        loader: "css-loader",
        query: {
          localIdentName: "[name]-[local]--[hash:base64:5]",
        },
        test: /\.css$/,
      },
      {
        loader: "url-loader",
        query: {
          mimetype: "application/font-woff",
        },
        test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
      },
      {
        loader: "url-loader",
        query: {
          mimetype: "application/octet-stream",
        },
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      },
      {
        loader: "file-loader",
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      },
      {
        loader: "url-loader",
        query: {
          mimetype: "image/svg+xml",
        },
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      },
      {
        loader: "url-loader",
        query: {
          limit: 8192, // Inline base64 URLs for <= 8K images
        },
        test: /\.(png|jpg)(\?v=\d+\.\d+\.\d+)?$/,
      },
    ],
  },

  output: {
    chunkFilename: "[id].[hash:5]-[chunkhash:7].js",
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
    filename: "[name].js",
    path: path.join(__dirname, "build/client"),
    publicPath: "/",
    libaryTarget: "var",
  },

  plugins: [
    new NpmInstallPlugin({
      cli: {
        save: true,
        saveExact: true,
      },
    }),

    new webpack.HotModuleReplacementPlugin(),
  ],

  target: "web",
};
