const utils = require('../src/utils');

describe('utils', () => {
  describe('.normalizeLoader', () => {
    it('should convert `babel` to `babel-loader`', () => {
      expect(utils.normalizeLoader('babel')).toBe('babel-loader');
    });

    it('should convert `react-hot-loader/webpack` to `react-hot-loader`', () => {
      expect(utils.normalizeLoader('react-hot-loader/webpack')).toBe(
        'react-hot-loader'
      );
    });
  });
});
