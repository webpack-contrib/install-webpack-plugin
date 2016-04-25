var expect = require("expect");
var installer = require("../src/installer");
var Plugin = require("../src/plugin");

describe("plugin", function() {
  beforeEach(function() {
    this.check = expect.spyOn(installer, "check");
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
      save: true,
      saveDev: false,
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
        this.plugin.preInstall.bind(this.plugin)
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

  describe(".listenToFactory", function() {
    before(function() {
      this.next = expect.createSpy().andCall(function(err, result) {
        return result;
      });

      this.result = {
        context: "/",
        request: "foo",
        path: "node_modules"
      };

      this.factory = {
        plugin: expect.createSpy().andCall(function(event, factoryPlugin) {
          factoryPlugin(this.result, this.next);
        }.bind(this)),

        resolvers: {
          normal: {
            resolve: expect.createSpy().andCall(function(context, request, callback) {
              callback(null, [context, request].join("/"));
            }.bind(this)),
          },
        },
      };

      this.plugin.listenToFactory(this.factory);
    });

    it("should hook into `before-resolve`", function() {
      expect(this.factory.plugin.calls.length).toBe(1);
      expect(this.factory.plugin.calls[0].arguments[0]).toBe("before-resolve");
    });

    it("should immediately resolve", function() {
      expect(this.factory.resolvers.normal.resolve.calls.length).toBe(1);
    });

    it("should pass result through", function() {
      expect(this.next.calls.length).toBe(1);
      expect(this.next.calls[0].arguments).toEqual([null, this.result]);
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

      this.compiler.resolvers.normal.resolve.andCall(function(context, path, request, callback) {
        callback(new Error("Cannot resolve module '@cycle/core'"));
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
