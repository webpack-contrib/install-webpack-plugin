var installer = require("./installer");

function NpmInstallPlugin(options) {
  this.options = options || {};
}

NpmInstallPlugin.prototype.apply = function(compiler) {
  var cli = this.options.cli;

  compiler.plugin("normal-module-factory", function(factory) {
    console.log("normal-module-factory");

    factory.plugin("before-resolve", function(result, callback) {
      var context = result.context;
      var request = result.request;

      factory.resolvers.normal.resolve(context, request, function(err, filepath) {
        if (filepath) {
          return callback(null, result);
        }

        var missing = installer.check([request], []);

        // Found in `require` paths
        if (!missing.length) {
          return callback(null, result);
        }

        console.log("Missing dependency", result, missing);

        installer.install(missing, cli);

        return callback(null, result);
      });
    });
  });
};

module.exports = NpmInstallPlugin;
