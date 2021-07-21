const InstallPlugin = require("./index");

module.exports = {
  mode: "development",
  entry: "./sb/index",
  module: {
    rules: [
      {
        test: /\.css/,
        loader: "css-loader",
      },
    ],
  },
  plugins: [
    new InstallPlugin({
      // prompt: false
      // dev: false,
      // peerDependencies: true,
      // quiet: false,
      // npm: 'npm'
    }),
  ],
};
