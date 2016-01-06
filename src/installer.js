var spawn = require("cross-spawn");
var fs = require("fs");
var kebabCase = require("lodash.kebabcase");
var path = require("path");
var util = require("util");

module.exports.check = function(dependencies, dirs) {
  var missing = [];
  dependencies.forEach(function(dependency) {
    // Ignore relative modules, which aren't installed by NPM
    if (/^\./.test(dependency)) {
      return;
    }

    // Only look for the dependency directory
    dependency = dependency.split('/')[0];

    // Bail early if we've already determined this is a missing dependency
    if (missing.indexOf(dependency) !== -1) {
      return;
    }

    try {
      // Ignore dependencies that are resolveable
      require.resolve(dependency);

      return;
    } catch(e) {
      var modulePaths = (dirs || []).map(function(dir) {
        return path.resolve(dir, dependency);
      });

      // Check all module directories for dependency directory
      while (modulePaths.length) {
        var modulePath = modulePaths.shift();

        try {
          // If it exists, Webpack can find it
          fs.statSync(modulePath);

          return;
        } catch(e) {}
      }

      // Dependency must be missing
      missing.push(dependency);
    }
  });
  return missing;
}

module.exports.install = function install(dependencies, options) {
  if (!dependencies || !dependencies.length) {
    return undefined;
  }

  var args = ["install"].concat(dependencies);

  if (options) {
    for (option in options) {
      var arg = util.format("--%s", kebabCase(option));
      var value = options[option];

      if (value === false) {
        continue;
      }

      if (value === true) {
        args.push(arg);
      } else {
        args.push(util.format("%s='%s'", arg, value));
      }
    }
  }

  var suffix = dependencies.length === 1 ? "y" : "ies";
  console.info("Installing missing dependenc%s %s...", suffix, dependencies.join(", "));

  return spawn.sync("npm", args, { stdio: "inherit" });
};
