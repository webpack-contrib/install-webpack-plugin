const util = require('util');

const webpack = require('webpack');

const installer = require('../src/installer');
const Plugin = require('../src/plugin');

describe('plugin', () => {
  beforeEach(async () => {
    this.check = jest
      .spyOn(installer, 'check')
      .mockImplementation((dep) => dep);

    this.checkBabel = jest.spyOn(installer, 'checkBabel');

    this.compiler = await webpack({});

    this.install = jest
      .spyOn(installer, 'install')
      .mockImplementation(() => {});
    this.next = jest.fn();

    this.options = {
      dependencies: {
        dev: false,
        peer: true,
      },
      packageManagerOptions: {
        dev: false,
      },
      quiet: false,
      prompt: true,
      npm: true,
    };

    this.plugin = new Plugin(this.options);

    this.applySpy = jest.spyOn(this.plugin, 'apply');

    this.plugin.apply(this.compiler);
  });

  afterEach(() => {
    this.check.mockRestore();
    this.checkBabel.mockRestore();
    this.install.mockRestore();
    this.next.mockRestore();
    this.applySpy.mockRestore();
  });

  it('should checkBabel', () => {
    expect(this.checkBabel).toHaveBeenCalled();
  });

  it('should accept options', () => {
    expect(this.plugin.options).toEqual(this.options);
  });

  describe('.apply', () => {
    it('should apply the plugin only once`', () => {
      expect(this.applySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('.preCompile', () => {
    beforeEach(() => {
      this.run = jest
        .spyOn(webpack.Compiler.prototype, 'run')
        .mockImplementation((callback) => {
          callback();
        });
    });

    afterEach(() => {
      this.run.mockRestore();
    });

    it('should perform dryrun', (done) => {
      const compilation = {};

      this.plugin.preCompile(
        compilation,
        // eslint-disable-next-line
        function () {
          expect(this.run).toHaveBeenCalled();
          done();
        }.bind(this)
      );
    });
  });

  describe('.resolveExternal', () => {
    beforeEach(() => {
      this.resolve = jest
        .spyOn(this.plugin, 'resolve')
        .mockImplementation((resolver, result, callback) => {
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
      this.resolve.mockRestore();
    });

    it('should ignore node_modules', (done) => {
      this.plugin.resolveExternal(
        'node_modules',
        'express',
        // eslint-disable-next-line
        function () {
          expect(this.resolve).not.toHaveBeenCalled();
          done();
        }.bind(this)
      );
    });

    it('should ignore inline-loaders', (done) => {
      this.plugin.resolveExternal(
        'src',
        'bundle?lazy!express',
        // eslint-disable-next-line
        function () {
          expect(this.resolve).not.toHaveBeenCalled();
          done();
        }.bind(this)
      );
    });

    it('should resolve external deps', (done) => {
      this.plugin.resolveExternal(
        'src',
        'express',
        // eslint-disable-next-line
        function () {
          expect(this.resolve).toHaveBeenCalled();
          expect(this.check).toHaveBeenCalled();
          expect(this.install).toHaveBeenCalled();
          expect(this.check).toHaveBeenCalledWith('express');
          expect(this.install.mock.calls[0]).toMatchSnapshot();
          done();
        }.bind(this)
      );
    });
  });

  describe('.resolveLoader', () => {
    it('should call .resolve', () => {
      const result = { path: '/', request: 'babel-loader' };

      jest
        .spyOn(this.plugin, 'resolve')
        .mockImplementation((resolver, res, callback) => {
          callback(null);
        });

      const install = jest.spyOn(this.plugin, 'install');

      this.plugin.resolveLoader(result, this.next);

      // no installs because the package was resolved
      expect(install.mock.calls.length).toBe(0);
      expect(this.next.mock.calls.length).toBe(1);
      expect(this.next.mock.calls[0]).toEqual([]);
    });

    it('should call .resolve and install if not resolved', () => {
      const result = { path: '/', request: 'babel-loader' };

      jest
        .spyOn(this.plugin, 'resolve')
        .mockImplementation((resolver, res, callback) => {
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

      const install = jest.spyOn(this.plugin, 'install');

      this.plugin.resolveLoader(result, this.next);

      // Should install the package when not found
      expect(install.mock.calls.length).toBe(1);
      expect(this.next.mock.calls.length).toBe(1);
    });
  });

  describe('.resolveModule', () => {
    it('should prevent cyclical installs', () => {
      const result = { path: '/', request: 'foo' };

      this.plugin.resolving.add('foo');

      this.plugin.resolveModule(result, this.next);

      expect(this.install.mock.calls.length).toBe(0);
      expect(this.next.mock.calls.length).toBe(1);
    });

    it('should call .resolve if direct dependency', () => {
      const result = { path: '/', request: 'foo' };

      jest
        .spyOn(this.plugin, 'resolve')
        .mockImplementation((resolver, res, callback) => {
          callback(new Error("Can't resolve '@cycle/core' in '/'"));
        });

      this.plugin.resolveModule(result, this.next);

      expect(this.install.mock.calls.length).toBe(1);
      expect(this.next.mock.calls.length).toBe(1);
      expect(this.next.mock.calls[0]).toEqual([]);
    });

    it('should call not .resolve if sub-dependency', () => {
      const result = { path: 'node_modules', request: 'foo' };

      this.plugin.resolveModule(result, this.next);

      expect(this.install.mock.calls.length).toBe(0);
      expect(this.next.mock.calls.length).toBe(1);
    });
  });
});
