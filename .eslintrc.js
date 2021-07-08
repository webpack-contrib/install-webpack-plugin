module.exports = {
  root: true,
  extends: ["@webpack-contrib/eslint-config-webpack", "prettier"],
  overrides: [
    {
      files: ["**/*.js"],
      rules: {
        "global-require": "off",
      },
    },
  ],
};
