// Found in /lib via webpack's resolve.root
import App from "App";

// Testing inline-loaders
import loadRender from "bundle-loader?lazy!./render";

loadRender(({ render }) => render(App));
