# Change Log

## [4.0.4](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/4.0.4) (2016-06-30)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v4.0.3...4.0.4)

**Fixed bugs:**

- Install peerDependency without version when given a range [\#58](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/58) ([ericclemmons](https://github.com/ericclemmons))

## [v4.0.3](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v4.0.3) (2016-06-14)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v4.0.2...v4.0.3)

**Fixed bugs:**

- Fix react-hot-loader/webpack lookup [\#55](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/55) ([ericclemmons](https://github.com/ericclemmons))

## [v4.0.2](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v4.0.2) (2016-06-14)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v4.0.1...v4.0.2)

**Merged pull requests:**

- Update all dependencies 🌴 [\#54](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/54) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [v4.0.1](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v4.0.1) (2016-06-07)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v4.0.0...v4.0.1)

**Fixed bugs:**

- Fix failure to initialise package.json in Windows [\#52](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/52) ([insin](https://github.com/insin))

## [v4.0.0](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v4.0.0) (2016-05-23)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v3.1.4...v4.0.0)

**Implemented enhancements:**

- installPeers Option [\#41](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/41)
- New Options \(dev, peerDependencies\) [\#13](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/13) ([insin](https://github.com/insin))

## [v3.1.4](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v3.1.4) (2016-05-20)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v3.1.3...v3.1.4)

**Implemented enhancements:**

- Warn on missing NPM packages [\#48](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/48) ([bebraw](https://github.com/bebraw))

## [v3.1.3](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v3.1.3) (2016-05-13)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v3.1.2...v3.1.3)

**Implemented enhancements:**

- Require Node v4.2.0  [\#47](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/47) ([bebraw](https://github.com/bebraw))

**Closed issues:**

- Feature request: the dependancy should be removed if no import statements are present [\#46](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/46)

## [v3.1.2](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v3.1.2) (2016-05-12)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v3.1.1...v3.1.2)

**Implemented enhancements:**

- Performance [\#45](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/45) ([bebraw](https://github.com/bebraw))

**Fixed bugs:**

- Performance [\#45](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/45) ([bebraw](https://github.com/bebraw))

**Closed issues:**

- Trying to install webpack loaders with `-loader` in it [\#44](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/44)

## [v3.1.1](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v3.1.1) (2016-04-30)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v3.1.0...v3.1.1)

**Fixed bugs:**

- v3.1.0 seems to break webpack-dev-server behavior [\#43](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/43) ([cafreeman](https://github.com/cafreeman))

## [v3.1.0](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v3.1.0) (2016-04-25)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v3.0.0...v3.1.0)

**Implemented enhancements:**

- Install peerDependencies [\#40](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/40) ([chadrien](https://github.com/chadrien))
- Support Webpack 2.x [\#30](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/30) ([bhavinkamani](https://github.com/bhavinkamani))
- Support `import loadThing from "bundle?lazy!./thing"` [\#29](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/29) ([ryanflorence](https://github.com/ryanflorence))
- Initialize missing `package.json` [\#28](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/28) ([satya164](https://github.com/satya164))
- Support .babelrc [\#23](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/23) ([bebraw](https://github.com/bebraw))

**Fixed bugs:**

- webpack-dev-server doesn't find packages right after they're installed [\#34](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/34)
- Seems to add extra packages to package.json [\#26](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/26)
- Passing tests + README [\#39](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/39) ([ericclemmons](https://github.com/ericclemmons))
- Support installation of packages with a period in their name, e.g. lodash.random [\#33](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/33) ([insin](https://github.com/insin))

**Closed issues:**

- Feature request: support for webpack resolve.alias and resolve.root [\#31](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/31)

**Merged pull requests:**

- enhance the example readme [\#38](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/38) ([poeticninja](https://github.com/poeticninja))
- Update README.md [\#25](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/25) ([coryhouse](https://github.com/coryhouse))

## [v3.0.0](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v3.0.0) (2016-03-08)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v2.0.2...v3.0.0)

**Implemented enhancements:**

- Webpack resolve support [\#17](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/17) ([fritx](https://github.com/fritx))

**Fixed bugs:**

- repeatedly installs same modules [\#20](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/20)

**Closed issues:**

- Exclude some packages [\#27](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/27)
- Working with relative imports using 'resolve' [\#24](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/24)
- Allow save/saveDev/saveExact behavior to be customized based on context [\#22](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/22)

## [v2.0.2](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v2.0.2) (2016-01-31)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v2.0.1...v2.0.2)

**Implemented enhancements:**

- Support loader shorthand \(e.g. "babel" vs. "babel-loader"\) [\#16](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/16) ([fritx](https://github.com/fritx))

## [v2.0.1](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v2.0.1) (2016-01-31)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v2.0.0...v2.0.1)

**Fixed bugs:**

- Mismatch between code and documentation [\#18](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/18) ([dlmr](https://github.com/dlmr))

## [v2.0.0](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v2.0.0) (2016-01-24)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v1.1.1...v2.0.0)

**Implemented enhancements:**

- Tweak logging of installation info [\#10](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/10) ([insin](https://github.com/insin))
- Convert to Webpack Plugin [\#5](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/5) ([ericclemmons](https://github.com/ericclemmons))

**Closed issues:**

- Transitive dependencies with npm3 [\#14](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/14)
- Strip webpack directives before running npm install [\#12](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/12)
- Missing require\(\) pattern [\#11](https://github.com/ericclemmons/npm-install-webpack-plugin/issues/11)

## [v1.1.1](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v1.1.1) (2016-01-04)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v1.1.0...v1.1.1)

**Fixed bugs:**

- Fix spawning npm on Windows [\#9](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/9) ([insin](https://github.com/insin))

## [v1.1.0](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v1.1.0) (2016-01-02)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v1.0.2...v1.1.0)

**Implemented enhancements:**

- Use --save or --save-exact flags when installing based on loader query config [\#3](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/3) ([insin](https://github.com/insin))

## [v1.0.2](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v1.0.2) (2016-01-02)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v1.0.1...v1.0.2)

**Implemented enhancements:**

- 100% Coverage [\#8](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/8) ([ericclemmons](https://github.com/ericclemmons))
- Whitelist package.json "files" [\#7](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/7) ([ericclemmons](https://github.com/ericclemmons))

## [v1.0.1](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v1.0.1) (2015-12-30)
[Full Changelog](https://github.com/ericclemmons/npm-install-webpack-plugin/compare/v1.0.0...v1.0.1)

**Fixed bugs:**

- Support deep imports and multiple imports from the same module [\#4](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/4) ([insin](https://github.com/insin))

## [v1.0.0](https://github.com/ericclemmons/npm-install-webpack-plugin/tree/v1.0.0) (2015-12-29)
**Implemented enhancements:**

- Initial Release [\#1](https://github.com/ericclemmons/npm-install-webpack-plugin/pull/1) ([ericclemmons](https://github.com/ericclemmons))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*