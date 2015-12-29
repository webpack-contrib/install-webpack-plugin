# npm-install-loader

> Webpack loader to automatically npm install & save dependencies.

### Why?

It sucks to <kbd>Ctrl-C</kbd> your
build script & server just to install
a dependency you didn't know you needed until now.

Instead, use `require` or `import` how you normally would and `npm install`
will happen automatically install missing dependencies between reloads.

### Usage

In your `webpack.config.js`:

```js
module: {
  postLoaders: [
    {
      exclude: /node_modules/,
      loader: "npm-install-loader",
      test: /\.js$/,
    },
  ],
}
```

This will ensure that any other loaders
(e.g. `eslint-loader`, `babel-loader`, etc.) have completed.

### Saving

This loader simply runs `npm install [modules]`.

I recommend creating an `.npmrc` file
in the root of your project with:

```ini
save=true
```

This will automatically save any dependencies anytime you run `npm install` (no need to pass `--save`).


### License

> MIT License 2015 © Eric Clemmons


[![travis build](https://img.shields.io/travis/ericclemmons/npm-install-loader.svg)](https://travis-ci.org/ericclemmons/npm-install-loader)
[![Coverage Status](https://coveralls.io/repos/ericclemmons/npm-install-loader/badge.svg?branch=master&service=github&style=flat-square)](https://coveralls.io/github/ericclemmons/npm-install-loader?branch=master)
[![version](https://img.shields.io/npm/v/npm-install-loader.svg)](http://npm.im/npm-install-loader)
[![downloads](https://img.shields.io/npm/dm/npm-install-loader.svg)](http://npm-stat.com/charts.html?package=npm-install-loader)
[![MIT License](https://img.shields.io/npm/l/npm-install-loader.svg)](http://opensource.org/licenses/MIT)
