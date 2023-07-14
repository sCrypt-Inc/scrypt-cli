const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  resolve: {
    fallback: {
      fs: false,
      os: false,
      path: false,
      module: false,
      repl: false,
    },
  },
  plugins: [
    new NodePolyfillPlugin()
  ]
}
