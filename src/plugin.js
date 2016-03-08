var path = require("path");

var installer = require("./installer");

var depFromErr = function(err) {
  if (!err) {
    return undefined;
  }

  /**
   * Supported package formats:
   * - path
   * - react-lite
   * - @cycle/core
   * - bootswatch/lumen/bootstrap.css
   */
  var matches = /Cannot resolve module '([@\w\/\.-]+)' in/.exec(err);

  if (!matches) {
    return undefined;
  }

  return matches[1];
}

function NpmInstallPlugin(options) {
  this.compiler = null;
  this.options = options || {};
  this.resolving = {};
}

NpmInstallPlugin.prototype.apply = function(compiler) {
  this.compiler = compiler;

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

NpmInstallPlugin.prototype.resolveLoader = function(result, next) {
  var loader = result.request;

  // Ensure loaders end with `-loader` (e.g. `babel` => `babel-loader`)
  if (!loader.match(/\-loader$/)) {
    loader += "-loader";
  }

  var dep = installer.check(loader);

  if (dep) {
    installer.install(dep, this.options);
  }

  next();
};

NpmInstallPlugin.prototype.resolveModule = function(result, next) {
  // Only install direct dependencies, not sub-dependencies
  if (result.path.match("node_modules")) {
    return next();
  }

  if (this.resolving[result.request]) {
    return next();
  }

  this.resolving[result.request] = true;

  this.compiler.resolvers.normal.resolve(
    result.path,
    result.request,
    function(err, filepath) {
      this.resolving[result.request] = false;

      if (err) {
        var dep = installer.check(depFromErr(err));

        if (dep) {
          installer.install(dep, this.options);

          return this.resolveModule(result, next);
        }
      }

      next();
    }.bind(this)
  );
};

module.exports = NpmInstallPlugin;
