/**
 * Ensure loaders end with `-loader` (e.g. `babel` => `babel-loader`)
 * Also force Webpack2's duplication of `-loader` to a single occurrence
 */
module.exports.normalizeLoader = function(loader) {
  return loader             // e.g. react-hot-loader/webpack
         .split("/")        // ["react-hot-loader", "webpack"]
         .shift()           // "react-hot-loader"
         .split("-loader")  // ["react-hot", ""]
         .shift()           // "react-hot"
         .concat("-loader") // "react-hot-loader"
}
