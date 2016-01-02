var expect = require("expect");
var installer = require("../src/installer");
var loader = require("../src/loader");
var path = require("path");

describe("loader", function() {
  beforeEach(function() {
    expect.spyOn(console, "info");

    this.cacheable = function() {};
    this.callback = expect.createSpy();
    this.check = expect.spyOn(installer, "check").andCallThrough();
    this.install = expect.spyOn(installer, "install");
    this.map = "map";

    this.source = [
      "require('mocha')",
      "import expect from 'expect'",
      "import * as missing from 'missing'",
    ].join("\n");

    this.options = {
      context: process.cwd(),
      resolve: {
        root: ["test"],
        modulesDirectories: ["node_modules"],
      },
    };

    this.query = '?{"cli":{"save":true,"saveExact":true}}';

    loader.call(this, this.source, this.map);
  });

  afterEach(function() {
    expect.restoreSpies();
  });

  it("should check resolve.root & resolve.modulesDirectories", function() {
    expect(this.check).toHaveBeenCalled();
    expect(this.check.calls[0].arguments).toEqual([
      ["mocha", "expect", "missing"],
      [
        path.join(this.options.context, "test"),
        path.join(this.options.context, "node_modules"),
      ],
    ]);
  });

  context("when calling .install", function() {
    it("should pass dependencies as the first argument", function() {
      expect(this.install).toHaveBeenCalled();
      expect(this.install.calls[0].arguments[0]).toEqual(["missing"]);
    });

    it("should pass args as the second argument", function() {
      expect(this.install).toHaveBeenCalled();
      expect(this.install.calls[0].arguments[1]).toEqual({
        save: true,
        saveExact: true,
      });
    });
  });


  it("should callback source & map", function() {
    expect(this.callback).toHaveBeenCalled();
    expect(this.callback.calls[0].arguments).toEqual([
      null,
      this.source,
      this.map,
    ]);
  });
});
