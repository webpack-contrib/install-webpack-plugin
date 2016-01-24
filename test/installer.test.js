var expect = require("expect");
var fs = require("fs");
var spawn = require("cross-spawn");

var installer = require("../src/installer");

describe("installer", function() {
  describe(".check", function() {
    context("given a local module", function() {
      it("should return undefined", function() {
        expect(installer.check("./foo")).toBe(undefined);
      });
    });

    context("when process.cwd() is missing package.json", function() {
      before(function() {
        this.cwd = process.cwd();

        process.chdir(__dirname);
      });

      after(function() {
        process.chdir(this.cwd);
      });

      it("should throw", function() {
        expect(function() {
          installer.check("anything");
        }).toThrow(/Cannot find module/);
      });
    });

    context("given a dependency in package.json", function() {
      it("should return undefined", function() {
        expect(installer.check("cross-spawn")).toBe(undefined);
      });
    });

    context("given a devDependency in package.json", function() {
      it("should return undefined", function() {
        expect(installer.check("expect")).toBe(undefined);
      });
    });

    context("given a linked dependency", function() {
      beforeEach(function() {
        this.lstatSync = expect.spyOn(fs, "lstatSync").andReturn({
          isSymbolicLink: function() {
            return true;
          },
        });
      });

      afterEach(function() {
        this.lstatSync.restore();
      });

      it("should return undefined", function() {
        expect(installer.check("something-linked")).toBe(undefined);
        expect(this.lstatSync.calls.length).toBe(1);
        expect(this.lstatSync.calls[0].arguments).toEqual([
          [process.cwd(), "node_modules", "something-linked"].join("/"),
        ]);
      });
    });

    context("given a global module", function() {
      it("should return undefined", function () {
        expect(installer.check("path")).toBe(undefined);
      });
    });

    context("given a module", function() {
      it("should return module", function() {
        expect(installer.check("react")).toBe("react");
      });
    });

    context("given a module/and/path", function() {
      it("should return module", function() {
        expect(installer.check("react/proptypes")).toBe("react");
      });
    });

    context("given a @namespaced/module", function() {
      it("should return @namespaced/module", function() {
        expect(installer.check("@namespaced/module")).toBe("@namespaced/module");
      });
    });

    context("given a module already installed, but not saved", function() {
      it("should return module", function() {
        expect(installer.check("yargs")).toBe("yargs");
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

    context("given a falsey value", function() {
      it("should return undefined", function() {
        expect(installer.install()).toEqual(undefined);
        expect(installer.install(0)).toEqual(undefined);
        expect(installer.install(false)).toEqual(undefined);
        expect(installer.install(null)).toEqual(undefined);
        expect(installer.install("")).toEqual(undefined);
      });
    });

    context("given a dependency", function() {
      it("should install it", function() {
        var result = installer.install("foo");

        expect(this.spy).toHaveBeenCalled();
        expect(this.spy.calls.length).toEqual(1);
        expect(this.spy.calls[0].arguments[0]).toEqual("npm");
        expect(this.spy.calls[0].arguments[1]).toEqual(["install", "foo"]);
      });

      context("given options", function() {
        it("should pass them to child process", function() {
          var result = installer.install("foo", {
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
            "--save",
            "--registry='https://registry.npmjs.com/'",
          ]);
        });
      });
    });
  });
});
