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

function ensureOriginOnExports(executed, name) {
  let target = executed;
  let key;
  let exportedValue;

  if (target.__useDefault) {
    target = target.default;
  }

  Origin.set(target, new Origin(name, 'default'));

  for (key in target) {
    exportedValue = target[key];

    if (typeof exportedValue === 'function') {
      Origin.set(exportedValue, new Origin(name, key));
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
      let registry = this.moduleRegistry;

      for (let key in registry) {
        try {
          if (callback(key, registry[key])) return;
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
          require.ensure([], function (require) {
            const result = require('aurelia-loader-context/' + path);
            if (typeof result === 'function') {
              result(res => resolve(res));
            } else {
              resolve(result);
            }
          });
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

    return new Promise((resolve, reject) => {
      try {
        this._import(id).then(m => {
          this.moduleRegistry[id] = m;
          resolve(ensureOriginOnExports(m, id));
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  loadTemplate(url) {
    return this._import(this.applyPluginToUrl(url, 'template-registry-entry'));
  }

  loadText(url) {
    return this._import(url);
  }

  applyPluginToUrl(url, pluginName) {
    return `${ pluginName }!${ url }`;
  }

  addPlugin(pluginName, implementation) {
    this.loaderPlugins[pluginName] = implementation;
  }
};

PLATFORM.Loader = WebpackLoader;