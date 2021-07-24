/* eslint-disable consistent-return, no-useless-escape */
const fs = require("fs");
const path = require("path");
const util = require("util");

const spawn = require("cross-spawn");

const { green, yellow } = require("colorette");

// Match "react", "path", "fs", "lodash.random", etc.
const EXTERNAL = /^\w[a-z\-0-9\.]+$/;
const PEERS = /UNMET PEER DEPENDENCY ([a-z\-0-9\.]+)@(.+)/gm;

/**
 *
 * Returns the name of package manager to use,
 * preference order - npm > yarn > pnpm
 *
 * @returns {String} - The package manager name
 */
module.exports.getDefaultPackageManager = function getDefaultPackageManager() {
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
};

const defaultOptions = {
  dependencies: {
    peer: true,
  },
  packageManager: {
    type: this.getDefaultPackageManager(),
    options: {
      dev: false,
      quiet: false,
    },
  },
  prompt: true,
};

const erroneous = [];

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

module.exports.prompt = ({ message, defaultResponse, stream }) => {
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
};

module.exports.packageExists = function packageExists() {
  const pkgPath = path.resolve("package.json");
  try {
    require.resolve(pkgPath);
    // Remove cached copy for future checks
    delete require.cache[pkgPath];
    return true;
  } catch (e) {
    return false;
  }
};

module.exports.check = function check(request) {
  if (!request) {
    return;
  }

  const resolve = require("resolve");
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
};

module.exports.checkBabel = function checkBabel(pluginOptions, logger) {
  const JSON5 = require("json5");
  let babelOpts;
  let babelrc;
  try {
    babelrc = require.resolve(path.join(process.cwd(), ".babelrc"));
    babelOpts = JSON5.parse(fs.readFileSync(babelrc, "utf8"));
  } catch (e) {
    try {
      const babelConfigJs = require.resolve(
        path.join(process.cwd(), ".babelrc")
      );
      // eslint-disable-next-line
      babelOpts = require(babelConfigJs);
    } catch (e2) {
      logger.info("couldn't locate babel.config.js nor .babelrc");
    }
    if (babelrc) {
      logger.info(".babelrc is invalid JSON5, babel deps are skipped");
    }
    // Babel isn't installed, don't install deps
    return;
  }

  // Default plugins/presets
  const options = Object.assign(
    {
      plugins: [],
      presets: [],
    },
    babelOpts
  );

  if (!options.env) {
    options.env = {};
  }

  if (!options.env.development) {
    options.env.development = {};
  }

  // Default env.development plugins/presets
  options.env.development = Object.assign(
    {
      plugins: [],
      presets: [],
    },
    options.env.development
  );

  // Accumulate babel-core (required for babel-loader)+ all dependencies
  const deps = ["@babel/core"]
    .concat(
      options.plugins.map((plugin) =>
        normalizeBabelPlugin(plugin, "babel-plugin-")
      )
    )
    .concat(
      options.presets.map((preset) =>
        normalizeBabelPlugin(preset, "@babel/preset-")
      )
    )
    .concat(
      options.env.development.plugins.map((plugin) =>
        normalizeBabelPlugin(plugin, "babel-plugin-")
      )
    )
    .concat(
      options.env.development.presets.map((preset) =>
        normalizeBabelPlugin(preset, "@babel/preset-")
      )
    );

  // Check for missing dependencies
  const missing = deps.filter((dep) => this.check(dep));

  // Install missing dependencies
  this.install(missing, pluginOptions, logger);
};

module.exports.defaultOptions = defaultOptions;

module.exports.install = async function install(deps, options, logger) {
  if (!deps) {
    return;
  }

  if (!Array.isArray(deps)) {
    // eslint-disable-next-line
    deps = [deps];
  }

  // eslint-disable-next-line
  options = Object.assign({}, defaultOptions, options);

  // Ignore known, erroneous modules
  // eslint-disable-next-line
  deps = deps.filter((dep) => erroneous.indexOf(dep) === -1);

  if (!deps.length) {
    return;
  }

  let args;
  let client;
  let quietOptions;
  let save;

  const { packageManager } = options;

  if (
    packageManager === "yarn" ||
    (packageManager && packageManager.type === "yarn")
  ) {
    args = ["add"];
    client = "yarn";
    save =
      packageManager.options && packageManager.options.dev ? "--dev" : null;
    quietOptions = ["--silent"];
  } else if (
    packageManager === "pnpm" ||
    (packageManager && packageManager.type === "pnpm")
  ) {
    args = ["add"];
    client = "pnpm";
    save =
      packageManager.options && packageManager.options.dev
        ? "--save-dev"
        : null;
    quietOptions = ["--reporter=silent"];
  } else {
    args = ["install"];
    client = "npm";
    save =
      packageManager.options && packageManager.options.dev
        ? "--save-dev"
        : "--save";
    quietOptions = ["--silent", "--no-progress"];
  }

  if (options.prompt) {
    const response = await this.prompt({
      message: `[install-webpack-plugin] Would you like to install package(s) ${green(
        deps.join(", ")
      )},
      )}'? (That will run '${green(`${client} ${args[0]}`)}') (${yellow(
        "Y/n"
      )})`,
      defaultResponse: "Y",
      stream: process.stderr,
    });
    if (!response) {
      logger.warn(
        "[install-webpack-plugin] Missing packages won't be installed."
      );
      return;
    }
  }

  args = args.concat(deps).filter(Boolean);

  if (save && module.exports.packageExists()) {
    args.push(save);
  }

  if (packageManager.options && packageManager.options.arguments) {
    args = args.concat(packageManager.options.arguments);
  }

  if (packageManager.options && packageManager.options.quiet) {
    args = args.concat(quietOptions);
  }

  deps.forEach((dep) => {
    logger.info("Installing %s...", dep);
  });

  // Ignore input, capture output, show errors
  const output = spawn.sync(client, args, {
    stdio: ["ignore", "pipe", "inherit"],
  });

  if (output.status) {
    deps.forEach((dep) => {
      erroneous.push(dep);
    });
  }

  let matches = null;
  const peers = [];

  // RegExps track return a single result each time
  // eslint-disable-next-line no-cond-assign
  while ((matches = PEERS.exec(output.stdout))) {
    const [dep, version] = matches;

    // Ranges don't work well, so let NPM pick
    if (version.match(" ")) {
      peers.push(dep);
    } else {
      peers.push(util.format("%s@%s", dep, version));
    }
  }

  if (options.dependencies.peer && peers.length) {
    logger.info("Installing peer dependencies...");
    this.install(peers, options, logger);
    logger.info("");
  }

  return output;
};
