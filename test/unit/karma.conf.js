'use strict';

const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');

const baseConfig = require('../../.electron-vue/webpack.renderer.config');

// Set BABEL_ENV to use proper preset config
process.env.BABEL_ENV = 'test';

let webpackConfig = merge(baseConfig, {
  mode: 'development',
  devtool: '#inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"testing"'
    })
  ]
});

// don't treat dependencies as externals
delete webpackConfig.entry;
delete webpackConfig.externals;
delete webpackConfig.output.libraryTarget;


// apply vue option to apply isparta-loader on js
webpackConfig.module.rules
  .find(rule => rule.use.loader === 'vue-loader').use.options.loaders.js = 'babel-loader';

module.exports = config => {
  config.set({
    browsers: ['customElectron'],
    client: {
      useIframe: false,
      loadScriptsViaRequire: true,
    },
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    },
    customLaunchers: {
      customElectron: {
        base: 'Electron',
        browserWindowOptions: {
          show: false,
          webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
          }
        }
      }
    },
    frameworks: ['mocha', 'chai'],
    files: ['./index.js'],
    preprocessors: {
      './index.js': ['webpack', 'sourcemap'],
      // 'src/renderer/**/*.js': ['coverage'], // disable coverage report as it always return the same values
    },
    reporters: [
      'progress',
      // 'coverage', // disable coverage report as it always return the same values
    ],
    singleRun: true,
    webpack: webpackConfig,
    webpackMiddleware: {
      noInfo: true
    }
  })
};
