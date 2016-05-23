var expect = require("expect");
var installer = require("../src/installer");
var Plugin = require("../src/plugin");
var util = require("util");
var webpack = require("webpack");

describe("plugin", function() {
  beforeEach(function() {
    this.check = expect.spyOn(installer, "check").andCall(function(dep) {
      return dep;
    });

    this.checkBabel = expect.spyOn(installer, "checkBabel");
    this.checkPackage = expect.spyOn(installer, "checkPackage");

    this.compiler = {
      options: {},
      plugin: expect.createSpy(),
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

    this.install = expect.spyOn(installer, "install");
    this.next = expect.createSpy();

    this.options = {
      dev: false,
      peerDependencies: true,
    };

    this.plugin = new Plugin(this.options);

    this.plugin.apply(this.compiler);
  });

  afterEach(function() {
    this.check.restore();
    this.checkBabel.restore();
    this.checkPackage.restore();
    this.install.restore();
    this.next.restore();
  });

  it("should checkBabel", function() {
    expect(this.checkBabel).toHaveBeenCalled();
  });

  it("should checkPackage", function() {
    expect(this.checkPackage).toHaveBeenCalled();
  });

  it("should accept options", function() {
    expect(this.plugin.options).toEqual(this.options);
  });

  describe(".apply", function() {
    it("should hook into `watch-run`", function() {
      expect(this.compiler.plugin.calls.length).toBe(1);
      expect(this.compiler.plugin.calls[0].arguments).toEqual([
        "watch-run",
        this.plugin.preCompile.bind(this.plugin)
      ]);
    });

    it("should hook into loader resolvers", function() {
      expect(this.compiler.resolvers.loader.plugin.calls.length).toBe(1);
      expect(this.compiler.resolvers.loader.plugin.calls[0].arguments).toEqual([
        "module",
        this.plugin.resolveLoader.bind(this.plugin)
      ]);
    });

    it("should hook into normal resolvers", function() {
      expect(this.compiler.resolvers.normal.plugin.calls.length).toBe(1);
      expect(this.compiler.resolvers.normal.plugin.calls[0].arguments).toEqual([
        "module",
        this.plugin.resolveModule.bind(this.plugin)
      ]);
    });
  });

  describe(".preCompile", function() {
    beforeEach(function() {
      this.run = expect.spyOn(webpack.Compiler.prototype, "run").andCall(function(callback) {
        callback();
      });
    });

    afterEach(function() {
      this.run.restore();
    });

    it("should perform dryrun", function(done) {
      var compilation = {};

      this.plugin.preCompile(compilation, function() {
        expect(this.run).toHaveBeenCalled();
        done();
      }.bind(this));
    });
  });

  describe(".resolveExternal", function() {
    beforeEach(function() {
      this.resolve = expect.spyOn(this.plugin, "resolve").andCall(function(result, callback) {
        callback(new Error(util.format("Can't resolve '%s' in '%s'", result.request, result.path)));
      });
    });

    afterEach(function() {
      this.resolve.restore();
    });

    it("should ignore node_modules", function(done) {
      this.plugin.resolveExternal("node_modules", "express", function() {
        expect(this.resolve).toNotHaveBeenCalled();
        done();
      }.bind(this));
    });

    it("should ignore inline-loaders", function(done) {
      this.plugin.resolveExternal("src", "bundle?lazy!express", function() {
        expect(this.resolve).toNotHaveBeenCalled();
        done();
      }.bind(this));
    });

    it("should resolve external deps", function(done) {
      this.plugin.resolveExternal("src", "express", function() {
        expect(this.resolve).toHaveBeenCalled();
        expect(this.check).toHaveBeenCalled();
        expect(this.install).toHaveBeenCalled();

        expect(this.check.calls[0].arguments[0]).toEqual("express");
        expect(this.install.calls[0].arguments[0]).toEqual("express");
        done();
      }.bind(this));
    });
  });

  describe(".resolveLoader", function() {
    it("should call installer.check", function() {
      var result = { path: "node_modules", request: "babel-loader" };

      this.plugin.resolveLoader(result, this.next);

      expect(this.check.calls.length).toBe(1);
      expect(this.check.calls[0].arguments).toEqual(["babel-loader"]);
    });

    it("should skip installer.install if existing", function() {
      var result = { path: "node_modules", request: "babel-loader" };

      this.check.andCall(function(dep) {
        return false;
      });

      this.plugin.resolveLoader(result, this.next);

      expect(this.install.calls.length).toBe(0);
    });

    it("should call installer.install if missing", function() {
      var result = { path: "node_modules", request: "babel-loader" };

      this.check.andCall(function(dep) {
        return dep;
      });

      this.plugin.resolveLoader(result, this.next);

      expect(this.install.calls.length).toBe(1);
      expect(this.install.calls[0].arguments).toEqual(["babel-loader", this.options]);
    });

    it("should ensure loaders end with `-loader`", function() {
      var result = { path: "node_modules", request: "babel" };

      this.plugin.resolveLoader(result, this.next);

      expect(this.check.calls.length).toBe(1);
      expect(this.check.calls[0].arguments).toEqual(["babel-loader"]);
    });
  });

  describe(".resolveModule", function() {
    it("should prevent cyclical installs", function() {
      var result = { path: "/", request: "foo" };

      this.plugin.resolving.foo = true;

      this.plugin.resolveModule(result, this.next);

      expect(this.compiler.resolvers.normal.resolve.calls.length).toBe(0);
      expect(this.next.calls.length).toBe(1);
    });

    it("should call .resolve if direct dependency", function() {
      var result = { path: "/", request: "foo" };

      this.compiler.resolvers.normal.resolve.andCall(function(path, request, callback) {
        callback(new Error("Can't resolve '@cycle/core' in '/'"));
      }.bind(this));

      this.plugin.resolveModule(result, this.next);

      expect(this.compiler.resolvers.normal.resolve.calls.length).toBe(1);
      expect(this.next.calls.length).toBe(1);
      expect(this.next.calls[0].arguments).toEqual([]);
    });

    it("should call not .resolve if sub-dependency", function() {
      var result = { path: "node_modules", request: "foo" };

      this.plugin.resolveModule(result, this.next);

      expect(this.compiler.resolvers.normal.resolve.calls.length).toBe(0);
      expect(this.next.calls.length).toBe(1);
    });
  });
});
