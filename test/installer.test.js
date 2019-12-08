var expect = require('chai').expect;
var fs = require("fs");
var path = require("path");
var spawn = require("cross-spawn");
var sinon = require('sinon');

var installer = require("../src/installer");

describe("installer", function() {
  describe(".defaultOptions", function() {
    it("should default dev to false", function() {
      expect(installer.defaultOptions.dev).to.equal(false);
    });

    it("should default peerDependencies to true", function() {
      expect(installer.defaultOptions.peerDependencies).to.equal(true);
    });

    it("should default quiet to false", function() {
      expect(installer.defaultOptions.quiet).to.equal(false);
    });
  })

  describe(".check", function() {
    context("given nothing", function() {
      it("should return undefined", function() {
        expect(installer.check()).to.equal(undefined);
      });
    });

    context("given a local module", function() {
      it("should return undefined", function() {
        expect(installer.check("./foo")).to.equal(undefined);
      });
    });

    context("given a resolvable dependency", function() {
      it("should return undefined", function() {
        expect(installer.check("cross-spawn")).to.equal(undefined);
      });
    });

    context("given a global module", function() {
      it("should return undefined", function () {
        expect(installer.check("path")).to.equal(undefined);
      });
    });

    context("given a module", function() {
      it("should return module", function() {
        expect(installer.check("react")).to.equal("react");
      });
    });

    context("given a module/and/path", function() {
      it("should return module", function() {
        expect(installer.check("react/proptypes")).to.equal("react");
      });
    });

    context("given a @namespaced/module", function() {
      it("should return @namespaced/module", function() {
        expect(installer.check("@namespaced/module")).to.equal("@namespaced/module");
      });
    });

    context("given a webpack !!loader/module", function() {
      it("should return undefined", function() {
        expect(installer.check("!!./css-loader/index.js',")).to.equal(undefined);
      });
    })

  });

  describe(".checkBabel", function() {
    beforeEach(function() {
      this.sync = sinon.spy(spawn, "sync").returned({ stdout: null });

      sinon.spy(console, "info");
    });

    afterEach(function() {
      this.sync.restore();
    });

    context("when .babelrc doesn't exist", function() {
      beforeEach(function() {
        process.chdir(path.join(process.cwd(), "test"));
      });

      afterEach(function() {
        process.chdir(path.join(process.cwd(), ".."));
      });

      it("should return early", function() {
        var result = installer.checkBabel();

        expect(result).to.equal(undefined);
        expect(this.sync.called).to.equal(true);
      });
    });

    context("when .babelrc exists", function() {
      beforeEach(function() {
        process.chdir(path.join(process.cwd(), "example/webpack2"));

        this.check = sinon.spy(installer, "check")

        this.install = sinon.spy(installer, "install");
      });

      afterEach(function() {
        process.chdir(path.join(process.cwd(), "../../"));
      });

      it("should check plugins & presets", function() {
        installer.checkBabel();

        var checked = this.check.calls.map(function(call) {
          return call.arguments[0];
        });

        expect(this.check.called).to.equal(true);  
        expect(this.check.calls.length).to.equal(6);
        expect(checked).to.equal([
          'babel-core',
          'babel-plugin-react-html-attrs',
          'babel-preset-react',
          'babel-preset-es2015',
          'babel-preset-stage-0',
          'babel-preset-react-hmre'
        ]);
      });

      it("should install missing plugins & presets", function() {
        installer.checkBabel();

        expect(this.install.called).to.equal(true);
        expect(this.install.calls.length).to.equal(1);
        expect(this.install.calls[0].arguments).to.equal([
          [
            'babel-core',
            'babel-plugin-react-html-attrs',
            'babel-preset-react',
            'babel-preset-es2015',
            'babel-preset-stage-0',
            'babel-preset-react-hmre'
          ],
        ]);
      });
    });
  });

  describe(".install", function() {
    beforeEach(function() {
      this.sync = sinon.spy(spawn, "sync").returned({ stdout: null });

      sinon.spy(console, "info");
      sinon.spy(console, "warn");
    });

    afterEach(function() {
      this.sync.restore();
    });

    context("given a falsey value", function() {
      it("should return undefined", function() {
        expect(installer.install()).to.equal(undefined);
        expect(installer.install(0)).to.equal(undefined);
        expect(installer.install(false)).to.equal(undefined);
        expect(installer.install(null)).to.equal(undefined);
        expect(installer.install("")).to.equal(undefined);
      });
    });

    context("given an empty array", function() {
      it("should return undefined", function () {
        expect(installer.install([])).to.equal(undefined);
      });
    });

    context("given a non-existant module", function() {
      beforeEach(function() {
        this.sync.returned({ status: 1 });
      });

      it("should attempt to install once", function() {
        installer.install("does.not.exist.jsx")

        expect(this.sync.called).to.equal(true);
      });

      it("should not attempt to install it again", function() {
        installer.install("does.not.exist.jsx")

        expect(this.sync.called).to.equal(true);
      });
    });

    context('when using yarn', function() {
      context("given a dependency", function() {
        context("with no options", function() {
          it("should install it with --save", function() {
            var result = installer.install("foo", { 
              yarn: true,
            });

            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("yarn");
            expect(this.sync.calls[0].arguments[1]).to.equal(["add", "foo"]);
          });
        });

        context("with dev set to true", function() {
          it("should install it with --dev", function() {
            var result = installer.install("foo", {
              dev: true,
              yarn: true,
            });

            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("yarn");
            expect(this.sync.calls[0].arguments[1]).to.equal(["add", "foo", "--dev"]);
          });
        });

        context("without a package.json present", function() {
          beforeEach(function() {
            sinon.spy(installer, "packageExists").returned(false);
          });

          afterEach(function() {
            expect.restoreSpies();
          });

          it("should install without options", function() {
            var result = installer.install("foo", {
              yarn: true,
            });
            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("yarn");
            expect(this.sync.calls[0].arguments[1]).to.equal(["add", "foo"]);
          });
        });

        context("with quiet set to true", function() {
          it("should install it with --silent --noprogress", function() {
            var result = installer.install("foo", {
              quiet: true,
              yarn: true,
            });

            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("yarn");
            expect(this.sync.calls[0].arguments[1]).to.equal(
              ["add", "foo", "--silent"]
            );
          });
        });

        context("with missing peerDependencies", function() {
          beforeEach(function() {
            this.sync.andCall(function(bin, args) {
              var dep = args[1];

              if (dep === "redbox-react") {
                return {
                  stdout: new Buffer([
                    "/test",
                    "├── redbox-react@1.2.3",
                    "└── UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc",
                  ].join("\n")),
                };
              }

              return { stdout: null };
            });
          });

          context("given no options", function() {
            it("should install peerDependencies", function() {
              var result = installer.install("redbox-react", {
                yarn: true,
              });

              expect(this.sync.calls.length).to.equal(2);
              expect(this.sync.calls[0].arguments[1]).to.equal(["add", "redbox-react"]);

              // Ignore ranges, let NPM pick
              expect(this.sync.calls[1].arguments[1]).to.equal(["add", "react"]);
            });
          });

          context("given peerDependencies set to false", function() {
            it("should not install peerDependencies", function() {
              var result = installer.install("redbox-react", {
                peerDependencies: false,
                yarn: true,
              });

              expect(this.sync.calls.length).to.equal(1);
              expect(this.sync.calls[0].arguments[1]).to.equal(["add", "redbox-react"]);
            });
          });
        });
      });
    });

    context('when using npm', function() {
      context("given a dependency", function() {
        context("with no options", function() {
          it("should install it with --save", function() {
            var result = installer.install("foo");

            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("npm");
            expect(this.sync.calls[0].arguments[1]).to.equal(["install", "foo", "--save"]);
          });
        });

        context("with dev set to true", function() {
          it("should install it with --save-dev", function() {
            var result = installer.install("foo", {
              dev: true,
            });

            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("npm");
            expect(this.sync.calls[0].arguments[1]).to.equal(["install", "foo", "--save-dev"]);
          });
        });

        context("without a package.json present", function() {
          beforeEach(function() {
            sinon.spy(installer, "packageExists").returned(false);
          });

          afterEach(function() {
            this.sync.restore();
          });

          it("should install without --save", function() {
            var result = installer.install("foo");
            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("npm");
            expect(this.sync.calls[0].arguments[1]).to.equal(["install", "foo"]);
          });
        });

        context("with quiet set to true", function() {
          it("should install it with --silent --noprogress", function() {
            var result = installer.install("foo", {
              quiet: true,
            });

            expect(this.sync.called).to.equal(true);
            expect(this.sync.calls.length).to.equal(1);
            expect(this.sync.calls[0].arguments[0]).to.equal("npm");
            expect(this.sync.calls[0].arguments[1]).to.equal(
              ["install", "foo", "--save", "--silent", "--no-progress"]
            );
          });
        });

        context("with missing peerDependencies", function() {
          beforeEach(function() {
            this.sync.andCall(function(bin, args) {
              var dep = args[1];

              if (dep === "redbox-react") {
                return {
                  stdout: new Buffer([
                    "/test",
                    "├── redbox-react@1.2.3",
                    "└── UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc",
                  ].join("\n")),
                };
              }

              return { stdout: null };
            });
          });

          context("given no options", function() {
            it("should install peerDependencies", function() {
              var result = installer.install("redbox-react");

              expect(this.sync.calls.length).to.equal(2);
              expect(this.sync.calls[0].arguments[1]).to.equal(["install", "redbox-react", "--save"]);

              // Ignore ranges, let NPM pick
              expect(this.sync.calls[1].arguments[1]).to.equal(["install", "react", "--save"]);
            });
          });

          context("given peerDependencies set to false", function() {
            it("should not install peerDependencies", function() {
              var result = installer.install("redbox-react", {
                peerDependencies: false,
              });

              expect(this.sync.calls.length).to.equal(1);
              expect(this.sync.calls[0].arguments[1]).to.equal(["install", "redbox-react", "--save"]);
            });
          });
        });
      });
    });

    
  });
});
