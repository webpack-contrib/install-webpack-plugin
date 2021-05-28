/* eslint-disable consistent-return */
/* eslint-disable no-useless-escape */

const installer = require('./installer');
const utils = require('./utils');

const PLUGIN_NAME = 'NpmInstallPlugin';

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

class NpmInstallPlugin {
  constructor(options) {
    this.preCompiler = undefined;
    this.compiler = undefined;
    this.options = { ...installer.defaultOptions, ...options };
    this.resolving = new Set();

    installer.checkBabel();
  }

  apply(compiler) {
    this.compiler = compiler;

    // Install externals that wouldn't normally be resolved
    if (Array.isArray(compiler.options.externals)) {
      compiler.options.externals.unshift(this.resolveExternal.bind(this));
    }

    compiler.hooks.afterResolvers.tap(PLUGIN_NAME, () => {
      // Install loaders on demand
      compiler.resolverFactory.hooks.resolver
        .for('loader')
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.module.tapAsync(
            PLUGIN_NAME,
            this.resolveLoader.bind(this)
          );
        });

      // Install project dependencies on demand
      compiler.resolverFactory.hooks.resolver
        .for('normal')
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.module.tapAsync(
            PLUGIN_NAME,
            this.resolveModule.bind(this)
          );
        });
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
      (err) => {
        if (err) {
          this.install(Object.assign({}, result, { request: depFromErr(err) }));
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
    if (result.path.match('node_modules')) {
      return next && next();
    }

    if (this.resolving.has(result.request)) {
      return next && next();
    }

    this.resolving.add(result.request);

    this.resolve(
      'loader',
      result,
      // eslint-disable-next-line func-names
      (err) => {
        this.resolving.delete(result.request);

        if (err) {
          const loader = utils.normalizeLoader(result.request);
          this.install(Object.assign({}, result, { request: loader }));
        }

        return next && next();
      }
    );
  }

  resolveModule(result, next) {
    // Only install direct dependencies, not sub-dependencies
    if (result.path.match('node_modules')) {
      return next();
    }

    if (this.resolving.has(result.request)) {
      return next();
    }

    this.resolving.add(result.request);

    this.resolve(
      'normal',
      result,
      // eslint-disable-next-line func-names
      (err) => {
        this.resolving.delete(result.request);

        if (err) {
          this.install(Object.assign({}, result, { request: depFromErr(err) }));
        }

        return next();
      }
    );
  }
}

module.exports = NpmInstallPlugin;
