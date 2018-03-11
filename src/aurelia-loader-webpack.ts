import {Origin} from 'aurelia-metadata';
import {Loader, TemplateRegistryEntry, LoaderPlugin} from 'aurelia-loader';
import {DOM, PLATFORM} from 'aurelia-pal';

export type LoaderPlugin = { fetch: (address: string) => Promise<TemplateRegistryEntry> | TemplateRegistryEntry };

/**
* An implementation of the TemplateLoader interface implemented with text-based loading.
*/
export class TextTemplateLoader {
  /**
  * Loads a template.
  * @param loader The loader that is requesting the template load.
  * @param entry The TemplateRegistryEntry to load and populate with a template.
  * @return A promise which resolves when the TemplateRegistryEntry is loaded with a template.
  */
  async loadTemplate(loader: Loader, entry: TemplateRegistryEntry) {
    const text = await loader.loadText(entry.address);
    entry.template = DOM.createTemplateFromMarkup(text);
  }
}

export function ensureOriginOnExports(moduleExports: any, moduleId: string) {
  let target = moduleExports;
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

  return moduleExports;
}

/**
* A default implementation of the Loader abstraction which works with webpack (extended common-js style).
*/
export class WebpackLoader extends Loader {
  moduleRegistry = Object.create(null);
  loaderPlugins = Object.create(null) as { [name: string]: LoaderPlugin & { hot?: (moduleId: string) => void } };
  modulesBeingLoaded = new Map<string, Promise<any>>();
  templateLoader: TextTemplateLoader;
  hmrContext: { 
    handleModuleChange(moduleId: string, hot: Webpack.WebpackHotModule): Promise<void>,
    handleViewChange(moduleId: string): Promise<void>
  };

  constructor() {
    super();

    this.useTemplateLoader(new TextTemplateLoader());

    this.addPlugin('template-registry-entry', {
      fetch: async (moduleId: string) => {
        // HMR:
        if (module.hot) {
          if (!this.hmrContext) {
            // Note: Please do NOT import aurelia-hot-module-reload statically at the top of file.
            //       We don't want to bundle it when not using --hot, in particular in production builds.
            //       Webpack will evaluate the `if (module.hot)` above at build time 
            //       and will include (or not) aurelia-hot-module-reload accordingly.
            const { HmrContext } = require('aurelia-hot-module-reload');
            this.hmrContext = new HmrContext(this as any);
          }
          module.hot.accept(moduleId, async () => {
            await this.hmrContext.handleViewChange(moduleId);
          });
        }

        const entry = this.getOrCreateTemplateRegistryEntry(moduleId);
        if (!entry.templateIsLoaded) {
          await this.templateLoader.loadTemplate(this, entry);
        }
        return entry;
      }
    } as LoaderPlugin);

    PLATFORM.eachModule = callback => {
      const registry = __webpack_require__.c;
      const cachedModuleIds = Object.getOwnPropertyNames(registry);
      cachedModuleIds
        // Note: we use .some here like a .forEach that can be "break"ed out of.
        // It will stop iterating only when a truthy value is returned.
        // Even though the docs say "true" explicitly, loader-default also goes by truthy
        // and this is to keep it consistent with that.
        .some(moduleId => {
          const moduleExports = registry[moduleId].exports;
          if (typeof moduleExports === 'object') {
            return callback(moduleId, moduleExports);
          }
          return false;
        });
    };
  }

  async _import(address: string, defaultHMR = true) {
    const addressParts = address.split('!');
    const moduleId = addressParts.splice(addressParts.length - 1, 1)[0];
    const loaderPlugin = addressParts.length === 1 ? addressParts[0] : null;

    if (loaderPlugin) {
      const plugin = this.loaderPlugins[loaderPlugin];
      if (!plugin) {
        throw new Error(`Plugin ${loaderPlugin} is not registered in the loader.`);
      }
      if (module.hot && plugin.hot) {
        module.hot.accept(moduleId, () => plugin.hot!(moduleId));
      }
      return await plugin.fetch(moduleId);
    }

    if (__webpack_require__.m[moduleId]) {
      if (defaultHMR && module.hot && this.hmrContext) {
        module.hot.accept(moduleId, () => this.hmrContext.handleModuleChange(moduleId, module.hot));
      }
      return __webpack_require__(moduleId);
    }

    const asyncModuleId = `async!${moduleId}`;

    if (__webpack_require__.m[asyncModuleId]) {
      if (defaultHMR && module.hot && this.hmrContext) {
        module.hot.accept(moduleId, () => this.hmrContext.handleModuleChange(moduleId, module.hot));
        module.hot.accept(asyncModuleId, () => this.hmrContext.handleModuleChange(moduleId, module.hot));
      }
      const callback = __webpack_require__(asyncModuleId) as (callback: (moduleExports: any) => void) => void;
      return await new Promise(callback);
    }

    throw new Error(`Unable to find module with ID: ${moduleId}`);
  }

  /**
  * Maps a module id to a source.
  * @param id The module id.
  * @param source The source to map the module to.
  */
  map(id: string, source: any) {}

  /**
  * Normalizes a module id.
  * @param moduleId The module id to normalize.
  * @param relativeTo What the module id should be normalized relative to.
  * @return The normalized module id.
  */
  normalizeSync(moduleId: string, relativeTo: string) {
    return moduleId;
  }

  /**
  * Normalizes a module id.
  * @param moduleId The module id to normalize.
  * @param relativeTo What the module id should be normalized relative to.
  * @return The normalized module id.
  */
  normalize(moduleId: string, relativeTo: string) {
    return Promise.resolve(moduleId);
  }

  /**
  * Instructs the loader to use a specific TemplateLoader instance for loading templates
  * @param templateLoader The instance of TemplateLoader to use for loading templates.
  */
  useTemplateLoader(templateLoader: TextTemplateLoader) {
    this.templateLoader = templateLoader;
  }

  /**
  * Loads a collection of modules.
  * @param ids The set of module ids to load.
  * @return A Promise for an array of loaded modules.
  */
  loadAllModules(ids: Array<string>) {
    return Promise.all(
      ids.map(id => this.loadModule(id))
    );
  }

  /**
  * Loads a module.
  * @param moduleId The module ID to load.
  * @return A Promise for the loaded module.
  */
  async loadModule(moduleId: string, defaultHMR = true) {
    let existing = this.moduleRegistry[moduleId];
    if (existing) {
      return existing;
    }
    let beingLoaded = this.modulesBeingLoaded.get(moduleId);
    if (beingLoaded) {
      return beingLoaded;
    }
    beingLoaded = this._import(moduleId, defaultHMR);
    this.modulesBeingLoaded.set(moduleId, beingLoaded);
    const moduleExports = await beingLoaded;
    this.moduleRegistry[moduleId] = ensureOriginOnExports(moduleExports, moduleId);
    this.modulesBeingLoaded.delete(moduleId);
    return moduleExports;
  }

  /**
  * Loads a template.
  * @param url The url of the template to load.
  * @return A Promise for a TemplateRegistryEntry containing the template.
  */
  loadTemplate(url: string) {
    return this.loadModule(this.applyPluginToUrl(url, 'template-registry-entry'), false);
  }

  /**
  * Loads a text-based resource.
  * @param url The url of the text file to load.
  * @return A Promise for text content.
  */
  async loadText(url: string) {
    const result = await this.loadModule(url, false);
    if (result instanceof Array && result[0] instanceof Array && result.hasOwnProperty('toString')) {
      // we're dealing with a file loaded using the css-loader:
      return result.toString();
    }
    return result;
  }

  /**
  * Alters a module id so that it includes a plugin loader.
  * @param url The url of the module to load.
  * @param pluginName The plugin to apply to the module id.
  * @return The plugin-based module id.
  */
  applyPluginToUrl(url: string, pluginName: string) {
    return `${pluginName}!${url}`;
  }

  /**
  * Registers a plugin with the loader.
  * @param pluginName The name of the plugin.
  * @param implementation The plugin implementation.
  */
  addPlugin(pluginName: string, implementation: LoaderPlugin) {
    this.loaderPlugins[pluginName] = implementation;
  }
}

(PLATFORM as any).Loader = WebpackLoader;
