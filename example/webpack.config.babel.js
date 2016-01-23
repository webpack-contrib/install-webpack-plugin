import NpmInstallPlugin from "npm-install-webpack-plugin";
import path from "path";

export const defaults = {
  context: process.cwd(),

  externals: [
    "npm-install-webpack-plugin", // Symlinked project,
  ],

  module: {
    loaders: [
      { test: /\.css$/, loader: "style-loader" },
      { test: /\.css$/, loader: "css-loader", query: { localIdentName: "[name]-[local]--[hash:base64:5]" } },
      { test: /\.eot$/, loader: "file-loader" },
      { test: /\.js$/, loader: "babel-loader", query: { cacheDirectory: true }, exclude: /node_modules/ },
      { test: /\.json$/, loader: "json-loader" },
      { test: /\.(png|jpg)$/, loader: "url-loader", query: { limit: 8192 } }, // Inline base64 URLs for <= 8K images
      { test: /\.svg$/, loader: "url-loader", query: { mimetype: "image/svg+xml" } },
      { test: /\.ttf$/, loader: "url-loader", query: { mimetype: "application/octet-stream" } },
      { test: /\.(woff|woff2)$/, loader: "url-loader", query: { mimetype: "application/font-woff" } },
    ],
  },

  output: {
    chunkFilename: "[id].[hash:5]-[chunkhash:7].js",
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
    filename: "[name].js",
  },

  plugins: [
    new NpmInstallPlugin({
      cli: {
        save: true,
        saveExact: true,
      },
    }),
  ],
};
