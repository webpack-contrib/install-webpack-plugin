var expect = require('chai').expect;
var installer = require("../src/installer");
var Plugin = require("../src/plugin");
var util = require("util");
var webpack = require("webpack");
var sinon = require('sinon');


describe('plugin', function() {
  var sandbox= sinon.createSandbox();
    beforeEach(function() {
      this.check = sinon.spy(installer, 'check');

      this.checkBabel = sinon.spy(installer, 'checkBabel');

      this.compiler = {
        // Webpack >= 2 will reject config without an entry
        options: {
          entry: function() {
            return {};
          }
        },
        plugin: sinon.spy(),
        resolvers: {
          loader: {
            plugin: sinon.spy(),
            resolve: sinon.spy()
          },
          normal: {
            plugin: sinon.spy(),
            resolve: sinon.spy()
          }
        }
      };

      this.install = sinon.spy(installer, 'install');
      this.next = sinon.spy();

      this.options = {
        dev: false,
        peerDependencies: true,
        quiet: false,
        npm: 'npm'
      };

      this.plugin = new Plugin(this.options);

      this.plugin.apply(this.compiler);
    });

    afterEach(function() {
      this.check.restore();
      this.checkBabel.restore();
      this.install.restore();
      this.next.restore();
    });

    it('should checkBabel', function() {
      expect(this.checkBabel.called).to.equal(true);
    });

    it('should accept options', function() {
      expect(this.plugin.options).to.equal(this.options);
    });

    describe('.apply', function() {
      it('should hook into `watch-run`', function() {
        expect(this.compiler.plugin.calls.length).to.equal(2);
        expect(this.compiler.plugin.calls[0].arguments).to.equal([
          'watch-run',
          this.plugin.preCompile.bind(this.plugin)
        ]);
      });

      it('should hook into `after-resolvers`', function() {
        expect(this.compiler.plugin.calls.length).to.equal(2);
        expect(this.compiler.plugin.calls[1].arguments[0]).to.equal(
          'after-resolvers'
        );
        expect(this.compiler.resolvers.loader.plugin.calls.length).to.equal(1);
        expect(
          this.compiler.resolvers.loader.plugin.calls[0].arguments
        ).to.equal(['module', this.plugin.resolveLoader.bind(this.plugin)]);

        expect(this.compiler.resolvers.normal.plugin.calls.length).to.equal(1);
        expect(
          this.compiler.resolvers.normal.plugin.calls[0].arguments
        ).to.equal(['module', this.plugin.resolveModule.bind(this.plugin)]);
      });
    });

    describe('.preCompile', function() {
      beforeEach(function() {
        this.run = sinon
        .spy(webpack.Compiler.prototype, 'run')
      });

      afterEach(function() {
        this.run.restore();
      });

      it('should perform dryrun', function(done) {
        var compilation = {};

        this.plugin.preCompile(
          compilation,
          function() {
            expect(this.run).toHaveBeenCalled();
            done();
          }.bind(this)
        );
      });
    });

    describe('.resolveExternal', function() {
      beforeEach(function() {
        this.resolve = sinon
          .spy(this.plugin, 'resolve')
      });

      afterEach(function() {
        this.resolve.restore();
      });

      it('should ignore node_modules', function(done) {
        this.plugin.resolveExternal(
          'node_modules',
          'express',
          function() {
            expect(this.resolve).toNotHaveBeenCalled();
            done();
          }.bind(this)
        );
      });

      it('should ignore inline-loaders', function(done) {
        this.plugin.resolveExternal(
          'src',
          'bundle?lazy!express',
          function() {
            expect(this.resolve).toNotHaveBeenCalled();
            done();
          }.bind(this)
        );
      });

      it('should resolve external deps', function(done) {
        this.plugin.resolveExternal(
          'src',
          'express',
          function() {
            expect(this.resolve).toHaveBeenCalled();
            expect(this.check).toHaveBeenCalled();
            expect(this.install).toHaveBeenCalled();

            expect(this.check.calls[0].arguments[0]).to.equal('express');
            expect(this.install.calls[0].arguments[0]).to.equal('express');
            done();
          }.bind(this)
        );
      });
    });

    describe('.resolveLoader', function() {
      it('should call .resolve', function() {
        var result = { path: '/', request: 'babel-loader' };

        this.compiler.resolvers.loader.resolve.andCall(
          function(context, path, request, callback) {
            callback(null);
          }.bind(this)
        );

        var install = sinon.spy(this.plugin, 'install');

        this.plugin.resolveLoader(result, this.next);

        expect(this.compiler.resolvers.loader.resolve.calls.length).to.equal(1);
        expect(install.calls.length).to.equal(0);
        expect(this.next.calls.length).to.equal(1);
        expect(this.next.calls[0].arguments).to.equal([]);
      });
      it('should call .resolve and install if not resolved', function() {
        var result = { path: '/', request: 'babel-loader' };

        this.compiler.resolvers.loader.resolve.andCall(
          function(context, path, request, callback) {
            callback(
              new Error("Can't resolve 'babel-loader' in 'node_modules'")
            );
          }.bind(this)
        );

        var install = sinon.spy(this.plugin, 'install');

        this.plugin.resolveLoader(result, this.next);

        expect(this.compiler.resolvers.loader.resolve.calls.length).to.equal(1);
        expect(install.calls.length).to.equal(1);
        expect(this.next.calls.length).to.equal(1);
        expect(this.next.calls[0].arguments).to.equal([]);
      });
    });

    describe('.resolveModule', function() {
      it('should prevent cyclical installs', function() {
        var result = { path: '/', request: 'foo' };

        this.plugin.resolving.foo = true;

        this.plugin.resolveModule(result, this.next);

        expect(this.compiler.resolvers.normal.resolve.calls.length).to.equal(0);
        expect(this.next.calls.length).to.equal(1);
      });

      it('should call .resolve if direct dependency', function() {
        var result = { path: '/', request: 'foo' };

        this.compiler.resolvers.normal.resolve.andCall(
          function(context, path, request, callback) {
            callback(new Error("Can't resolve '@cycle/core' in '/'"));
          }.bind(this)
        );

        this.plugin.resolveModule(result, this.next);

        expect(this.compiler.resolvers.normal.resolve.calls.length).to.equal(1);
        expect(this.next.calls.length).to.equal(1);
        expect(this.next.calls[0].arguments).to.equal([]);
      });

      it('should call not .resolve if sub-dependency', function() {
        var result = { path: 'node_modules', request: 'foo' };

        this.plugin.resolveModule(result, this.next);

        expect(this.compiler.resolvers.normal.resolve.calls.length).to.equal(0);
        expect(this.next.calls.length).to.equal(1);
      });
    });
  });
