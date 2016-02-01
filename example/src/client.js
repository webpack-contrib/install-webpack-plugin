import React from "react";
import DOM from "react-dom";

// Found in /lib via webpack's resolve.root
import App from "App";

DOM.render(<App />, document.getElementById("app"));
