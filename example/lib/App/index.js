import React from "react";

import "./App.css";

export default class App extends React.Component {
  render() {
    return (
      <div className="container">
        <div className="page-header">
          <h3>
            <code>
              npm-install-webpack-plugin
            </code>
          </h3>
        </div>

        <div className="jumbotron">
          <h1>
            It Works!
          </h1>

          <p>
            Webpack has successfully compiled the application JS &amp; CSS.
          </p>

          <a
            className="btn btn-primary btn-lg"
            href="https://github.com/ericclemmons/npm-install-webpack-plugin"
          >
            View on Github
          </a>
        </div>
      </div>
    );
  }
}
