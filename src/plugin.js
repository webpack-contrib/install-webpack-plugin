/* eslint-disable consistent-return */
/* eslint-disable no-useless-escape */
const path = require('path');

const { createFsFromVolume, Volume } = require('memfs');
const webpack = require('webpack');

const installer = require('./installer');
const utils = require('./utils');

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
  const matches = /(?:(?:Cannot resolve module)|(?:Can't resolve)) '([@\w\/\.-]+)' in/.exec(
    err
  );

  if (!matches) {
    return;
  }

  return matches[1];
};

class NpmInstallPlugin {
  constructor(options) {
    this.preCompiler = null;
    this.compiler = null;
    this.options = Object.assign(installer.defaultOptions, options);
    this.resolving = {};

    installer.checkBabel();
  }
  apply(compiler) {
    this.compiler = compiler;
    const plugin = { name: 'NpmInstallPlugin' };

    // Recursively install missing dependencies so primary build doesn't fail
    compiler.hooks.watchRun.tapAsync(plugin, this.preCompile.bind(this));

    // Install externals that wouldn't normally be resolved
    if (Array.isArray(compiler.options.externals)) {
      compiler.options.externals.unshift(this.resolveExternal.bind(this));
    }

    compiler.hooks.afterResolvers.tap(plugin, () => {
      // Install loaders on demand
      compiler.resolverFactory.hooks.resolver.tap(
        'loader',
        plugin,
        (resolver) => {
          resolver.hooks.module.tapAsync(
            'NpmInstallPlugin',
            this.resolveLoader.bind(this)
          );
        }
      );

      // Install project dependencies on demand
      compiler.resolverFactory.hooks.resolver.tap(
        'normal',
        plugin,
        (resolver) => {
          resolver.hooks.module.tapAsync(
            'NpmInstallPlugin',
            this.resolveModule.bind(this)
          );
        }
      );
    });
  }

  install(result) {
    if (!result) {
      return;
    }

    const dep = installer.check(result.request);

    if (dep) {
      let { dev } = this.options;

      if (typeof this.options.dev === 'function') {
        dev = !!this.options.dev(result.request, result.path);
      }

      installer.install(dep, Object.assign({}, this.options, { dev }));
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
          // Ensure fresh cache
          cache: {},
          // Register plugin to install missing deps
          plugins: [new NpmInstallPlugin(this.options)],
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
    if (context.match('node_modules')) {
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
      'normal',
      result,
      // eslint-disable-next-line func-names
      function(err) {
        if (err) {
          this.install(Object.assign({}, result, { request: depFromErr(err) }));
        }

        callback();
      }.bind(this)
    );
  }

  resolve(resolver, result, callback) {
    // eslint-disable-next-line
    const { version } = require('webpack');
    const major = version.split('.').shift();

    if (major === '4') {
      return this.compiler.resolverFactory
        .get(resolver)
        .resolve(
          result.context || {},
          result.path,
          result.request,
          {},
          callback
        );
    }

    throw new Error(`Unsupported Webpack version: ${version}`);
  }

  resolveLoader(result, resolveContext, next) {
    // Only install direct dependencies, not sub-dependencies
    if (result.path.match('node_modules')) {
      return next();
    }

    if (this.resolving[result.request]) {
      return next();
    }

    this.resolving[result.request] = true;

    this.resolve(
      'loader',
      result,
      // eslint-disable-next-line func-names
      function(err) {
        this.resolving[result.request] = false;

        if (err) {
          const loader = utils.normalizeLoader(result.request);
          this.install(Object.assign({}, result, { request: loader }));
        }

        return next();
      }.bind(this)
    );
  }

  resolveModule(result, resolveContext, next) {
    // Only install direct dependencies, not sub-dependencies
    if (result.path.match('node_modules')) {
      return next();
    }

    if (this.resolving[result.request]) {
      return next();
    }

    this.resolving[result.request] = true;

    this.resolve(
      'normal',
      result,
      // eslint-disable-next-line func-names
      function(err) {
        this.resolving[result.request] = false;

        if (err) {
          this.install(Object.assign({}, result, { request: depFromErr(err) }));
        }

        return next();
      }.bind(this)
    );
  }
}

module.exports = NpmInstallPlugin;
