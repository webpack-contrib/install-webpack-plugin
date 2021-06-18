/* eslint-disable no-undefined */
const process = require('process');

const path = require('path');

const spawn = require('cross-spawn');

const logging = require('webpack/lib/logging/runtime');

const installer = require('../src/installer');

const logger = logging.getLogger('install-webpack-plugin');

describe('installer', () => {
  jest.spyOn(installer, 'prompt').mockImplementation(() => true);
  describe('.defaultOptions', () => {
    it(`should default packageManager.type to "npm"`, () => {
      expect(installer.defaultOptions.packageManager.type).toEqual('npm');
    });

    it(`should default packageManager.options.dev to false`, () => {
      expect(installer.defaultOptions.packageManager.options.dev).toEqual(
        false
      );
    });

    it(`should default packageManager.options.quiet to false`, () => {
      expect(installer.defaultOptions.packageManager.options.quiet).toEqual(
        false
      );
    });

    it('should default dependencies.peer to true', () => {
      expect(installer.defaultOptions.dependencies.peer).toEqual(true);
    });
  });

  describe('.check', () => {
    describe('given nothing', () => {
      it('should return undefined', () => {
        expect(installer.check()).toBe(undefined);
      });
    });

    describe('given a local module', () => {
      it('should return undefined', () => {
        expect(installer.check('./foo')).toBe(undefined);
      });
    });

    describe('given a resolvable dependency', () => {
      it('should return undefined', () => {
        expect(installer.check('cross-spawn')).toBe(undefined);
      });
    });

    describe('given a global module', () => {
      it('should return undefined', () => {
        expect(installer.check('path')).toBe(undefined);
      });
    });

    describe('given a module', () => {
      it('should return module', () => {
        expect(installer.check('react')).toBe('react');
      });
    });

    describe('given a module/and/path', () => {
      it('should return module', () => {
        expect(installer.check('react/proptypes')).toBe('react');
      });
    });

    describe('given a @namespaced/module', () => {
      it('should return @namespaced/module', () => {
        expect(installer.check('@namespaced/module')).toBe(
          '@namespaced/module'
        );
      });
    });

    describe('given a webpack !!loader/module', () => {
      it('should return undefined', () => {
        expect(installer.check("!!./css-loader/index.js',")).toBe(undefined);
      });
    });
  });

  describe('.checkBabel', () => {
    beforeEach(() => {
      this.sync = jest.spyOn(spawn, 'sync').mockImplementation(() => {
        return { stdout: null };
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("when .babelrc doesn't exist", () => {
      beforeEach(() => {
        process.chdir(path.join(process.cwd(), 'test'));
      });

      afterEach(() => {
        process.chdir(path.join(process.cwd(), '..'));
      });

      it('should return early', () => {
        const result = installer.checkBabel({}, logger);

        expect(result).toBe(undefined);
        expect(this.sync).not.toHaveBeenCalled();
      });
    });

    describe('when .babelrc exists', () => {
      beforeEach(() => {
        process.chdir(path.join(process.cwd(), 'example/webpack2'));

        this.check = jest.spyOn(installer, 'check');
        this.install = jest.spyOn(installer, 'install');
      });

      afterEach(() => {
        process.chdir(path.join(process.cwd(), '../../'));
      });

      it('should check plugins & presets', () => {
        installer.checkBabel();

        const deps = this.check.mock.calls.map((call) => call[0]);

        expect(this.check).toHaveBeenCalled();
        expect(this.check.mock.calls.length).toEqual(6);
        expect(deps).toEqual([
          '@babel/core',
          'babel-plugin-react-html-attrs',
          '@babel/preset-react',
          '@babel/preset-es2015',
          '@babel/preset-stage-0',
          '@babel/preset-react-hmre',
        ]);
      });

      it('should install missing plugins & presets', () => {
        installer.checkBabel();

        const deps = this.check.mock.calls.map((call) => call[0]);

        expect(this.install).toHaveBeenCalled();
        expect(this.install.mock.calls.length).toEqual(1);
        expect(deps).toEqual([
          '@babel/core',
          'babel-plugin-react-html-attrs',
          '@babel/preset-react',
          '@babel/preset-es2015',
          '@babel/preset-stage-0',
          '@babel/preset-react-hmre',
        ]);
      });
    });
  });

  describe('.getDefaultPackageManager()', () => {
    const testYarnLockPath = path.resolve(
      __dirname,
      './fixtures/test-yarn-lock'
    );
    const testNpmLockPath = path.resolve(__dirname, './fixtures/test-npm-lock');
    const testPnpmLockPath = path.resolve(
      __dirname,
      './fixtures/test-pnpm-lock'
    );
    const testNpmAndPnpmPath = path.resolve(
      __dirname,
      './fixtures/test-npm-and-pnpm'
    );
    const testNpmAndYarnPath = path.resolve(
      __dirname,
      './fixtures/test-npm-and-yarn'
    );
    const testYarnAndPnpmPath = path.resolve(
      __dirname,
      './fixtures/test-yarn-and-pnpm'
    );
    const testAllPath = path.resolve(__dirname, './fixtures/test-all-lock');
    const noLockPath = path.resolve(__dirname, './fixtures/no-lock-files');

    const cwdSpy = jest.spyOn(process, 'cwd');

    beforeEach(() => {
      this.sync = jest.spyOn(spawn, 'sync').mockImplementation(() => {
        return { stdout: null };
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should find yarn.lock', () => {
      cwdSpy.mockReturnValue(testYarnLockPath);
      expect(installer.getDefaultPackageManager()).toEqual('yarn');
      expect(this.sync.mock.calls.length).toEqual(0);
    });

    it('should find package-lock.json', () => {
      cwdSpy.mockReturnValue(testNpmLockPath);
      expect(installer.getDefaultPackageManager()).toEqual('npm');
      expect(this.sync.mock.calls.length).toEqual(0);
    });

    it('should find pnpm-lock.yaml', () => {
      cwdSpy.mockReturnValue(testPnpmLockPath);
      expect(installer.getDefaultPackageManager()).toEqual('pnpm');
      expect(this.sync.mock.calls.length).toEqual(0);
    });

    it('should prioritize npm over pnpm', () => {
      cwdSpy.mockReturnValue(testNpmAndPnpmPath);
      expect(installer.getDefaultPackageManager()).toEqual('npm');
      expect(this.sync.mock.calls.length).toEqual(0);
    });

    it('should prioritize npm over yarn', () => {
      cwdSpy.mockReturnValue(testNpmAndYarnPath);
      expect(installer.getDefaultPackageManager()).toEqual('npm');
      expect(this.sync.mock.calls.length).toEqual(0);
    });

    it('should prioritize yarn over pnpm', () => {
      cwdSpy.mockReturnValue(testYarnAndPnpmPath);
      expect(installer.getDefaultPackageManager()).toEqual('yarn');
      expect(this.sync.mock.calls.length).toEqual(0);
    });

    it('should prioritize npm with many lock files', () => {
      cwdSpy.mockReturnValue(testAllPath);
      expect(installer.getDefaultPackageManager()).toEqual('npm');
      expect(this.sync.mock.calls.length).toEqual(0);
    });

    it('should prioritize global npm over other package managers', () => {
      cwdSpy.mockReturnValue(noLockPath);
      expect(installer.getDefaultPackageManager()).toEqual('npm');
      expect(this.sync.mock.calls.length).toEqual(1);
    });

    it('should throw error if no package manager is found', () => {
      this.sync.mockImplementation(() => {
        throw new Error();
      });
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
      // Do not print warning in CI
      const consoleMock = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      expect(installer.getDefaultPackageManager()).toBeFalsy();
      expect(mockExit).toBeCalledWith(2);
      expect(consoleMock).toHaveBeenCalledTimes(1);
      expect(this.sync.mock.calls.length).toEqual(3);
    });
  });

  describe('.install', () => {
    beforeEach(() => {
      this.sync = jest.spyOn(spawn, 'sync').mockImplementation(() => {
        return { stdout: null };
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('given a falsey value', () => {
      it('should return undefined', async () => {
        expect(await installer.install()).toEqual(undefined);
        expect(await installer.install(0)).toEqual(undefined);
        expect(await installer.install(false)).toEqual(undefined);
        expect(await installer.install(null)).toEqual(undefined);
        expect(await installer.install('')).toEqual(undefined);
      });
    });

    describe('given an empty array', () => {
      it('should return undefined', async () => {
        expect(await installer.install([])).toEqual(undefined);
      });
    });

    describe('given a non-existant module', () => {
      beforeEach(() => {
        this.sync.mockImplementation(() => {
          return { status: 1 };
        });
      });

      it('should attempt to install once', async () => {
        await installer.install('does.not.exist.jsx', {}, logger);

        expect(this.sync).toHaveBeenCalled();
      });

      it('should not attempt to install it again', async () => {
        await installer.install('does.not.exist.jsx', {}, logger);

        expect(this.sync).not.toHaveBeenCalled();
      });
    });

    describe('when using yarn', () => {
      beforeEach(() => {
        this.sync = jest.spyOn(spawn, 'sync').mockImplementation(() => {
          return { stdout: null };
        });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      describe('given a dependency', () => {
        describe('with no options', () => {
          it('should install it with --save', async () => {
            await installer.install(
              'foo',
              {
                packageManager: 'yarn',
              },
              logger
            );
            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0][0]).toEqual('yarn');
            expect(this.sync.mock.calls[0][1]).toEqual(['add', 'foo']);
          });
        });

        describe('without a package.json present', () => {
          beforeEach(() => {
            jest
              .spyOn(installer, 'packageExists')
              .mockImplementation(() => false);
          });

          afterEach(() => {
            jest.clearAllMocks();
          });

          it('should install without options', async () => {
            await installer.install(
              'foo',
              {
                packageManager: 'yarn',
              },
              logger
            );
            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });
        });

        describe('with package manager options', () => {
          beforeEach(() => {
            jest
              .spyOn(installer, 'packageExists')
              .mockImplementation(() => true);
          });

          afterEach(() => {
            jest.clearAllMocks();
          });

          it('should install it with --dev', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'yarn',
                  options: {
                    dev: true,
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with --silent when quiet is true', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'yarn',
                  options: {
                    quiet: true,
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with --ignore-scripts', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'yarn',
                  options: {
                    arguments: ['--ignore-scripts'],
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with all arguments', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'yarn',
                  options: {
                    dev: true,
                    quiet: true,
                    arguments: ['--ignore-scripts'],
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });
        });

        describe('with missing peerDependencies', () => {
          beforeEach(() => {
            this.sync.mockImplementation((bin, args) => {
              // eslint-disable-next-line
              const dep = args[1];

              if (dep === 'redbox-react') {
                return {
                  stdout: new Buffer(
                    [
                      '/test',
                      '├── redbox-react@1.2.3',
                      '└── UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc',
                    ].join('\n')
                  ),
                };
              }

              return { stdout: null };
            });
          });

          describe('given no options', () => {
            it('should install peerDependencies', async () => {
              await installer.install(
                'redbox-react',
                {
                  packageManager: 'yarn',
                },
                logger
              );

              expect(this.sync.mock.calls.length).toEqual(2);
              expect(this.sync.mock.calls[0][1]).toEqual([
                'add',
                'redbox-react',
              ]);

              // Ignore ranges, let NPM pick
              expect(this.sync.mock.calls[1][1]).toEqual([
                'add',
                'UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc@react',
              ]);
            });
          });

          describe('given peerDependencies set to false', () => {
            it('should not install peerDependencies', async () => {
              await installer.install(
                'redbox-react',
                {
                  dependencies: {
                    peer: false,
                  },
                  packageManager: 'yarn',
                },
                logger
              );

              expect(this.sync.mock.calls).toMatchSnapshot();
            });
          });
        });
      });
    });

    describe('when using pnpm', () => {
      beforeEach(() => {
        this.sync = jest.spyOn(spawn, 'sync').mockImplementation(() => {
          return { stdout: null };
        });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      describe('given a dependency', () => {
        describe('with no options', () => {
          it('should install it without addition arguments', async () => {
            await installer.install(
              'foo',
              {
                packageManager: 'pnpm',
              },
              logger
            );
            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });
        });

        describe('with package manager options', () => {
          beforeEach(() => {
            jest
              .spyOn(installer, 'packageExists')
              .mockImplementation(() => true);
          });

          afterEach(() => {
            jest.clearAllMocks();
          });

          it('should install it with --ignore-workspace-root-check', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'pnpm',
                  options: {
                    arguments: ['--ignore-workspace-root-check'],
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with --save-dev', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'pnpm',
                  options: {
                    dev: true,
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with all arguments', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'pnpm',
                  options: {
                    dev: true,
                    quiet: true,
                    arguments: ['--ignore-workspace-root-check'],
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });
        });

        describe('with missing peerDependencies', () => {
          beforeEach(() => {
            this.sync.mockImplementation((bin, args) => {
              // eslint-disable-next-line
              const dep = args[1];

              if (dep === 'redbox-react') {
                return {
                  stdout: new Buffer(
                    [
                      '/test',
                      '├── redbox-react@1.2.3',
                      '└── UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc',
                    ].join('\n')
                  ),
                };
              }

              return { stdout: null };
            });
          });

          describe('given no options', () => {
            it('should install peerDependencies', async () => {
              await installer.install(
                'redbox-react',
                {
                  packageManager: 'pnpm',
                },
                logger
              );

              expect(this.sync.mock.calls.length).toEqual(2);
              expect(this.sync.mock.calls[0][1]).toEqual([
                'add',
                'redbox-react',
              ]);

              // Ignore ranges, let NPM pick
              expect(this.sync.mock.calls[1][1]).toEqual([
                'add',
                'UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc@react',
              ]);
            });
          });

          describe('given peerDependencies set to false', () => {
            it('should not install peerDependencies', async () => {
              await installer.install(
                'redbox-react',
                {
                  dependencies: {
                    peer: false,
                  },
                  packageManager: 'pnpm',
                },
                logger
              );

              expect(this.sync.mock.calls).toMatchSnapshot();
            });
          });
        });
      });
    });

    describe('when using npm', () => {
      beforeEach(() => {
        this.sync = jest.spyOn(spawn, 'sync').mockImplementation(() => {
          return { stdout: null };
        });
        jest.spyOn(installer, 'packageExists').mockImplementation(() => true);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      describe('given a dependency', () => {
        describe('with no options', () => {
          it('should install it with --save', async () => {
            await installer.install('foo', {}, logger);

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0][0]).toEqual('npm');
            expect(this.sync.mock.calls[0][1]).toEqual([
              'install',
              'foo',
              '--save',
            ]);
          });
        });

        describe('without a package.json present', () => {
          beforeEach(() => {
            jest
              .spyOn(installer, 'packageExists')
              .mockImplementation(() => false);
          });

          afterEach(() => {
            jest.clearAllMocks();
          });

          it('should install without --save', async () => {
            await installer.install('foo', {}, logger);
            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0][0]).toEqual('npm');
            expect(this.sync.mock.calls[0][1]).toEqual(['install', 'foo']);
          });
        });

        describe('with package manager options', () => {
          beforeEach(() => {
            jest
              .spyOn(installer, 'packageExists')
              .mockImplementation(() => true);
          });

          afterEach(() => {
            jest.clearAllMocks();
          });

          it('should install it with --save-dev', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'npm',
                  options: {
                    dev: true,
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with --silent when quiet is true', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'npm',
                  options: {
                    quiet: true,
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with --ignore-scripts', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'npm',
                  options: {
                    arguments: ['--ignore-scripts'],
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });

          it('should install it with all arguments', async () => {
            await installer.install(
              'foo',
              {
                packageManager: {
                  type: 'npm',
                  options: {
                    dev: true,
                    quiet: true,
                    arguments: ['--ignore-scripts'],
                  },
                },
              },
              logger
            );

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.mock.calls.length).toEqual(1);
            expect(this.sync.mock.calls[0]).toMatchSnapshot();
          });
        });

        describe('with missing peerDependencies', () => {
          beforeEach(() => {
            this.sync.mockImplementation((bin, args) => {
              // eslint-disable-next-line
              const dep = args[1];

              if (dep === 'redbox-react') {
                return {
                  stdout: new Buffer(
                    [
                      '/test',
                      '├── redbox-react@1.2.3',
                      '└── UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc',
                    ].join('\n')
                  ),
                };
              }

              return { stdout: null };
            });
          });

          describe('given no options', () => {
            it('should install peerDependencies', async () => {
              await installer.install('redbox-react', {}, logger);

              expect(this.sync.mock.calls.length).toEqual(2);
              expect(this.sync.mock.calls[0][1]).toEqual([
                'install',
                'redbox-react',
                '--save',
              ]);

              // Ignore ranges, let NPM pick
              expect(this.sync.mock.calls[1][1]).toEqual([
                'install',
                'UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc@react',
                '--save',
              ]);
            });
          });

          describe('given dependencies.peer set to false', () => {
            it('should not install peerDependencies', async () => {
              await installer.install(
                'redbox-react',
                {
                  dependencies: {
                    peer: false,
                  },
                },
                logger
              );

              expect(this.sync.mock.calls).toMatchSnapshot();
            });
          });
        });
      });
    });
  });
});
