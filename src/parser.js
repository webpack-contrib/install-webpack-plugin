var babel = require("babel-core");

function parseNode(node) {
  if (!node) {
    return;
  }

  if (node.type === "CallExpression" && node.callee.name === "require") {
    return node.arguments[0].value;
  }

  if (node.type === "ExpressionStatement") {
    return parseNode(node.expression);
  }

  if (node.type === "ImportDeclaration") {
    return node.source.value;
  }

  if (node.type === "VariableDeclaration") {
    return parseNode(node.declarations[0].init);
  }
};

module.exports.parse = function parse(source) {
  var result = babel.transform(source);
  var dependencies = result.ast.program.body.map(parseNode).filter(Boolean);

  return dependencies;
};
