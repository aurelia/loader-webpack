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

  _import(moduleId) {
    const moduleIdParts = moduleId.split('!');
    const path = moduleIdParts.splice(moduleIdParts.length - 1, 1)[0];
    const loaderPlugin = moduleIdParts.length === 1 ? moduleIdParts[0] : null;

    return new Promise((resolve, reject) => {
      try {
        if (loaderPlugin) {
          resolve(this.loaderPlugins[loaderPlugin].fetch(path));
        } else {
          try {
            const result = __webpack_require__(path);
            resolve(result);
            return;
          } catch (_) {}
          require.ensure([], function (require) {
            const result = require('aurelia-loader-context/' + path);
            if (typeof result === 'function') {
              result(res => resolve(res));
            } else {
              resolve(result);
            }
          }, 'app');
        }
      } catch (e) {
        reject(e);
      }
    });
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