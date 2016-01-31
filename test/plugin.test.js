var expect = require("expect");
var installer = require("../src/installer");
var Plugin = require("../src/plugin");

describe("plugin", function() {
  beforeEach(function() {
    this.options = {
      save: true,
      saveDev: false,
    };

    this.plugin = new Plugin(this.options);
  });

  it("should accept options", function() {
    expect(this.plugin.options).toEqual(this.options);
  });

  describe(".apply", function() {
    before(function() {
      this.compiler = {
        plugin: expect.createSpy(),
        resolvers: {
          loader: { plugin: expect.createSpy() },
          normal: { plugin: expect.createSpy() },
        },
      };

      this.plugin.apply(this.compiler);
    });

    after(function() {
      expect.restoreSpies();
    });

    it("should hook into `normal-module-factory`", function() {
      expect(this.compiler.plugin.calls.length).toBe(1);
      expect(this.compiler.plugin.calls[0].arguments).toEqual([
        "normal-module-factory",
        this.plugin.listenToFactory
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

  describe(".resolve", function() {
    beforeEach(function() {
      this.check = expect.spyOn(installer, "check");
      this.install = expect.spyOn(installer, "install");
      this.result = { request: "foo "};
    });

    afterEach(function() {
      this.check.restore();
      this.install.restore();
    });

    it("should check if request is installed", function() {
      this.plugin.resolve(this.result);

      expect(this.check.calls.length).toBe(1);
      expect(this.check.calls[0].arguments).toEqual([this.result.request]);
    });

    it("should return the value of the check", function() {
      this.check.andReturn(this.result.request);

      var result = this.plugin.resolve(this.result);

      expect(this.check.calls.length).toBe(1);
      expect(this.check.calls[0].arguments).toEqual([this.result.request]);

      expect(result).toEqual(this.result.request);
    });

    it("should not install if it exists", function() {
      this.plugin.resolve(this.result);

      expect(this.install.calls.length).toEqual(0);
    });

    it("should install if missing", function() {
      this.check.andReturn(this.result.request);
      this.plugin.resolve(this.result);

      expect(this.install.calls.length).toBe(1);
      expect(this.install.calls[0].arguments).toEqual([
        this.result.request,
        this.options
      ]);
    });
  });

  describe(".resolveModule", function() {
    beforeEach(function() {
      this.resolve = expect.spyOn(this.plugin, "resolve");
      this.next = expect.createSpy();
    });

    afterEach(function() {
      this.resolve.restore();
      this.next.restore();
    });

    it("should call .resolve if direct dependency", function() {
      var result = { path: "/", request: "foo" };

      this.plugin.resolveModule(result, this.next);

      expect(this.resolve.calls.length).toBe(1);
      expect(this.resolve.calls[0].arguments).toEqual([result]);
      expect(this.next.calls.length).toBe(1);
      expect(this.next.calls[0].arguments).toEqual([]);
    });

    it("should call not .resolve if sub-dependency", function() {
      var result = { path: "node_modules", request: "foo" };

      this.plugin.resolveModule(result, this.next);

      expect(this.resolve.calls.length).toBe(0);
      expect(this.next.calls.length).toBe(1);
      expect(this.next.calls[0].arguments).toEqual([]);
    });
  });

  describe(".resolveLoader", function() {
    beforeEach(function() {
      this.resolve = expect.spyOn(this.plugin, "resolve");
      this.next = expect.createSpy();
    });

    afterEach(function() {
      this.resolve.restore();
      this.next.restore();
    });

    it("should call .resolve", function() {
      var result = { path: "node_modules", request: "foo" };

      this.plugin.resolveLoader(result, this.next);

      expect(this.resolve.calls.length).toBe(1);
      expect(this.resolve.calls[0].arguments).toEqual([result]);
    });
  });
});
