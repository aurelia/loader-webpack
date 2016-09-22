import { Origin } from 'aurelia-metadata';
import { Loader } from 'aurelia-loader';
import { DOM, PLATFORM } from 'aurelia-pal';

export let TextTemplateLoader = class TextTemplateLoader {
  loadTemplate(loader, entry) {
    return loader.loadText(entry.address).then(text => {
      entry.template = DOM.createTemplateFromMarkup(text);
    });
  }
};

export function ensureOriginOnExports(executed, moduleId) {
  let target = executed;
  let key;
  let exportedValue;

  if (target.__useDefault) {
    target = target.default;
  }

  Origin.set(target, new Origin(moduleId, 'default'));

  if (typeof target === 'object') {
    for (key in target) {
      exportedValue = target[key];

      if (typeof exportedValue === 'function') {
        Origin.set(exportedValue, new Origin(moduleId, key));
      }
    }
  }

  return executed;
}

export let WebpackLoader = class WebpackLoader extends Loader {
  constructor() {
    super();

    this.moduleRegistry = Object.create(null);
    this.loaderPlugins = Object.create(null);
    this.useTemplateLoader(new TextTemplateLoader());
    this.modulesBeingLoaded = Object.create(null);

    let that = this;

    this.addPlugin('template-registry-entry', {
      'fetch': function (address) {
        let entry = that.getOrCreateTemplateRegistryEntry(address);
        return entry.templateIsLoaded ? entry : that.templateLoader.loadTemplate(that, entry).then(x => entry);
      }
    });

    PLATFORM.eachModule = callback => {
      let registry = __webpack_require__.c;

      for (let moduleId in registry) {
        if (typeof moduleId !== 'string') {
          continue;
        }
        let moduleExports = registry[moduleId].exports;
        if (typeof moduleExports !== 'object') {
          continue;
        }
        try {
          if (callback(moduleId, moduleExports)) return;
        } catch (e) {}
      }
    };
  }

  _getActualResult(result, resolve, reject) {
    try {
      const isAsync = typeof result === 'function' && /cb\(__webpack_require__/.test(result.toString());
      if (!isAsync) {
        return resolve(result);
      }

      return result(actual => resolve(actual));
    } catch (e) {
      reject(e);
    }
  }

  _import(moduleId) {
    if (this.modulesBeingLoaded[moduleId]) {
      return this.modulesBeingLoaded[moduleId];
    }
    const moduleIdParts = moduleId.split('!');
    const path = moduleIdParts.splice(moduleIdParts.length - 1, 1)[0];
    const loaderPlugin = moduleIdParts.length === 1 ? moduleIdParts[0] : null;

    const action = new Promise((resolve, reject) => {
      if (loaderPlugin) {
        try {
          return resolve(this.loaderPlugins[loaderPlugin].fetch(path));
        } catch (e) {
          return reject(e);
        }
      } else {
        try {
          const result = __webpack_require__(path);
          return this._getActualResult(result, resolve, reject);
        } catch (_) {
          delete __webpack_require__.c[path];
        }
        require.ensure([], require => {
          const result = require('aurelia-loader-context/' + path);
          return this._getActualResult(result, resolve, reject);
        }, 'app');
      }
    }).then(result => {
      this.modulesBeingLoaded[moduleId] = undefined;
      return result;
    });
    this.modulesBeingLoaded[moduleId] = action;
    return action;
  }

  map(id, source) {}

  normalizeSync(moduleId, relativeTo) {
    return moduleId;
  }

  normalize(moduleId, relativeTo) {
    return Promise.resolve(moduleId);
  }

  useTemplateLoader(templateLoader) {
    this.templateLoader = templateLoader;
  }

  loadAllModules(ids) {
    let loads = [];

    for (let i = 0, ii = ids.length; i < ii; ++i) {
      loads.push(this.loadModule(ids[i]));
    }

    return Promise.all(loads);
  }

  loadModule(id) {
    let existing = this.moduleRegistry[id];
    if (existing) {
      return Promise.resolve(existing);
    }
    return this._import(id).then(m => this.moduleRegistry[id] = ensureOriginOnExports(m, id));
  }

  loadTemplate(url) {
    return this._import(this.applyPluginToUrl(url, 'template-registry-entry'));
  }

  loadText(url) {
    return this._import(url).then(result => {
      if (result instanceof Array && result[0] instanceof Array && result.hasOwnProperty('toString')) {
        return result.toString();
      }

      return result;
    });
  }

  applyPluginToUrl(url, pluginName) {
    return `${ pluginName }!${ url }`;
  }

  addPlugin(pluginName, implementation) {
    this.loaderPlugins[pluginName] = implementation;
  }
};

PLATFORM.Loader = WebpackLoader;