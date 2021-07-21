/* eslint-disable consistent-return */
/* eslint-disable no-useless-escape */
const fs = require("fs");
const path = require("path");

const spawn = require("cross-spawn");
const { green, yellow } = require("colorette");
const { validate } = require("schema-utils");
const PQueue = require("p-queue").default;

const { getDefaultPackageManager, depFromErr } = require("./utils");
const schema = require("./options.json");

const PLUGIN_NAME = "InstallPlugin";

class InstallPlugin {
  constructor(options) {
    validate(schema, options, "install-webpack-plugin");

    this.options = options;

    if (typeof this.options.prompt === "undefined") {
      this.options.prompt = true;
    }

    const defaultPackageManagerOptions = {
      dev: true,
    };

    if (typeof this.options.packageManager === "undefined") {
      this.options.packageManager = {
        type: getDefaultPackageManager(),
        options: defaultPackageManagerOptions,
      };
    } else if (typeof this.options.packageManager === "string") {
      this.options.packageManager = {
        type: this.options.packageManager,
        options: defaultPackageManagerOptions,
      };
    } else {
      this.options.packageManager = {
        type:
          typeof this.options.packageManager.type !== "undefined"
            ? this.options.packageManager.type
            : getDefaultPackageManager(),
        options: {
          ...defaultPackageManagerOptions,
          ...this.options.packageManager.options,
        },
      };
    }
  }

  static doPrompt({ message, defaultResponse, stream }) {
    // eslint-disable-next-line global-require
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

  static packageJSONPath() {
    const cwd = process.cwd();
    let packageJSONPath;

    let dir = cwd;

    for (;;) {
      try {
        const possible = path.join(dir, "package.json");

        if (fs.statSync(possible).isFile()) {
          packageJSONPath = possible;
          break;
        }
      } catch (e) {
        // Nothing
      }

      const parent = path.dirname(dir);

      if (dir === parent) {
        // eslint-disable-next-line no-undefined
        dir = undefined;

        break;
      }

      dir = parent;
    }

    return packageJSONPath;
  }

  apply(compiler) {
    this.compiler = compiler;
    this.logger = compiler.getInfrastructureLogger("install-webpack-plugin");
    this.queue = new PQueue({ concurrency: 1 });
    this.state = new Map();
    this.packageJSONPath = InstallPlugin.packageJSONPath();

    compiler.hooks.afterCompile.tap(PLUGIN_NAME, (compilation) => {
      // eslint-disable-next-line no-param-reassign
      compilation.errors = compilation.errors
        .map((err) => {
          if (err.name !== "ModuleNotFoundError") {
            return err;
          }

          // const request = depFromErr(err);

          // if (!this.state.has(request)) {
          //   return err;
          // }

          // const state = this.state.get(request);
          //
          // if (state.status === "skipped") {
          //   console.log("ERRORRRRRRRR skipped", this.state);
          //   this.state.delete(request);
          // }
          //
          // if (state.status === "notInstalled") {
          //   console.log("ERRORRRRRRRR notInstalled", this.state);
          //   this.state.delete(request);
          // }
          //
          // if (state.status === "installed") {
          //   console.log("ERRORRRRRRRR installed", this.state);
          //   return false;
          // }

          return err;
        })
        .filter(Boolean);
    });

    compiler.hooks.afterResolvers.tap(PLUGIN_NAME, () => {
      // Install loaders on demand
      compiler.resolverFactory.hooks.resolver
        .for("loader")
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.rawModule.tapPromise(
            PLUGIN_NAME,
            (result, resolveContext) => {
              if (this.state.has(result.request)) {
                return Promise.resolve();
              }

              return this.resolveRequest(result, resolveContext);
            }
          );
        });

      compiler.resolverFactory.hooks.resolver
        .for("normal")
        .tap(PLUGIN_NAME, (resolver) => {
          resolver.hooks.rawModule.tapPromise(
            {
              name: PLUGIN_NAME,
              stage: -10,
            },
            (result, resolveContext) => {
              if (this.state.has(result.request)) {
                return Promise.resolve();
              }

              return this.resolveRequest(result, resolveContext);
            }
          );
        });
    });
  }

  async install(deps) {
    if (!deps) {
      return;
    }

    if (!Array.isArray(deps)) {
      // eslint-disable-next-line
      deps = [deps];
    }

    let args;
    let client;
    let save;

    const { packageManager, prompt } = this.options;

    if (packageManager.type === "yarn") {
      args = ["add"];
      client = "yarn";
      save =
        packageManager.options && packageManager.options.dev ? "--dev" : null;
    } else if (packageManager.type === "pnpm") {
      args = ["add"];
      client = "pnpm";
      save =
        packageManager.options && packageManager.options.dev
          ? "--save-dev"
          : null;
    } else {
      args = ["install"];
      client = "npm";
      save =
        packageManager.options && packageManager.options.dev
          ? "--save-dev"
          : "--save";
    }

    if (prompt) {
      const response = await InstallPlugin.doPrompt({
        message: `[install-webpack-plugin] Would you like to install package(s) "${green(
          deps.join(", ")
        )}"? (That will run "${green(`${client} ${args[0]}`)}") (${yellow(
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

    if (typeof this.packageJSONPath !== "undefined") {
      args.push(save);
    }

    if (packageManager.options.arguments) {
      args = args.concat(packageManager.options.arguments);
    }

    deps.forEach((dep) => {
      this.logger.info(`Installing "${dep}"...`);
    });

    // Ignore input, capture output, show errors
    const spawned = spawn.sync(client, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdout = spawned.stdout.toString();
    const stderr = spawned.stderr.toString();

    if (stdout.length > 0) {
      this.logger.log(stdout.trim());
    }

    if (stderr.length > 0) {
      this.logger.error(stderr.trim());
    }
  }

  // TODO check `resolveContext`
  resolve(resolver, result) {
    return new Promise((resolve, reject) => {
      this.compiler.resolverFactory
        .get(resolver)
        .resolve(result.context, result.path, result.request, {}, (error) => {
          if (error) {
            reject(error);

            return;
          }

          resolve();
        });
    });
  }

  resolveRequest(result, resolveContext) {
    this.state.set(result.request, { status: "resolving" });

    return this.queue.add(async () => {
      try {
        await this.resolve("normal", result, resolveContext);
      } catch (error) {
        this.state.set(result.request, { status: "not-resolved" });
        try {
          await this.install(depFromErr(error));
        } catch (error) {
          this.logger(error);
        }

        this.state.set(result.request, { status: "installed" });
      }

      this.state.set(result.request, { status: "resolved" });
    });
  }
}

module.exports = InstallPlugin;
