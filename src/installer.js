var child = require("child_process");
var fs = require("fs");
var path = require("path");

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

module.exports.install = function install(dependencies) {
  if (dependencies && dependencies.length) {
    console.info("Installing missing dependencies %s...", dependencies.join(" "));

    return child.spawnSync("npm", ["install"].concat(dependencies), { stdio: "inherit" });
  }
};
