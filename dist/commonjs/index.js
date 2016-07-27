'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _aureliaLoaderWebpack = require('./aurelia-loader-webpack');

Object.keys(_aureliaLoaderWebpack).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaLoaderWebpack[key];
    }
  });
});