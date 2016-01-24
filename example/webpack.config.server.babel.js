import ReloadServerPlugin from "reload-server-webpack-plugin";
import path from "path";

import { defaults } from "./webpack.config.babel";

export default {
  ...defaults,

  entry: {
    server: "./src/server.js",
  },

  externals: [
    ...defaults.externals,
    // Every non-relative module is external
    /^[a-z\-0-9]+$/,
  ],

  output: {
    ...defaults.output,
    libraryTarget: "commonjs2",
    path: path.join(defaults.context, "build/server"),
  },

  plugins: [
    ...defaults.plugins,
    new ReloadServerPlugin({ script: "./build/server/server.js" }),
  ],

  target: "node",
}
