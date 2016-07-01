var spawn = require("cross-spawn");
var fs = require("fs");
var path = require("path");
var util = require("util");

var EXTERNAL = /^\w[a-z\-0-9\.]+$/; // Match "react", "path", "fs", "lodash.random", etc.
var PEERS = /UNMET PEER DEPENDENCY ([a-z\-0-9\.]+)@(.+)/gm;

var defaultOptions = { dev: false, peerDependencies: true };
var erroneous = [];

module.exports.check = function(request) {
  if (!request) {
    return;
  }

  var namespaced = request.charAt(0) === "@";
  var dep = request.split("/")
    .slice(0, namespaced ? 2 : 1)
    .join("/")
  ;

  // Ignore relative modules, which aren't installed by NPM
  if (!dep.match(EXTERNAL) && !namespaced) {
    return;
  }

  try {
    var pkgPath = require.resolve(path.join(process.cwd(), "package.json"));
    var pkg = require(pkgPath);

    // Remove cached copy for future checks
    delete require.cache[pkgPath];
  } catch(e) {
    throw e;
  }

  var hasDep = pkg.dependencies && pkg.dependencies[dep];
  var hasDevDep = pkg.devDependencies && pkg.devDependencies[dep];

  // Bail early if we've already installed this dependency
  if (hasDep || hasDevDep) {
    return;
  }

  // Ignore linked modules
  try {
    var stats = fs.lstatSync(path.join(process.cwd(), "node_modules", dep));

    if (stats.isSymbolicLink()) {
      return;
    }
  } catch(e) {
    // Module exists in node_modules, but isn't symlinked
  }

  // Ignore NPM global modules (e.g. "path", "fs", etc.)
  try {
    var resolved = require.resolve(dep);

    // Global modules resolve to their name, not an actual path
    if (resolved.match(EXTERNAL)) {
      return;
    }
  } catch(e) {
    // Module is not resolveable
  }

  return dep;
};

module.exports.checkBabel = function checkBabel() {
  try {
    var babelrc = require.resolve(path.join(process.cwd(), ".babelrc"));
  } catch (e) {
    // Babel isn't installed, don't install deps
    return;
  }

  // Default plugins/presets
  var options = Object.assign({
    plugins: [],
    presets: [],
  }, JSON.parse(fs.readFileSync(babelrc, "utf8")));

  if (!options.env) {
    options.env = {};
  }

  if (!options.env.development) {
    options.env.development = {};
  }

  // Default env.development plugins/presets
  options.env.development = Object.assign({
    plugins: [],
    presets: [],
  }, options.env.development);

  // Accumulate babel-core (required for babel-loader)+ all dependencies
  var deps = ["babel-core"].concat(options.plugins.map(function(plugin) {
    return "babel-plugin-" + plugin;
  })).concat(options.presets.map(function(preset) {
    return "babel-preset-" + preset;
  })).concat(options.env.development.plugins.map(function(plugin) {
    return "babel-plugin-" + plugin;
  })).concat(options.env.development.presets.map(function(preset) {
    return "babel-preset-" + preset;
  }));

  // Check for missing dependencies
  var missing = deps.filter(function(dep) {
    return this.check(dep);
  }.bind(this));

  // Install missing dependencies
  this.install(missing);
};

module.exports.checkPackage = function checkPackage() {
  try {
    require.resolve(path.join(process.cwd(), "package.json"));

    return;
  } catch (e) {
    // package.json does not exist
  }

  console.info("Initializing `%s`...", "package.json");
  spawn.sync("npm", ["init", "-y"], { stdio: "inherit" });
};

module.exports.defaultOptions = defaultOptions;

module.exports.install = function install(deps, options) {
  if (!deps) {
    return;
  }

  if (!Array.isArray(deps)) {
    deps = [deps];
  }

  options = Object.assign({}, defaultOptions, options);

  // Ignore known, erroneous modules
  deps = deps.filter(function(dep) {
    return erroneous.indexOf(dep) === -1;
  });

  if (!deps.length) {
    return;
  }

  var args = ["install"].concat(deps).filter(Boolean);

  args.push(options.dev ? "--save-dev" : "--save");

  deps.forEach(function(dep) {
    console.info("Installing %s...", dep);
  });

  // Ignore input, capture output, show errors
  var output = spawn.sync("npm", args, {
    stdio: ["ignore", "pipe", "inherit"]
  });

  if (output.status) {
    deps.forEach(function(dep) {
      erroneous.push(dep);
    });
  }

  var matches = null;
  var peers = [];

  // RegExps track return a single result each time
  while (matches = PEERS.exec(output.stdout)) {
    var dep = matches[1];
    var version = matches[2];

    // Ranges don't work well, so let NPM pick
    if (version.match(" ")) {
      peers.push(dep);
    } else {
      peers.push(util.format("%s@%s", dep, version));
    }
  }

  if (options.peerDependencies && peers.length) {
    console.info("Installing peerDependencies...");
    this.install(peers, options);
    console.info("");
  }

  return output;
};
