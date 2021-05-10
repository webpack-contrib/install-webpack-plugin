/* eslint-disable no-undefined */
const path = require('path');

const expect = require('expect');

const spawn = require('cross-spawn');

const installer = require('../src/installer');

describe('installer', () => {
  describe('.defaultOptions', () => {
    it('should default dev to false', () => {
      expect(installer.defaultOptions.dev).toEqual(false);
    });

    it('should default peerDependencies to true', () => {
      expect(installer.defaultOptions.peerDependencies).toEqual(true);
    });

    it('should default quiet to false', () => {
      expect(installer.defaultOptions.quiet).toEqual(false);
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
      this.sync = expect.spyOn(spawn, 'sync').andReturn({ stdout: null });

      expect.spyOn(console, 'info');
    });

    afterEach(() => {
      expect.restoreSpies();
    });

    describe("when .babelrc doesn't exist", () => {
      beforeEach(() => {
        process.chdir(path.join(process.cwd(), 'test'));
      });

      afterEach(() => {
        process.chdir(path.join(process.cwd(), '..'));
      });

      it('should return early', () => {
        const result = installer.checkBabel();

        expect(result).toBe(undefined);
        expect(this.sync).toNotHaveBeenCalled();
      });
    });

    describe('when .babelrc exists', () => {
      beforeEach(() => {
        process.chdir(path.join(process.cwd(), 'example/webpack2'));

        this.check = expect.spyOn(installer, 'check').andCall((dep) => dep);

        this.install = expect.spyOn(installer, 'install');
      });

      afterEach(() => {
        process.chdir(path.join(process.cwd(), '../../'));
      });

      it('should check plugins & presets', () => {
        installer.checkBabel();

        const checked = this.check.calls.map((call) => call.arguments[0]);

        expect(this.check).toHaveBeenCalled();
        expect(this.check.calls.length).toEqual(6);
        expect(checked).toEqual([
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

        expect(this.install).toHaveBeenCalled();
        expect(this.install.calls.length).toEqual(1);
        expect(this.install.calls[0].arguments).toEqual([
          [
            '@babel/core',
            'babel-plugin-react-html-attrs',
            '@babel/preset-react',
            '@babel/preset-es2015',
            '@babel/preset-stage-0',
            '@babel/preset-react-hmre',
          ],
        ]);
      });
    });
  });

  describe('.install', () => {
    beforeEach(() => {
      this.sync = expect.spyOn(spawn, 'sync').andReturn({ stdout: null });

      expect.spyOn(console, 'info');
      expect.spyOn(console, 'warn');
    });

    afterEach(() => {
      expect.restoreSpies();
    });

    describe('given a falsey value', () => {
      it('should return undefined', () => {
        expect(installer.install()).toEqual(undefined);
        expect(installer.install(0)).toEqual(undefined);
        expect(installer.install(false)).toEqual(undefined);
        expect(installer.install(null)).toEqual(undefined);
        expect(installer.install('')).toEqual(undefined);
      });
    });

    describe('given an empty array', () => {
      it('should return undefined', () => {
        expect(installer.install([])).toEqual(undefined);
      });
    });

    describe('given a non-existant module', () => {
      beforeEach(() => {
        this.sync.andReturn({ status: 1 });
      });

      it('should attempt to install once', () => {
        installer.install('does.not.exist.jsx');

        expect(this.sync).toHaveBeenCalled();
      });

      it('should not attempt to install it again', () => {
        installer.install('does.not.exist.jsx');

        expect(this.sync).toNotHaveBeenCalled();
      });
    });

    describe('when using yarn', () => {
      describe('given a dependency', () => {
        describe('with no options', () => {
          it('should install it with --save', () => {
            installer.install('foo', {
              yarn: true,
            });

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('yarn');
            expect(this.sync.calls[0].arguments[1]).toEqual(['add', 'foo']);
          });
        });

        describe('with dev set to true', () => {
          it('should install it with --dev', () => {
            installer.install('foo', {
              dev: true,
              yarn: true,
            });

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('yarn');
            expect(this.sync.calls[0].arguments[1]).toEqual([
              'add',
              'foo',
              '--dev',
            ]);
          });
        });

        describe('without a package.json present', () => {
          beforeEach(() => {
            expect.spyOn(installer, 'packageExists').andReturn(false);
          });

          afterEach(() => {
            expect.restoreSpies();
          });

          it('should install without options', () => {
            installer.install('foo', {
              yarn: true,
            });
            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('yarn');
            expect(this.sync.calls[0].arguments[1]).toEqual(['add', 'foo']);
          });
        });

        describe('with quiet set to true', () => {
          it('should install it with --silent --noprogress', () => {
            installer.install('foo', {
              quiet: true,
              yarn: true,
            });

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('yarn');
            expect(this.sync.calls[0].arguments[1]).toEqual([
              'add',
              'foo',
              '--silent',
            ]);
          });
        });

        describe('with missing peerDependencies', () => {
          beforeEach(() => {
            this.sync.andCall((bin, args) => {
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
            it('should install peerDependencies', () => {
              installer.install('redbox-react', {
                yarn: true,
              });

              expect(this.sync.calls.length).toEqual(2);
              expect(this.sync.calls[0].arguments[1]).toEqual([
                'add',
                'redbox-react',
              ]);

              // Ignore ranges, let NPM pick
              expect(this.sync.calls[1].arguments[1]).toEqual([
                'add',
                'UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc@react',
              ]);
            });
          });

          describe('given peerDependencies set to false', () => {
            it('should not install peerDependencies', () => {
              installer.install('redbox-react', {
                peerDependencies: false,
                yarn: true,
              });

              expect(this.sync.calls.length).toEqual(1);
              expect(this.sync.calls[0].arguments[1]).toEqual([
                'add',
                'redbox-react',
              ]);
            });
          });
        });
      });
    });

    describe('when using npm', () => {
      describe('given a dependency', () => {
        describe('with no options', () => {
          it('should install it with --save', () => {
            installer.install('foo');

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('npm');
            expect(this.sync.calls[0].arguments[1]).toEqual([
              'install',
              'foo',
              '--save',
            ]);
          });
        });

        describe('with dev set to true', () => {
          it('should install it with --save-dev', () => {
            installer.install('foo', {
              dev: true,
            });

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('npm');
            expect(this.sync.calls[0].arguments[1]).toEqual([
              'install',
              'foo',
              '--save-dev',
            ]);
          });
        });

        describe('without a package.json present', () => {
          beforeEach(() => {
            expect.spyOn(installer, 'packageExists').andReturn(false);
          });

          afterEach(() => {
            expect.restoreSpies();
          });

          it('should install without --save', () => {
            installer.install('foo');
            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('npm');
            expect(this.sync.calls[0].arguments[1]).toEqual(['install', 'foo']);
          });
        });

        describe('with quiet set to true', () => {
          it('should install it with --silent --noprogress', () => {
            installer.install('foo', {
              quiet: true,
            });

            expect(this.sync).toHaveBeenCalled();
            expect(this.sync.calls.length).toEqual(1);
            expect(this.sync.calls[0].arguments[0]).toEqual('npm');
            expect(this.sync.calls[0].arguments[1]).toEqual([
              'install',
              'foo',
              '--save',
              '--silent',
              '--no-progress',
            ]);
          });
        });

        describe('with missing peerDependencies', () => {
          beforeEach(() => {
            this.sync.andCall((bin, args) => {
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
            it('should install peerDependencies', () => {
              installer.install('redbox-react');

              expect(this.sync.calls.length).toEqual(2);
              expect(this.sync.calls[0].arguments[1]).toEqual([
                'install',
                'redbox-react',
                '--save',
              ]);

              // Ignore ranges, let NPM pick
              expect(this.sync.calls[1].arguments[1]).toEqual([
                'install',
                'UNMET PEER DEPENDENCY react@>=0.13.2 || ^0.14.0-rc1 || ^15.0.0-rc@react',
                '--save',
              ]);
            });
          });

          describe('given peerDependencies set to false', () => {
            it('should not install peerDependencies', () => {
              installer.install('redbox-react', {
                peerDependencies: false,
              });

              expect(this.sync.calls.length).toEqual(1);
              expect(this.sync.calls[0].arguments[1]).toEqual([
                'install',
                'redbox-react',
                '--save',
              ]);
            });
          });
        });
      });
    });
  });
});
