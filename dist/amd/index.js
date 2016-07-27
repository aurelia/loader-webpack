define(['exports', './aurelia-loader-webpack'], function (exports, _aureliaLoaderWebpack) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.keys(_aureliaLoaderWebpack).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaLoaderWebpack[key];
      }
    });
  });
});