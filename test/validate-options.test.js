const InstallPlugin = require('../src/plugin');

describe('validation', () => {
  const cases = {
    dependencies: {
      success: [{ peer: true }, { peer: false }],
      failure: [{ peer: 'bar' }, { peer: 10 }],
    },
    packageManager: {
      success: [
        'npm',
        'pnpm',
        'yarn',
        {
          type: 'npm',
          options: {
            dev: true,
          },
        },
        {
          type: 'pnpm',
          options: {
            dev: true,
          },
        },
        {
          type: 'yarn',
          options: {
            dev: true,
          },
        },
        {
          type: 'npm',
          options: {
            dev: true,
            quiet: true,
          },
        },
        {
          type: 'npm',
          options: {
            dev: true,
            arguments: ['--ignore-scripts'],
          },
        },
        () => {},
      ],
      failure: [
        'foo',
        { type: 'foo' },
        { type: 'npm', options: { dev: 'foo' } },
        { type: 'npm', options: { quiet: 'foo' } },
        { type: 'npm', options: { arguments: '10' } },
        { type: 'npm', options: { arguments: [] } },
        { type: 'npm', options: { test: 'foo' } },
      ],
    },
    prompt: {
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
