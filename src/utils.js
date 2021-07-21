/* eslint-disable consistent-return, no-useless-escape */
const fs = require("fs");
const path = require("path");

const spawn = require("cross-spawn");

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
    // eslint-disable-next-line no-console
    console.error("No package manager found.");
    process.exit(2);
  }
}

module.exports = {
  getDefaultPackageManager,
  depFromErr,
};
