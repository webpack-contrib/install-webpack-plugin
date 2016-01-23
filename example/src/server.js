// import express from "express";
// import webpack from "webpack";
//
// import client from "../webpack.config.client.babel";
//
// const app = express();
// const compiler = webpack(client);
//
// app
//   .use(express.static("build/client"))
//   .use(express.static("src/public"))
//   .use(require("webpack-dev-middleware")(compiler, {
//     noInfo: true,
//     publicPath: client.output.publicPath,
//     quiet: false,
//   }))
//   .use(require("webpack-hot-middleware")(compiler, { reload: true }))
//   .listen(3000, (err) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//
//     console.log("Listening on http://localhost:3000/");
//   })
// ;
