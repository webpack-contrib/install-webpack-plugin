const InstallPlugin = require('../src/plugin');

describe('validation', () => {
  const cases = {
    dependencies: {
      success: [
        { dev: true },
        { dev: () => {} },
        { peerDependencies: true },
        { dev: true, peerDependencies: true },
      ],
      failure: [
        { dev: 'foo' },
        { dev: 10 },
        { peerDependencies: 'bar' },
        { dev: 'test', peerDependencies: true },
      ],
    },
    npm: {
      success: [true, false],
      failure: ['bar', 10],
    },
    prompt: {
      success: [true, false],
      failure: ['bar', 10],
    },
    quiet: {
      success: [true, false],
      failure: ['bar', 10],
    },
    yarn: {
      success: [true, false],
      failure: ['bar', 10],
    },
  };

  function stringifyValue(value) {
    if (
      Array.isArray(value) ||
      (value && typeof value === 'object' && value.constructor === Object)
    ) {
      return JSON.stringify(value);
    }

    return value;
  }

  async function createTestCase(key, value, type) {
    it(`should ${
      type === 'success' ? 'successfully validate' : 'throw an error on'
    } the "${key}" option with "${stringifyValue(value)}" value`, async () => {
      let error;

      try {
        // eslint-disable-next-line no-new
        new InstallPlugin({ [key]: value });
      } catch (errorFromPlugin) {
        if (errorFromPlugin.name !== 'ValidationError') {
          throw errorFromPlugin;
        }

        error = errorFromPlugin;
      } finally {
        if (type === 'success') {
          expect(error).toBeUndefined();
        } else if (type === 'failure') {
          expect(() => {
            throw error;
          }).toThrowErrorMatchingSnapshot();
        }
      }
    });
  }

  for (const [key, values] of Object.entries(cases)) {
    for (const type of Object.keys(values)) {
      for (const value of values[type]) {
        createTestCase(key, value, type);
      }
    }
  }
});
