var child = require("child_process");
var fs = require("fs");
var path = require("path");

module.exports.check = function(dependencies, dirs) {
  return dependencies.filter(function(dependency) {
    // Ignore relative modules, which aren't installed by NPM
    if (!/^[a-z\-0-9]+$/.test(dependency)) {
      return false;
    }

    try {
      // Ignore dependencies that are resolveable
      require.resolve(dependency);

      return false;
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

          return false;
        } catch(e) {}
      }

      // Dependency must be missing
      return true;
    }
  });
}

module.exports.install = function install(dependencies) {
  if (dependencies && dependencies.length) {
    console.info("Installing missing dependencies %s...", dependencies.join(" "));

    return child.spawnSync("npm", ["install"].concat(dependencies), { stdio: "inherit" });
  }
};
