var MemoryFS = require("memory-fs");
var webpack = require("webpack");

var installer = require("./installer");
var utils = require("./utils");

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
   * - lodash.random
   */
  var matches = /(?:(?:Cannot resolve module)|(?:Can't resolve)) '([@\w\/\.-]+)' in/.exec(err);

  if (!matches) {
    return undefined;
  }

  return matches[1];
}

function NpmInstallPlugin(options) {
  this.preCompiler = null;
  this.compiler = null;
  this.options = Object.assign(installer.defaultOptions, options);
  this.resolving = {};

  installer.checkBabel();
}

NpmInstallPlugin.prototype.apply = function(compiler) {
  this.compiler = compiler;

  // Recursively install missing dependencies so primary build doesn't fail
  compiler.plugin("watch-run", this.preCompile.bind(this));

  // Install externals that wouldn't normally be resolved
  if (Array.isArray(compiler.options.externals)) {
    compiler.options.externals.unshift(this.resolveExternal.bind(this));
  }

  compiler.plugin("after-resolvers", function(compiler) {
    // Install loaders on demand
    compiler.resolvers.loader.plugin("module", this.resolveLoader.bind(this));

    // Install project dependencies on demand
    compiler.resolvers.normal.plugin("module", this.resolveModule.bind(this));
  }.bind(this))
};

NpmInstallPlugin.prototype.install = function(result) {
  if (!result) {
    return;
  }

  var dep = installer.check(result.request);

  if (dep) {
    var dev = this.options.dev;

    if (typeof this.options.dev === "function") {
      dev = !!this.options.dev(result.request, result.path);
    }

    installer.install(dep, Object.assign({}, this.options, { dev: dev }));
  }
}

NpmInstallPlugin.prototype.preCompile = function(compilation, next) {
  if (!this.preCompiler) {
    var options = this.compiler.options;
    var config = Object.assign(
      // Start with new config object
      {},
      // Inherit the current config
      options,
      {
        // Ensure fresh cache
        cache: {},
        // Register plugin to install missing deps
        plugins: [
          new NpmInstallPlugin(this.options),
        ],
      }
    );

    this.preCompiler = webpack(config);
    this.preCompiler.outputFileSystem = new MemoryFS();
  }

  this.preCompiler.run(next);
};

NpmInstallPlugin.prototype.resolveExternal = function(context, request, callback) {
  // Only install direct dependencies, not sub-dependencies
  if (context.match("node_modules")) {
    return callback();
  }

  // Ignore !!bundle?lazy!./something
  if (request.match(/(\?|\!)/)) {
    return callback();
  }

  var result = {
    context: {},
    path: context,
    request: request,
  };

  this.resolve('normal', result, function(err, filepath) {
    if (err) {
      this.install(Object.assign({}, result, { request: depFromErr(err) }));
    }

    callback();
  }.bind(this));
};

NpmInstallPlugin.prototype.resolve = function(resolver, result, callback) {
  var version = require("webpack/package.json").version;
  var major = version.split(".").shift();

  if (major === "1") {
    return this.compiler.resolvers[resolver].resolve(
      result.path,
      result.request,
      callback
    );
  }

  if (major === "2") {
    return this.compiler.resolvers[resolver].resolve(
      result.context || {},
      result.path,
      result.request,
      callback
    );
  }

  throw new Error("Unsupported Webpack version: " + version);
}

NpmInstallPlugin.prototype.resolveLoader = function(result, next) {
  // Only install direct dependencies, not sub-dependencies
  if (result.path.match("node_modules")) {
    return next();
  }

  if (this.resolving[result.request]) {
    return next();
  }

  this.resolving[result.request] = true;

  this.resolve("loader", result, function(err, filepath) {
    this.resolving[result.request] = false;

    if (err) {
      var loader = utils.normalizeLoader(result.request);
      this.install(Object.assign({}, result, { request: loader }));
    }

    return next();
  }.bind(this));
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

  this.resolve('normal', result, function(err, filepath) {
    this.resolving[result.request] = false;

    if (err) {
      this.install(Object.assign({}, result, { request: depFromErr(err) }));
    }

    return next();
  }.bind(this));
};

module.exports = NpmInstallPlugin;
