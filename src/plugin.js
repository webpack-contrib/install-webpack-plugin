var path = require("path");

var installer = require("./installer");

function NpmInstallPlugin(options) {
  this.options = options || {};
}

NpmInstallPlugin.prototype.apply = function(compiler) {
  // Plugin needs to intercept module resolution before the "official" resolve
  compiler.plugin("normal-module-factory", this.listenToFactory);

  // Install loaders on demand
  compiler.resolvers.loader.plugin("module", this.resolveLoader.bind(this));

  // Install project dependencies on demand
  compiler.resolvers.normal.plugin("module", this.resolveModule.bind(this));
};

NpmInstallPlugin.prototype.listenToFactory = function(factory) {
  factory.plugin("before-resolve", function(result, next) {
    // Trigger early-module resolution
    factory.resolvers.normal.resolve(result.context, result.request, function(err, filepath) {
      next(null, result);
    });
  });
};

NpmInstallPlugin.prototype.resolve = function(result) {
  var dep = installer.check(result.request);

  if (dep) {
    installer.install(dep, this.options);
  }

  return dep;
};

NpmInstallPlugin.prototype.resolveModule = function(result, next) {
  // Only install direct dependencies, not sub-dependencies
  if (!result.path.match("node_modules")) {
    this.resolve(result);
  }

  next();
};

NpmInstallPlugin.prototype.resolveLoader = function(result, next) {
  this.resolve(result);

  next();
};

module.exports = NpmInstallPlugin;
