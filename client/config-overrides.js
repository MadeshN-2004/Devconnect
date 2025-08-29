const webpack = require('webpack');

module.exports = function override(config) {
  // Webpack 5 fallback configuration
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "path": require.resolve("path-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "querystring": require.resolve("querystring-es3"),
    "vm": require.resolve("vm-browserify"),
    "assert": require.resolve("assert/"),
    "async_hooks": false,
    "fs": false,
    "os": false,
    "tls": false,
    "net": false,
    "process": require.resolve("process/browser")
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ];

  // Fix for axios process/browser error
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser')
  };

  return config;
};