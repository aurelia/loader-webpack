var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "aurelia-metadata", "aurelia-loader", "aurelia-pal"], function (require, exports, aurelia_metadata_1, aurelia_loader_1, aurelia_pal_1) {
    "use strict";
    /**
    * An implementation of the TemplateLoader interface implemented with text-based loading.
    */
    var TextTemplateLoader = (function () {
        function TextTemplateLoader() {
        }
        /**
        * Loads a template.
        * @param loader The loader that is requesting the template load.
        * @param entry The TemplateRegistryEntry to load and populate with a template.
        * @return A promise which resolves when the TemplateRegistryEntry is loaded with a template.
        */
        TextTemplateLoader.prototype.loadTemplate = function (loader, entry) {
            return loader.loadText(entry.address).then(function (text) {
                entry.template = aurelia_pal_1.DOM.createTemplateFromMarkup(text);
            });
        };
        return TextTemplateLoader;
    }());
    exports.TextTemplateLoader = TextTemplateLoader;
    function ensureOriginOnExports(executed, moduleId) {
        var target = executed;
        var key;
        var exportedValue;
        if (target.__useDefault) {
            target = target.default;
        }
        aurelia_metadata_1.Origin.set(target, new aurelia_metadata_1.Origin(moduleId, 'default'));
        if (typeof target === 'object') {
            for (key in target) {
                exportedValue = target[key];
                if (typeof exportedValue === 'function') {
                    aurelia_metadata_1.Origin.set(exportedValue, new aurelia_metadata_1.Origin(moduleId, key));
                }
            }
        }
        return executed;
    }
    exports.ensureOriginOnExports = ensureOriginOnExports;
    /**
    * A default implementation of the Loader abstraction which works with webpack (extended common-js style).
    */
    var WebpackLoader = (function (_super) {
        __extends(WebpackLoader, _super);
        function WebpackLoader() {
            var _this = _super.call(this) || this;
            _this.moduleRegistry = Object.create(null);
            _this.loaderPlugins = Object.create(null);
            _this.useTemplateLoader(new TextTemplateLoader());
            _this.modulesBeingLoaded = Object.create(null);
            var that = _this;
            _this.addPlugin('template-registry-entry', {
                'fetch': function (address) {
                    var entry = that.getOrCreateTemplateRegistryEntry(address);
                    return entry.templateIsLoaded ? entry : that.templateLoader.loadTemplate(that, entry).then(function (x) { return entry; });
                }
            });
            aurelia_pal_1.PLATFORM.eachModule = function (callback) {
                var registry = __webpack_require__.c;
                for (var moduleId in registry) {
                    if (typeof moduleId !== 'string') {
                        continue;
                    }
                    var moduleExports = registry[moduleId].exports;
                    if (typeof moduleExports !== 'object') {
                        continue;
                    }
                    try {
                        if (callback(moduleId, moduleExports))
                            return;
                    }
                    catch (e) { }
                }
            };
            return _this;
        }
        WebpackLoader.prototype._getActualResult = function (result, resolve, reject) {
            try {
                var isAsync = typeof result === 'function' && /cb\(__webpack_require__/.test(result.toString());
                if (!isAsync) {
                    return resolve(result);
                }
                // because of async loading when the bundle loader is active
                return result(function (actual) { return resolve(actual); });
            }
            catch (e) {
                reject(e);
            }
        };
        WebpackLoader.prototype._import = function (moduleId) {
            var _this = this;
            if (this.modulesBeingLoaded[moduleId]) {
                return this.modulesBeingLoaded[moduleId];
            }
            var moduleIdParts = moduleId.split('!');
            var path = moduleIdParts.splice(moduleIdParts.length - 1, 1)[0];
            var loaderPlugin = moduleIdParts.length === 1 ? moduleIdParts[0] : null;
            var action = new Promise(function (resolve, reject) {
                if (loaderPlugin) {
                    try {
                        return resolve(_this.loaderPlugins[loaderPlugin].fetch(path));
                    }
                    catch (e) {
                        return reject(e);
                    }
                }
                else {
                    try {
                        // first try native webpack method
                        var result = __webpack_require__(path);
                        return _this._getActualResult(result, resolve, reject);
                    }
                    catch (_) {
                        // delete the cache
                        delete __webpack_require__.c[path];
                    }
                    require.ensure([], function (require) {
                        // if failed, try resolving via the context created by the plugin
                        var result = require('aurelia-loader-context/' + path);
                        return _this._getActualResult(result, resolve, reject);
                    }, 'app');
                }
            }).then(function (result) {
                _this.modulesBeingLoaded[moduleId] = undefined;
                return result;
            });
            this.modulesBeingLoaded[moduleId] = action;
            return action;
        };
        /**
        * Maps a module id to a source.
        * @param id The module id.
        * @param source The source to map the module to.
        */
        WebpackLoader.prototype.map = function (id, source) { };
        /**
        * Normalizes a module id.
        * @param moduleId The module id to normalize.
        * @param relativeTo What the module id should be normalized relative to.
        * @return The normalized module id.
        */
        WebpackLoader.prototype.normalizeSync = function (moduleId, relativeTo) {
            return moduleId;
        };
        /**
        * Normalizes a module id.
        * @param moduleId The module id to normalize.
        * @param relativeTo What the module id should be normalized relative to.
        * @return The normalized module id.
        */
        WebpackLoader.prototype.normalize = function (moduleId, relativeTo) {
            return Promise.resolve(moduleId);
        };
        /**
        * Instructs the loader to use a specific TemplateLoader instance for loading templates
        * @param templateLoader The instance of TemplateLoader to use for loading templates.
        */
        WebpackLoader.prototype.useTemplateLoader = function (templateLoader) {
            this.templateLoader = templateLoader;
        };
        /**
        * Loads a collection of modules.
        * @param ids The set of module ids to load.
        * @return A Promise for an array of loaded modules.
        */
        WebpackLoader.prototype.loadAllModules = function (ids) {
            var loads = [];
            for (var i = 0, ii = ids.length; i < ii; ++i) {
                loads.push(this.loadModule(ids[i]));
            }
            return Promise.all(loads);
        };
        /**
        * Loads a module.
        * @param id The module id to normalize.
        * @return A Promise for the loaded module.
        */
        WebpackLoader.prototype.loadModule = function (id) {
            var _this = this;
            var existing = this.moduleRegistry[id];
            if (existing) {
                return Promise.resolve(existing);
            }
            return this._import(id).then(function (m) { return _this.moduleRegistry[id] = ensureOriginOnExports(m, id); });
        };
        /**
        * Loads a template.
        * @param url The url of the template to load.
        * @return A Promise for a TemplateRegistryEntry containing the template.
        */
        WebpackLoader.prototype.loadTemplate = function (url) {
            return this._import(this.applyPluginToUrl(url, 'template-registry-entry'));
        };
        /**
        * Loads a text-based resource.
        * @param url The url of the text file to load.
        * @return A Promise for text content.
        */
        WebpackLoader.prototype.loadText = function (url) {
            return this._import(url).then(function (result) {
                if (result instanceof Array && result[0] instanceof Array && result.hasOwnProperty('toString')) {
                    // we're dealing with a file loaded using the css-loader:
                    return result.toString();
                }
                return result;
            });
        };
        /**
        * Alters a module id so that it includes a plugin loader.
        * @param url The url of the module to load.
        * @param pluginName The plugin to apply to the module id.
        * @return The plugin-based module id.
        */
        WebpackLoader.prototype.applyPluginToUrl = function (url, pluginName) {
            return pluginName + "!" + url;
        };
        /**
        * Registers a plugin with the loader.
        * @param pluginName The name of the plugin.
        * @param implementation The plugin implementation.
        */
        WebpackLoader.prototype.addPlugin = function (pluginName, implementation) {
            this.loaderPlugins[pluginName] = implementation;
        };
        return WebpackLoader;
    }(aurelia_loader_1.Loader));
    exports.WebpackLoader = WebpackLoader;
    aurelia_pal_1.PLATFORM.Loader = WebpackLoader;
});
