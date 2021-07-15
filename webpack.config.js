const InstallPlugin = require('./index');

module.exports = {
  mode: "development",
  entry: './sb/index',
  plugins: [
    new InstallPlugin({
      packageManager: 'npm',
      // prompt: false
      // dev: false,
      // peerDependencies: true,
      // quiet: false,
      // npm: 'npm'
    }),
  ]
}
