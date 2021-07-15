/* eslint-disable consistent-return */
/* eslint-disable no-useless-escape */
const fs = require("fs");
const path = require("path");
const util = require("util");
const spawn = require("cross-spawn");
const JSON5 = require("json5");
const { green, yellow } = require("colorette");
const { createFsFromVolume, Volume } = require("memfs");
const { validate } = require("schema-utils");
const webpack = require("webpack");

const utils = require("./utils");
const schema = require("./options.json");

const PLUGIN_NAME = "InstallPlugin";

const PEERS = /UNMET PEER DEPENDENCY ([a-z\-0-9\.]+)@(.+)/gm;

class InstallPlugin {
  constructor(options, state) {
    validate(schema, options, "install-webpack-plugin");

    this.preCompiler = undefined;
    this.compiler = undefined;
    this.logger = undefined;
    this.options = {
      dependencies: {
        peer: true,
      },
      packageManager: {
        type: utils.getDefaultPackageManager(),
        options: {
          dev: false,
          quiet: false,
        },
      },
      prompt: true,
      ...options,
    };
    this.resolving = new Set();
    this.state = state || new Map();
  }

  apply(compiler) {
    this.compiler = compiler;
    this.logger = compiler.getInfrastructureLogger("install-webpack-plugin");

    this.checkBabel();

    compiler.hooks.afterCompile.tap(PLUGIN_NAME, (compilation) => {
      console.log("afterCompile");

      compilation.errors = compilation.errors
        .map((err) => {
          if (err.name !== "ModuleNotFoundError") {
            return err;
          }

          const request = utils.depFromErr(err);

          if (!this.state.has(request)) {
            return err;
          }

          const state = this.state.get(request);

          if (state.status === "skipped") {
            console.log('ERRORRRRRRRR skipped', this.state);
            this.state.delete(request);
          }

          if (state.status === "notInstalled") {
            console.log('ERRORRRRRRRR notInstalled', this.state);
            this.state.delete(request);
          }

          if (state.status === "installed") {
            console.log('ERRORRRRRRRR installed', this.state);
            return false;
          }

          return err;
        })
        .filter(Boolean);
    });

    // Install externals that wouldn't normally be resolved
    if (Array.isArray(compiler.options.externals)) {
      compiler.options.externals.unshift((context, request, next) => {
        // Only install direct dependencies, not sub-dependencies
        if (context.match("node_modules")) {
          return next();
        }

        this.resolveExternal(context, request, next);
      });
    }

    compiler.hooks.afterResolvers.tap(PLUGIN_NAME, () => {
      // Install loaders on demand
      compiler.resolverFactory.hooks.resolver
        .for("loader")
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.rawModule.tapAsync(
            PLUGIN_NAME,
            (result, resolveContext, next) => {
              // Only install direct dependencies, not sub-dependencies
              if (result.path.match("node_modules")) {
                next();

                return;
              }

              if (this.state.has(result.request)) {
                next();

                return;
              }

              this.resolveRequest(
                result,
                resolveContext,
                utils.normalizeLoader,
                next
              );
            }
          );
        });

      // Install project dependencies on demand
      compiler.resolverFactory.hooks.resolver
        .for("normal")
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.rawModule.tapPromise(
            PLUGIN_NAME,
            (result, resolveContext) => {
              // const asyncResolve = () => new Promise((resolve) => {
              //   console.log('WAIT');
              //   setTimeout(() => {
              //     resolve();
              //   }, 5000);
              // })
              //
              // return asyncResolve();

              // Only install direct dependencies, not sub-dependencies
              // if (result.path.match("node_modules")) {
              //   console.log("resolverFactory node_modules", this.state);
              //   next();
              //
              //   return;
              // }
              //
              // if (this.state.has(result.request)) {
              //   console.log("resolverFactory has", this.state);
              //   next();
              //
              //   return;
              // }

              return this.resolveRequest(
                result,
                resolveContext,
                utils.depFromErr
              );
              console.log("resolverFactory resolveRequest", this.state);
              // next();
            }
          );
        });
    });
  }

  checkBabel() {
    let babelOpts;
    let babelrc;

    try {
      babelrc = require.resolve(path.join(process.cwd(), ".babelrc"));
      babelOpts = JSON5.parse(fs.readFileSync(babelrc, "utf8"));
    } catch (e) {
      try {
        const babelConfigJs = require.resolve(
          path.join(process.cwd(), "babel.config.js")
        );
        // eslint-disable-next-line
        babelOpts = require(babelConfigJs);
      } catch (e2) {
        this.logger.info("couldn't locate babel.config.js nor .babelrc");
      }

      if (babelrc) {
        this.logger.info(".babelrc is invalid JSON5, babel deps are skipped");
      }

      // Babel isn't installed, don't install deps
      return;
    }

    // Default plugins/presets
    const options = {
      plugins: [],
      presets: [],
      ...babelOpts,
    };

    if (!options.env) {
      options.env = {};
    }

    if (!options.env.development) {
      options.env.development = {};
    }

    // Default env.development plugins/presets
    options.env.development = {
      plugins: [],
      presets: [],
      ...options.env.development,
    };

    // Accumulate babel-core (required for babel-loader)+ all dependencies
    const deps = ["@babel/core"]
      .concat(
        options.plugins.map((plugin) =>
          utils.normalizeBabelPlugin(plugin, "babel-plugin-")
        )
      )
      .concat(
        options.presets.map((preset) =>
          utils.normalizeBabelPlugin(preset, "@babel/preset-")
        )
      )
      .concat(
        options.env.development.plugins.map((plugin) =>
          utils.normalizeBabelPlugin(plugin, "babel-plugin-")
        )
      )
      .concat(
        options.env.development.presets.map((preset) =>
          utils.normalizeBabelPlugin(preset, "@babel/preset-")
        )
      );

    // Check for missing dependencies
    const missing = deps.filter((dep) => utils.check(dep));

    // Install missing dependencies
    this.install(missing, options);
  }

  async install(deps, options = {}) {
    if (!deps) {
      return;
    }

    if (!Array.isArray(deps)) {
      // eslint-disable-next-line
      deps = [deps];
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
      const response = await utils.prompt({
        message: `[install-webpack-plugin] Would you like to install package(s) ${green(
          deps.join(", ")
        )}? (That will run '${green(`${client} ${args[0]}`)}') (${yellow(
          "Y/n"
        )})`,
        defaultResponse: "Y",
        stream: process.stderr,
      });
      if (!response) {
        this.logger.warn(
          "[install-webpack-plugin] Missing packages won't be installed."
        );
        return;
      }
    }

    args = args.concat(deps).filter(Boolean);

    if (save && utils.packageExists()) {
      args.push(save);
    }

    if (packageManager.options && packageManager.options.arguments) {
      args = args.concat(packageManager.options.arguments);
    }

    if (packageManager.options && packageManager.options.quiet) {
      args = args.concat(quietOptions);
    }

    deps.forEach((dep) => {
      this.logger.info("Installing %s...", dep);
    });

    // Ignore input, capture output, show errors
    const output = spawn.sync(client, args, {
      stdio: ["ignore", "pipe", "inherit"],
    });

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
      this.logger.info("Installing peer dependencies...");
      this.install(peers, options);
      this.logger.info("");
    }

    return output;
  }

  async runInstall(result) {
    const dep = utils.check(result.request);

    if (dep) {
      let { packageManager } = this.options;

      if (typeof packageManager === "function") {
        packageManager = packageManager(result.request, result.path);
      }

      return this.install(dep, { ...this.options, packageManager });
    }
  }

  preCompile(compilation, next) {
    if (!this.preCompiler) {
      console.log("DDDDDDDDDD");

      const { options } = this.compiler;
      const config = {
        ...options,
        plugins: [new InstallPlugin(this.options, this.state)],
      };

      this.preCompiler = webpack(config);
      this.preCompiler.outputFileSystem = createFsFromVolume(new Volume());
    }

    this.preCompiler.run(() => {
      this.preCompiler.close(() => {
        next();
      });
    });
  }

  resolve(resolver, result, callback) {
    // console.log( this.compiler.resolverFactory
    //   .get(resolver).resolve.toString())
    this.compiler.resolverFactory
      .get(resolver)
      .resolve(result.context, result.path, result.request, {}, callback);
  }

  resolveExternal(context, request, next) {
    console.log("EXTERNAL");
    // Ignore !!bundle?lazy!./something
    if (request.match(/(\?|\!)/)) {
      return next();
    }

    const result = {
      context: {},
      path: context,
      request,
    };

    this.resolve(
      "normal",
      result,
      // eslint-disable-next-line func-names
      async (err) => {
        if (err) {
          await this.runInstall({ ...result, request: utils.depFromErr(err) });

          return;
        }

        next();
      }
    );
  }

  resolveRequest(result, resolveContext, normalizeRequestFn) {
    const state = {
      // status: "processed",
    };

    // this.state.set(result.request, state);

    // return new Promise((resolve) => {
    //   console.log('WAIT');
    //   setTimeout(() => {
    //     resolve();
    //   }, 2000);
    // })

    return new Promise((resolve) => {

      this.resolve(
        "normal",
        result,
        // eslint-disable-next-line func-names
        (err) => {
          console.log('hERE');
          resolve();
        }
      );
    });

  }
}

module.exports = InstallPlugin;
