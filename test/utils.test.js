var expect = require("expect");

var utils = require("../src/utils");

describe("utils", function() {
  describe(".normalizeLoader", function() {
    it("should convert `babel` to `babel-loader`", function() {
      expect(utils.normalizeLoader("babel")).toBe("babel-loader");
    });

    it("should convert `react-hot-loader/webpack` to `react-hot-loader`", function() {
      expect(utils.normalizeLoader("react-hot-loader/webpack")).toBe("react-hot-loader");
    });
  })
})
