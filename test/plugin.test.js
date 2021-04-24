const util = require('util');

const expect = require('expect');

const webpack = require('webpack');

const installer = require('../src/installer');
const Plugin = require('../src/plugin');

// TODO: fix me
describe.skip('plugin', () => {
  beforeEach(() => {
    this.check = expect.spyOn(installer, 'check').andCall((dep) => {
      return dep;
    });

    this.checkBabel = expect.spyOn(installer, 'checkBabel');

    this.compiler = {
      // Webpack >= 2 will reject config without an entry
      options: {
        entry() {
          return {};
        },
      },
      plugin: expect.createSpy().andCall(
        function(event, cb) {
          if (event === 'after-resolvers') {
            cb(this.compiler);
          }
        }.bind(this)
      ),
      resolvers: {
        loader: {
          plugin: expect.createSpy(),
          resolve: expect.createSpy(),
        },
        normal: {
          plugin: expect.createSpy(),
          resolve: expect.createSpy(),
        },
      },
    };

    this.install = expect.spyOn(installer, 'install');
    this.next = expect.createSpy();

    this.options = {
      dev: false,
      peerDependencies: true,
      quiet: false,
      npm: 'npm',
    };

    this.plugin = new Plugin(this.options);

    this.plugin.apply(this.compiler);
  });

  afterEach(() => {
    this.check.restore();
    this.checkBabel.restore();
    this.install.restore();
    this.next.restore();
  });

  it('should checkBabel', () => {
    expect(this.checkBabel).toHaveBeenCalled();
  });

  it('should accept options', () => {
    expect(this.plugin.options).toEqual(this.options);
  });

  describe('.apply', () => {
    it('should hook into `watch-run`', () => {
      expect(this.compiler.plugin.calls.length).toBe(2);
      expect(this.compiler.plugin.calls[0].arguments).toEqual([
        'watch-run',
        this.plugin.preCompile.bind(this.plugin),
      ]);
    });

    it('should hook into `after-resolvers`', () => {
      expect(this.compiler.plugin.calls.length).toBe(2);
      expect(this.compiler.plugin.calls[1].arguments[0]).toEqual(
        'after-resolvers'
      );
      expect(this.compiler.resolvers.loader.plugin.calls.length).toBe(1);
      expect(this.compiler.resolvers.loader.plugin.calls[0].arguments).toEqual([
        'module',
        this.plugin.resolveLoader.bind(this.plugin),
      ]);
      expect(this.compiler.resolvers.normal.plugin.calls.length).toBe(1);
      expect(this.compiler.resolvers.normal.plugin.calls[0].arguments).toEqual([
        'module',
        this.plugin.resolveModule.bind(this.plugin),
      ]);
    });
  });

  describe('.preCompile', () => {
    beforeEach(() => {
      this.run = expect
        .spyOn(webpack.Compiler.prototype, 'run')
        .andCall((callback) => {
          callback();
        });
    });

    afterEach(() => {
      this.run.restore();
    });

    it('should perform dryrun', (done) => {
      const compilation = {};

      this.plugin.preCompile(
        compilation,
        function() {
          expect(this.run).toHaveBeenCalled();
          done();
        }.bind(this)
      );
    });
  });

  describe('.resolveExternal', () => {
    beforeEach(() => {
      this.resolve = expect
        .spyOn(this.plugin, 'resolve')
        .andCall((resolver, result, callback) => {
          callback(
            new Error(
              util.format(
                "Can't resolve '%s' in '%s'",
                result.request,
                result.path
              )
            )
          );
        });
    });

    afterEach(() => {
      this.resolve.restore();
    });

    it('should ignore node_modules', (done) => {
      this.plugin.resolveExternal(
        'node_modules',
        'express',
        function() {
          expect(this.resolve).toNotHaveBeenCalled();
          done();
        }.bind(this)
      );
    });

    it('should ignore inline-loaders', (done) => {
      this.plugin.resolveExternal(
        'src',
        'bundle?lazy!express',
        function() {
          expect(this.resolve).toNotHaveBeenCalled();
          done();
        }.bind(this)
      );
    });

    it('should resolve external deps', (done) => {
      this.plugin.resolveExternal(
        'src',
        'express',
        function() {
          expect(this.resolve).toHaveBeenCalled();
          expect(this.check).toHaveBeenCalled();
          expect(this.install).toHaveBeenCalled();

          expect(this.check.calls[0].arguments[0]).toEqual('express');
          expect(this.install.calls[0].arguments[0]).toEqual('express');
          done();
        }.bind(this)
      );
    });
  });

  describe('.resolveLoader', () => {
    it('should call .resolve', () => {
      const result = { path: '/', request: 'babel-loader' };

      this.compiler.resolvers.loader.resolve.andCall(
        (context, path, request, callback) => {
          callback(null);
        }
      );

      const install = expect.spyOn(this.plugin, 'install');

      this.plugin.resolveLoader(result, this.next);

      expect(this.compiler.resolvers.loader.resolve.calls.length).toBe(1);
      expect(install.calls.length).toBe(0);
      expect(this.next.calls.length).toBe(1);
      expect(this.next.calls[0].arguments).toEqual([]);
    });
    it('should call .resolve and install if not resolved', () => {
      const result = { path: '/', request: 'babel-loader' };

      this.compiler.resolvers.loader.resolve.andCall(
        (context, path, request, callback) => {
          callback(new Error("Can't resolve 'babel-loader' in 'node_modules'"));
        }
      );

      const install = expect.spyOn(this.plugin, 'install');

      this.plugin.resolveLoader(result, this.next);

      expect(this.compiler.resolvers.loader.resolve.calls.length).toBe(1);
      expect(install.calls.length).toBe(1);
      expect(this.next.calls.length).toBe(1);
      expect(this.next.calls[0].arguments).toEqual([]);
    });
  });

  describe('.resolveModule', () => {
    it('should prevent cyclical installs', () => {
      const result = { path: '/', request: 'foo' };

      this.plugin.resolving.foo = true;

      this.plugin.resolveModule(result, this.next);

      expect(this.compiler.resolvers.normal.resolve.calls.length).toBe(0);
      expect(this.next.calls.length).toBe(1);
    });

    it('should call .resolve if direct dependency', () => {
      const result = { path: '/', request: 'foo' };

      this.compiler.resolvers.normal.resolve.andCall(
        (context, path, request, callback) => {
          callback(new Error("Can't resolve '@cycle/core' in '/'"));
        }
      );

      this.plugin.resolveModule(result, this.next);

      expect(this.compiler.resolvers.normal.resolve.calls.length).toBe(1);
      expect(this.next.calls.length).toBe(1);
      expect(this.next.calls[0].arguments).toEqual([]);
    });

    it('should call not .resolve if sub-dependency', () => {
      const result = { path: 'node_modules', request: 'foo' };

      this.plugin.resolveModule(result, this.next);

      expect(this.compiler.resolvers.normal.resolve.calls.length).toBe(0);
      expect(this.next.calls.length).toBe(1);
    });
  });
});
