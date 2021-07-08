/* eslint-disable consistent-return */
/* eslint-disable no-useless-escape */
const path = require("path");

const { createFsFromVolume, Volume } = require("memfs");
const { validate } = require("schema-utils");
const webpack = require("webpack");

const installer = require("./installer");
const utils = require("./utils");
const schema = require("./options.json");

const PLUGIN_NAME = "InstallPlugin";

const depFromErr = (err) => {
  if (!err) {
    return;
  }

  /**
   * Supported package formats:
   * - path
   * - react-lite
   * - @cycle/core
   * - bootswatch/lumen/bootstrap.css
   * - lodash.random
   */
  const matches =
    /(?:(?:Cannot resolve module)|(?:Can't resolve)) '([@\w\/\.-]+)' in/.exec(
      err
    );

  if (!matches) {
    return;
  }

  return matches[1];
};

class InstallPlugin {
  constructor(options) {
    validate(schema, options, "install-webpack-plugin");

    this.preCompiler = null;
    this.compiler = null;
    this.logger = null;
    this.options = { ...installer.defaultOptions, ...options };
    this.resolving = new Set();
  }

  apply(compiler) {
    this.compiler = compiler;

    this.logger = compiler.getInfrastructureLogger("install-webpack-plugin");

    installer.checkBabel(this.options, this.logger);

    // Recursively install missing dependencies so primary build doesn't fail
    compiler.hooks.watchRun.tapAsync(PLUGIN_NAME, this.preCompile.bind(this));

    // Install externals that wouldn't normally be resolved
    if (Array.isArray(compiler.options.externals)) {
      compiler.options.externals.unshift(this.resolveExternal.bind(this));
    }

    compiler.hooks.afterResolvers.tap(PLUGIN_NAME, () => {
      // Install loaders on demand
      compiler.resolverFactory.hooks.resolver
        .for("loader")
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.module.tapAsync(
            PLUGIN_NAME,
            this.resolveLoader.bind(this)
          );
        });

      // Install project dependencies on demand
      compiler.resolverFactory.hooks.resolver
        .for("normal")
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.module.tapAsync(
            PLUGIN_NAME,
            this.resolveModule.bind(this)
          );
        });
    });
  }

  install(result, logger) {
    if (!result) {
      return;
    }

    const dep = installer.check(result.request);

    if (dep) {
      let { packageManager } = this.options;

      if (typeof packageManager === "function") {
        packageManager = packageManager(result.request, result.path);
      }

      installer.install(
        dep,
        Object.assign({}, this.options, { packageManager }),
        logger
      );
    }
  }

  preCompile(compilation, next) {
    if (!this.preCompiler) {
      const { options } = this.compiler;
      const config = Object.assign(
        // Start with new config object
        {},
        // Inherit the current config
        options,
        {
          // Register plugin to install missing deps
          plugins: [new InstallPlugin(this.options)],
        }
      );

      this.preCompiler = webpack(config);
      this.preCompiler.outputFileSystem = createFsFromVolume(new Volume());
      this.preCompiler.outputFileSystem.join = path.join.bind(path);
    }

    this.preCompiler.run(next);
  }

  resolveExternal(context, request, callback) {
    // Only install direct dependencies, not sub-dependencies
    if (context.match("node_modules")) {
      return callback();
    }

    // Ignore !!bundle?lazy!./something
    if (request.match(/(\?|\!)/)) {
      return callback();
    }

    const result = {
      context: {},
      path: context,
      request,
    };

    this.resolve(
      "normal",
      result,
      // eslint-disable-next-line func-names
      (err) => {
        if (err) {
          this.install(
            Object.assign({}, result, { request: depFromErr(err) }),
            this.logger
          );
        }

        callback();
      }
    );
  }

  resolve(resolver, result, callback) {
    return this.compiler.resolverFactory
      .get(resolver)
      .resolve(result.context || {}, result.path, result.request, {}, callback);
  }

  resolveLoader(result, next) {
    // Only install direct dependencies, not sub-dependencies
    if (result.path.match("node_modules")) {
      return next && next();
    }

    if (this.resolving.has(result.request)) {
      return next && next();
    }

    this.resolving.add(result.request);

    this.resolve(
      "loader",
      result,
      // eslint-disable-next-line func-names
      (err) => {
        this.resolving.delete(result.request);

        if (err) {
          const loader = utils.normalizeLoader(result.request);
          this.install(
            Object.assign({}, result, { request: loader }),
            this.logger
          );
        }

        return next && next();
      }
    );
  }

  resolveModule(result, next) {
    // Only install direct dependencies, not sub-dependencies
    if (result.path.match("node_modules")) {
      return next();
    }

    if (this.resolving.has(result.request)) {
      return next();
    }

    this.resolving.add(result.request);

    this.resolve(
      "normal",
      result,
      // eslint-disable-next-line func-names
      (err) => {
        this.resolving.delete(result.request);

        if (err) {
          this.install(
            Object.assign({}, result, { request: depFromErr(err) }),
            this.logger
          );
        }

        return next();
      }
    );
  }
}

module.exports = InstallPlugin;
