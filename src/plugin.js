var path = require("path");

var installer = require("./installer");

function NpmInstallPlugin(options) {
  this.options = options || {};
}

NpmInstallPlugin.prototype.installModule = function(result, next) {
  var dep = installer.check(result.request);

  if (dep) {
    installer.install(dep, this.options.cli);
  }

  next();
};

NpmInstallPlugin.prototype.apply = function(compiler) {
  // Install loaders on demand
  compiler.resolvers.loader.plugin("module", this.installModule.bind(this));

  // Install project dependencies on demand
  compiler.resolvers.normal.plugin("module", function(result, next) {
    // Skip dependencies of dependencies
    if (result.path.match("node_modules")) {
      return next();
    }

    this.installModule(result, next);
  }.bind(this));

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
