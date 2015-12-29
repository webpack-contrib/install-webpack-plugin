var installer = require("./installer");
var path = require("path");
var parser = require("./parser");

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

  installer.install(missing);

  this.callback(null, source, map);
};
