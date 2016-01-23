var path = require("path");

var installer = require("./installer");

function NpmInstallPlugin(options) {
  this.options = options || {};
}

NpmInstallPlugin.prototype.apply = function(compiler) {
  var cli = this.options.cli;

  compiler.resolvers.normal.plugin("module", function(result, next) {
    if (result.path.match("node_modules")) {
      return next();
    }

    var dep = installer.check(result.request);

    // Dependency needs to be installed
    if (dep) {
      installer.install(dep, cli);
    }

    next();
  });

  compiler.plugin("normal-module-factory", function(factory) {
    factory.plugin("before-resolve", function(result, next) {
      // Trigger early-module resolution
      factory.resolvers.normal.resolve(result.context, result.request, function(err, filepath) {
        next(null, result);
      });
    });
  });
};

module.exports = NpmInstallPlugin;
