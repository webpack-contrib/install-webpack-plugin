var installer = require("./installer");
var loaderUtils = require("loader-utils");
var path = require("path");
var parser = require("./parser");
var util = require("util");

module.exports = function loader(source, map) {
  if (this.cacheable) {
    this.cacheable();
  }

  var context = this.options.context || process.cwd();
  var resolve = this.options.resolve;

  var dependencies = parser.parse(source);

  var modulePaths = [].concat(
    resolve.root || [],
    resolve.modulesDirectories || []
  ).map(function(dir) {
    return path.resolve(context, dir);
  });

  var missing = installer.check(dependencies, modulePaths);
  var query = loaderUtils.parseQuery(this.query);

  installer.install(missing, query.cli);

  this.callback(null, source, map);
};
