module.exports.resolve = function(normalModuleFactory) {
  normalModuleFactory
    .hooks
    .resolver
    .tap("npm-install-plugin", prev => (data, callback) => {
      const new_callback = (err, ...args) => {
        if (err) {
          const request = depFromErr(err.toString());
          let dev = this.options.dev;

          if (typeof this.options.dev === "function") {
            dev = !!this.options.dev(request);
          }
          const dep = installer.check(request)
          installer.install(dep, Object.assign({}, this.options), {dev: dev});
        }
        callback(err, ...args)
      }
      prev(data, new_callback)
    })
};

module.exports.apply = function(compiler) {
  this.compiler = compiler;

  compiler.hooks.watchRun.tapAsync('npm-install-plugin', this.preCompile.bind(this));

  if (Array.isArray(compiler.options.externals)) {
    compiler.options.externals.unshift(this.resolveExternal.bind(this));
  }
  compiler.hooks.afterResolvers.tap("npm-install-plugin", compiler => {
    const project_root = process.cwd()
    compiler
      .hooks
      .normalModuleFactory
      .tap('npm-install-plugin', this.resolve.bind(this))
  })
};

