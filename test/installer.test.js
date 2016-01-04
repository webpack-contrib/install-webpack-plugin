var spawn = require("cross-spawn");
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

      context("that import deeply", function() {
        it("should return their module name", function() {
          expect(installer.check(["does-not-exist/lib/test"])).toEqual(["does-not-exist"]);
        });
      });

      context("that import multiple times from the same module", function() {
        it("should return their module name once", function() {
          expect(installer.check(["d-n-e/a", "d-n-e/b"])).toEqual(["d-n-e"]);
        });
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
      this.spy = expect.spyOn(spawn, "sync");

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
        expect(this.spy.calls[0].arguments[0]).toEqual("npm");
        expect(this.spy.calls[0].arguments[1]).toEqual(["install", "foo", "bar"]);
      });

      context("given options", function() {
        it("should pass them to child process", function() {
          var result = installer.install(["foo", "bar"], {
            save: true,
            saveExact: false,
            registry: "https://registry.npmjs.com/",
          });

          expect(this.spy).toHaveBeenCalled();
          expect(this.spy.calls.length).toEqual(1);
          expect(this.spy.calls[0].arguments[0]).toEqual("npm");
          expect(this.spy.calls[0].arguments[1]).toEqual([
            "install",
            "foo",
            "bar",
            "--save",
            "--registry='https://registry.npmjs.com/'",
          ]);
        });
      });
    });
  });
});
