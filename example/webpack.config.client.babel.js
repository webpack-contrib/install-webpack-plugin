import path from "path";
import webpack from "webpack";

import { defaults } from "./webpack.config.babel";

export default {
  ...defaults,

  entry: {
    client: [
      "webpack-hot-middleware/client?reload=true",
      "./src/client.js",
    ],
  },

  output: {
    ...defaults.output,
    libaryTarget: "var",
    path: path.join(defaults.context, "build/client"),
    publicPath: "/",
  },

  plugins: [
    ...defaults.plugins,
    new webpack.HotModuleReplacementPlugin(),
  ],

  target: "web",
}
