/* eslint-disable consistent-return, no-useless-escape */
const fs = require("fs");
const path = require("path");

const resolve = require("resolve");
const spawn = require("cross-spawn");

// Match "react", "path", "fs", "lodash.random", etc.
const EXTERNAL = /^\w[a-z\-0-9\.]+$/;

const depFromErr = (err) => {
  if (!err) {
    return;
  }

  /**
   * Supported package formats:
   * - path
   * - react-lite
   * - @cycle/core
   * - bootswatch/lumen/bootstrap.css
   * - lodash.random
   */
  const matches =
    /(?:(?:Cannot resolve module)|(?:Can't resolve)) '([@\w\/\.-]+)' in/.exec(
      err
    );

  if (!matches) {
    return;
  }

  return matches[1];
};

/* eslint-disable line-comment-position */
/**
 * Ensure loaders end with `-loader` (e.g. `babel` => `babel-loader`)
 * Also force Webpack2's duplication of `-loader` to a single occurrence
 */
const normalizeLoader = (loader) =>
  loader // e.g. react-hot-loader/webpack
    .split("/") // ["react-hot-loader", "webpack"]
    .shift() // "react-hot-loader"
    .split("-loader") // ["react-hot", ""]
    .shift() // "react-hot"
    .concat("-loader"); // "react-hot-loader

function normalizeBabelPlugin(plugin, prefix) {
  // Babel plugins can be configured as [plugin, options]
  if (Array.isArray(plugin)) {
    // eslint-disable-next-line
    plugin = plugin[0];
  }
  if (plugin.indexOf(prefix) === 0) {
    return plugin;
  }
  return prefix + plugin;
}

/**
 *
 * Returns the name of package manager to use,
 * preference order - npm > yarn > pnpm
 *
 * @returns {String} - The package manager name
 */
function getDefaultPackageManager() {
  const hasLocalNpm = fs.existsSync(
    path.resolve(process.cwd(), "package-lock.json")
  );

  if (hasLocalNpm) {
    return "npm";
  }

  const hasLocalYarn = fs.existsSync(path.resolve(process.cwd(), "yarn.lock"));

  if (hasLocalYarn) {
    return "yarn";
  }

  const hasLocalPnpm = fs.existsSync(
    path.resolve(process.cwd(), "pnpm-lock.yaml")
  );

  if (hasLocalPnpm) {
    return "pnpm";
  }

  try {
    // the sync function below will fail if npm is not installed,
    // an error will be thrown
    if (spawn.sync("npm", ["--version"])) {
      return "npm";
    }
  } catch (e) {
    // Nothing
  }

  try {
    // the sync function below will fail if yarn is not installed,
    // an error will be thrown
    if (spawn.sync("yarn", ["--version"])) {
      return "yarn";
    }
  } catch (e) {
    // Nothing
  }

  try {
    // the sync function below will fail if pnpm is not installed,
    // an error will be thrown
    if (spawn.sync("pnpm", ["--version"])) {
      return "pnpm";
    }
  } catch (e) {
    console.error("No package manager found.");
    process.exit(2);
  }
}

function check(request) {
  if (!request) {
    return;
  }

  const namespaced = request.charAt(0) === "@";
  const dep = request
    .split("/")
    .slice(0, namespaced ? 2 : 1)
    .join("/");
  // Ignore relative modules, which aren't installed by NPM
  if (!dep.match(EXTERNAL) && !namespaced) {
    return;
  }

  // Ignore modules which can be resolved using require.resolve()'s algorithm
  try {
    resolve.sync(dep, { basedir: process.cwd() });
    return;
  } catch (e) {
    // Module is not resolveable
  }

  return dep;
}

function prompt({ message, defaultResponse, stream }) {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: stream,
  });

  return new Promise((resolve) => {
    rl.question(`${message} `, (answer) => {
      // Close the stream
      rl.close();

      const response = (answer || defaultResponse).toLowerCase();

      // Resolve with the input response
      if (response === "y" || response === "yes") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function packageExists() {
  const pkgPath = path.resolve("package.json");
  try {
    require.resolve(pkgPath);
    // Remove cached copy for future checks
    delete require.cache[pkgPath];
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  getDefaultPackageManager,
  normalizeBabelPlugin,
  normalizeLoader,
  packageExists,
  depFromErr,
  prompt,
  check
};
