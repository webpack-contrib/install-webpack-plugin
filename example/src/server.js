import express from "express";
import webpack from "webpack";

import client from "../webpack.config.client";

const compiler = webpack(client);

export default express()
  .get("/", (req, res) => res.send(`
    <!doctype html>
    <div id="app">
      Waiting on <code>client.js</code> to execute...
    </div>

    <script src="client.js"></script>
  `))
  .use(require("webpack-dev-middleware")(compiler, {
    noInfo: true,
    publicPath: client.output.publicPath,
    quiet: false,
  }))
  .use(require("webpack-hot-middleware")(compiler))
  .listen(3000, (err) => {
    if (err) {
      return console.error(err);
    }

    console.info("Listening on http://localhost:3000/")
  })
;
