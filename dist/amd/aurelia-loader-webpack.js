define(['exports', 'aurelia-metadata', 'aurelia-loader', 'aurelia-pal'], function (exports, _aureliaMetadata, _aureliaLoader, _aureliaPal) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.WebpackLoader = exports.TextTemplateLoader = undefined;
  exports.ensureOriginOnExports = ensureOriginOnExports;

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  

  var TextTemplateLoader = exports.TextTemplateLoader = function () {
    function TextTemplateLoader() {
      
    }

    TextTemplateLoader.prototype.loadTemplate = function loadTemplate(loader, entry) {
      return loader.loadText(entry.address).then(function (text) {
        entry.template = _aureliaPal.DOM.createTemplateFromMarkup(text);
      });
    };

    return TextTemplateLoader;
  }();

  function ensureOriginOnExports(executed, moduleId) {
    var target = executed;
    var key = void 0;
    var exportedValue = void 0;

    if (target.__useDefault) {
      target = target.default;
    }

    _aureliaMetadata.Origin.set(target, new _aureliaMetadata.Origin(moduleId, 'default'));

    if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) === 'object') {
      for (key in target) {
        exportedValue = target[key];

        if (typeof exportedValue === 'function') {
          _aureliaMetadata.Origin.set(exportedValue, new _aureliaMetadata.Origin(moduleId, key));
        }
      }
    }

    return executed;
  }

  var WebpackLoader = exports.WebpackLoader = function (_Loader) {
    _inherits(WebpackLoader, _Loader);

    function WebpackLoader() {
      

      var _this = _possibleConstructorReturn(this, _Loader.call(this));

      _this.moduleRegistry = Object.create(null);
      _this.loaderPlugins = Object.create(null);
      _this.useTemplateLoader(new TextTemplateLoader());
      _this.modulesBeingLoaded = Object.create(null);

      var that = _this;

      _this.addPlugin('template-registry-entry', {
        'fetch': function fetch(address) {
          var entry = that.getOrCreateTemplateRegistryEntry(address);
          return entry.templateIsLoaded ? entry : that.templateLoader.loadTemplate(that, entry).then(function (x) {
            return entry;
          });
        }
      });

      _aureliaPal.PLATFORM.eachModule = function (callback) {
        var registry = __webpack_require__.c;

        for (var moduleId in registry) {
          if (typeof moduleId !== 'string') {
            continue;
          }
          var moduleExports = registry[moduleId].exports;
          if ((typeof moduleExports === 'undefined' ? 'undefined' : _typeof(moduleExports)) !== 'object') {
            continue;
          }
          try {
            if (callback(moduleId, moduleExports)) return;
          } catch (e) {}
        }
      };
      return _this;
    }

    WebpackLoader.prototype._getActualResult = function _getActualResult(result, resolve, reject) {
      try {
        var isAsync = typeof result === 'function' && /cb\(__webpack_require__/.test(result.toString());
        if (!isAsync) {
          return resolve(result);
        }

        return result(function (actual) {
          return resolve(actual);
        });
      } catch (e) {
        reject(e);
      }
    };

    WebpackLoader.prototype._import = function _import(moduleId) {
      var _this2 = this;

      if (this.modulesBeingLoaded[moduleId]) {
        return this.modulesBeingLoaded[moduleId];
      }
      var moduleIdParts = moduleId.split('!');
      var path = moduleIdParts.splice(moduleIdParts.length - 1, 1)[0];
      var loaderPlugin = moduleIdParts.length === 1 ? moduleIdParts[0] : null;

      var action = new Promise(function (resolve, reject) {
        if (loaderPlugin) {
          try {
            return resolve(_this2.loaderPlugins[loaderPlugin].fetch(path));
          } catch (e) {
            return reject(e);
          }
        } else {
          try {
            var result = __webpack_require__(path);
            return _this2._getActualResult(result, resolve, reject);
          } catch (_) {
            delete __webpack_require__.c[path];
          }
          require.ensure([], function (require) {
            var result = require('aurelia-loader-context/' + path);
            return _this2._getActualResult(result, resolve, reject);
          }, 'app');
        }
      }).then(function (result) {
        _this2.modulesBeingLoaded[moduleId] = undefined;
        return result;
      });
      this.modulesBeingLoaded[moduleId] = action;
      return action;
    };

    WebpackLoader.prototype.map = function map(id, source) {};

    WebpackLoader.prototype.normalizeSync = function normalizeSync(moduleId, relativeTo) {
      return moduleId;
    };

    WebpackLoader.prototype.normalize = function normalize(moduleId, relativeTo) {
      return Promise.resolve(moduleId);
    };

    WebpackLoader.prototype.useTemplateLoader = function useTemplateLoader(templateLoader) {
      this.templateLoader = templateLoader;
    };

    WebpackLoader.prototype.loadAllModules = function loadAllModules(ids) {
      var loads = [];

      for (var i = 0, ii = ids.length; i < ii; ++i) {
        loads.push(this.loadModule(ids[i]));
      }

      return Promise.all(loads);
    };

    WebpackLoader.prototype.loadModule = function loadModule(id) {
      var _this3 = this;

      var existing = this.moduleRegistry[id];
      if (existing) {
        return Promise.resolve(existing);
      }
      return this._import(id).then(function (m) {
        return _this3.moduleRegistry[id] = ensureOriginOnExports(m, id);
      });
    };

    WebpackLoader.prototype.loadTemplate = function loadTemplate(url) {
      return this._import(this.applyPluginToUrl(url, 'template-registry-entry'));
    };

    WebpackLoader.prototype.loadText = function loadText(url) {
      return this._import(url).then(function (result) {
        if (result instanceof Array && result[0] instanceof Array && result.hasOwnProperty('toString')) {
          return result.toString();
        }

        return result;
      });
    };

    WebpackLoader.prototype.applyPluginToUrl = function applyPluginToUrl(url, pluginName) {
      return pluginName + '!' + url;
    };

    WebpackLoader.prototype.addPlugin = function addPlugin(pluginName, implementation) {
      this.loaderPlugins[pluginName] = implementation;
    };

    return WebpackLoader;
  }(_aureliaLoader.Loader);

  _aureliaPal.PLATFORM.Loader = WebpackLoader;
});