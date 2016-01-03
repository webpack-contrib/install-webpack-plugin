var babel = require("babel-core");
var expect = require("expect");
var parse = require("../src/parser").parse;

describe("parser", function() {
  describe(".parse", function() {
    context("given statements", function() {
      it("should return []", function() {
        expect(parse(null)).toEqual([]);
        expect(parse(undefined)).toEqual([]);
        expect(parse(0)).toEqual([]);
        expect(parse("")).toEqual([]);
        expect(parse("var foo = 'bar';")).toEqual([]);
      });
    });

    context("given source that with NULLs in the AST", function() {
      beforeEach(function() {
        this.transform = expect.spyOn(babel, "transform").andReturn({
          ast: {
            program: {
              body: [null],
            },
          },
        });
      });

      afterEach(function() {
        this.transform.restore();
      });

      it("should return []", function() {
        expect(parse("something with NULLs")).toEqual([]);
      });
    });

    context("given: require('foo')", function() {
      it("should return 'foo'", function() {
        expect(parse("require('foo')")).toEqual(["foo"]);
      });
    });

    context("given: let a = require('foo')", function() {
      it("should return 'foo'", function() {
        expect(parse("let a = require('foo')")).toEqual(["foo"]);
      });
    });

    context("given: const { a, b } = require('foo')", function() {
      it("should return 'foo'", function() {
        expect(parse("const { a, b } = require('foo')")).toEqual(["foo"]);
      });
    });

    context("given: import * as a from 'foo'", function() {
      it("should return 'foo'", function() {
        expect(parse("import * as a from 'foo'")).toEqual(["foo"]);
      });
    });

    context("given: import a from 'foo'", function() {
      it("should return 'foo'", function() {
        expect(parse("import a from 'foo'")).toEqual(["foo"]);
      });
    });
  });
});
