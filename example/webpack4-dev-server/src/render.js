// Aliased via webpack's resolve.alias
import React from "react";
import DOM from "react-dom";

export const render = (Component) => {
  DOM.render(<Component />, document.getElementById("app"));
}
