var spawn = require("cross-spawn");
var fs = require("fs");
var kebabCase = require("lodash.kebabcase");
var path = require("path");
var util = require("util");

module.exports.check = function(request) {
  // Only look for the dependency directory
  // @TODO Support namespaced NPM modules (e.g. @cycle/dom)
  var dep = request.split("/").shift().toLowerCase();

  // Ignore relative modules, which aren't installed by NPM
  if (!dep.match(/^[a-z\-0-9]+$/)) {
    return;
  }

  try {
    var packagePath = require.resolve(path.join(process.cwd(), "package.json"));
    var package = require(packagePath);

    // Remove cached copy for future checks
    delete require.cache[packagePath];
  } catch(e) {
    throw e;
  }

  var hasDep = package.dependencies && package.dependencies[dep];
  var hasDevDep = package.devDependencies && package.devDependencies[dep];

  // Bail early if we've already installed this dependency
  if (hasDep || hasDevDep) {
    return;
  }

  return dep;
}

module.exports.install = function install(dep, options) {
  var args = ["install"].concat([dep]).filter(Boolean);

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

  console.info("Installing missing dependency `%s`...", dep);

  var output = spawn.sync("npm", args, { stdio: "inherit" });

  return output;
};
