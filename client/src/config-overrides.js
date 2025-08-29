const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    fs: false // fs is generally not available in browsers
  };
  return config;
};