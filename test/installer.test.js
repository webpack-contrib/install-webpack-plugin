var child = require("child_process");
var expect = require("expect");
var installer = require("../src/installer");

describe("installer", function() {
  describe(".check", function() {
    context("given resolveable dependencies", function() {
      it("should return []", function() {
        expect(installer.check(["expect", "mocha"])).toEqual([]);
      });
    });

    context("given relative paths", function() {
      it("should return []", function() {
        expect(installer.check(["./something"])).toEqual([]);
      });
    });

    context("given un-resolveable dependencies", function() {
      it("should return them", function() {
        expect(installer.check(["does-not-exist"])).toEqual(["does-not-exist"]);
      });

      context("that exists in alternative directories", function() {
        it("should return []", function() {
          expect(installer.check(["test"], [process.cwd()])).toEqual([]);
        });
      });
    });

  });

  describe(".install", function() {
    beforeEach(function() {
      this.spy = expect.spyOn(child, "spawnSync");

      expect.spyOn(console, "info");
    });

    afterEach(function() {
      expect.restoreSpies();
    });

    context("given falsey values", function() {
      it("should return undefined", function() {
        expect(installer.install()).toEqual(undefined);
        expect(installer.install(0)).toEqual(undefined);
        expect(installer.install("")).toEqual(undefined);
        expect(installer.install([])).toEqual(undefined);
      });
    });

    context("given empty dependencies", function() {
      it("should return undefined", function() {
        expect(installer.install([])).toEqual(undefined);
      });
    });

    context("given dependencies", function() {
      it("should install them", function() {
        var result = installer.install(["foo", "bar"]);

        expect(this.spy).toHaveBeenCalled();
        expect(this.spy.calls.length).toEqual(1);
        expect(this.spy.calls[0].arguments).toEqual([
          "npm",
          ["install", "foo", "bar"],
          { "stdio": "inherit" },
        ]);
      });
    });
  });
});
