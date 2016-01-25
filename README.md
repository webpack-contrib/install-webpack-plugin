# npm-install-webpack-plugin

> Speed up development by **automatically installing & saving dependencies** with Webpack.
>
> [![npm-install-webpack-plugin mp4](https://cloud.githubusercontent.com/assets/15182/12540538/6a4e8f1a-c2d0-11e5-97ee-4ddaf6892645.gif)](https://dl.dropboxusercontent.com/u/55764/npm-install-webpack-plugin.mp4)

Seamlessly works with:
- [x] Javascript
  (e.g. `require`, `import`)
- [x] CSS
  (e.g. `@import "~bootstrap"`)
- [x] Webpack loaders
  (e.g. `babel-loader`, `file-loader`, etc.)

[![travis build](https://img.shields.io/travis/ericclemmons/npm-install-webpack-plugin.svg)](https://travis-ci.org/ericclemmons/npm-install-webpack-plugin)
[![Coverage Status](https://coveralls.io/repos/ericclemmons/npm-install-webpack-plugin/badge.svg?branch=master&service=github)](https://coveralls.io/github/ericclemmons/npm-install-webpack-plugin?branch=master)
[![version](https://img.shields.io/npm/v/npm-install-webpack-plugin.svg)](http://npm.im/npm-install-webpack-plugin)
[![downloads](https://img.shields.io/npm/dm/npm-install-webpack-plugin.svg)](http://npm-stat.com/charts.html?package=npm-install-webpack-plugin)
[![MIT License](https://img.shields.io/npm/l/npm-install-webpack-plugin.svg)](http://opensource.org/licenses/MIT)

- - -

### Why?

It sucks to <kbd>Ctrl-C</kbd> your
build script & server just to install
a dependency you didn't know you needed until now.

Instead, use `require` or `import` how you normally would and `npm install`
will happen **automatically install & save missing dependencies** while you work!

### Installation

```shell
$ npm install --save-dev npm-install-webpack-plugin
```

### Usage

In your `webpack.config.js`:

```js
plugins: [
  new NpmInstallPlugin(),
],
```

**If you have an `.npmrc` file in your project,
those arguments will be used:**

```
save=true
save-exact=true
```

Alternatively, you can provide your own arguments to `npm install`:

```js
plugins: [
  new NpmInstallPlugin({
    ...
    cacheMin: 999999  // --cache-min=999999 (prefer NPM cached version)
    registry: "..."   // --registry="..."
    save: true,       // --save
    saveDev: true,    // --save-dev
    saveExact: true,  // --save-exact
    ...
  }),
],
```

### License

> MIT License 2016 © Eric Clemmons
