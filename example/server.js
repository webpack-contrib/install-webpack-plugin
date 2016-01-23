/**
 * Uncomment things line-by-line & watch the loader go!
 */

//  /**
//   * (1) Let's install express & start a server
//   */
//
// var express = require("express");
// var app = express();
//
// app
//   .use(express.static("build/client"))
//   .use(express.static("public"))
//   .listen(3000, function(err) {
//     if (err) {
//       console.error(err);
//       return;
//     }
//
//     console.log("Listening on http://localhost:3000/");
//   })
// ;


// /**
//  * (2) Next, let's bring in a local dependency (which won't install anything)
//  */
//
// var config = require("./webpack.config.client");


// /**
//  * (3) Also, let's bring in an existing dependency (which won't install anything)
//  */
//
// var webpack = require("webpack")
// var compiler = webpack(config);


// /**
//  * (4) Add webpack-dev-middleware
//  */
//
// app.use(require("webpack-dev-middleware")(compiler, {
//   noInfo: true,
//   publicPath: config.output.publicPath,
//   quiet: false,
// }));


// /**
//  * (5) Add webpack-hot-middleware
//  */
//
// app.use(require("webpack-hot-middleware")(compiler, { reload: true }));
//
// /**
//  * (6) Now go open <http://localhost:3000/> and see if it works!
//  */
