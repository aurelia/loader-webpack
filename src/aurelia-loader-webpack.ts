import { Loader, LoaderPlugin as AureliaLoaderPlugin, TemplateRegistryEntry } from 'aurelia-loader';
import { Origin } from 'aurelia-metadata';
import { DOM, PLATFORM } from 'aurelia-pal';

/** @internal */
declare global {
  const __webpack_require__: import('./webpack-runtime').__webpack_require__;
  interface NodeModule {
    hot: WebpackHotModule;
  }
}

type CssLoaderModuleItem = [
  srcModule: string,
  cssContent: string,
  mediaAtRule?: string,
  sourceMap?: {
    version: number;
    names: string[];
    sourceRoot: string;
    sources: string[];
    sourcesContent: string[];
    mappings: string;
  },
  supportsAtRule?: string,
  layerAtRule?: string,
];

type CssLoaderModule = CssLoaderModuleItem[] & {
  toString(): string;
  i: Function;
}

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
  loaderPlugins = Object.create(null) as { [name: string]: AureliaLoaderPlugin & { hot?: (moduleId: string) => void } };
  modulesBeingLoaded = new Map<string, Promise<any>>();
  templateLoader: TextTemplateLoader;
  hmrContext: {
    handleModuleChange(moduleId: string, hot: WebpackHotModule): Promise<void>,
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
    } as AureliaLoaderPlugin);

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

  async _import(address: string, defaultHMR = true): Promise<any> {
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
    // css-loader could use esModule:true
    const defaultExport = result && result.__esModule ? result.default : result;
    if (this.isCssLoaderModule(defaultExport)) {
      // we're dealing with a file loaded using the css-loader:
      return this.getCssText(defaultExport);
    }
    return typeof result === "string" ? result : defaultExport;
  }

  /**
   * Check if a loaded module is a css-loader module
   * @param o The loaded module
   * @returns `true` when {@link o} is a {@link CssLoaderModule}; otherwise false
   */
  private isCssLoaderModule(o: any): o is CssLoaderModule {
    return o instanceof Array && o[0] instanceof Array && o.hasOwnProperty('toString');
  }

  /**
   * Get CSS text from loaded css-loader module
   * @param cssLoaderModule The {@link CssLoaderModule}
   * @returns The css content with potential source map references
   */
  private getCssText(cssLoaderModule: CssLoaderModule): string {
    let result = cssLoaderModule.toString();

    // If some css-loader modules include source maps,
    // ensure /*# sourceURL=[...] */ is removed to avoid chrome devtools problems
    if (cssLoaderModule.some(m => m[3])) {
      result = result.replace(/^\/\*# sourceURL=.* \*\/\s*\n/gm, "");
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
  addPlugin(pluginName: string, implementation: AureliaLoaderPlugin) {
    this.loaderPlugins[pluginName] = implementation;
  }
}

(PLATFORM as any).Loader = WebpackLoader;

export type HotModuleStatus = 'idle' | 'check' | 'watch' | 'watch-delay' | 'prepare' | 'ready' | 'dispose' | 'apply' | 'abort' | 'fail';
export interface WebpackHotModule {
  /**
   * Accept code updates for the specified dependencies. The callback is called when dependencies were replaced.
   */
  accept(dependencies: string[], callback: (updatedDependencies: Array<string>) => void): void;
  /**
   * Accept code updates for the specified dependencies. The callback is called when dependencies were replaced.
   */
  accept(dependency: string, callback: () => void): void;
  /**
   * Accept code updates for this module without notification of parents. This should only be used if the module doesn’t export anything. The errHandler can be used to handle errors that occur while loading the updated module.
   */
  accept(errHandler?: (e: Error) => void): void;

  /**
   * Do not accept updates for the specified dependencies. If any dependencies is updated, the code update fails with code "decline".
   */
  decline(dependencies: string[]): void;
  /**
   * Do not accept updates for the specified dependencies. If any dependencies is updated, the code update fails with code "decline".
   */
  decline(dependency: string): void;
  /**
   * Flag the current module as not update-able. If updated the update code would fail with code "decline".
   */
  decline(): void;

  /**
   * Add a one time handler, which is executed when the current module code is replaced. Here you should destroy/remove any persistent resource you have claimed/created. If you want to transfer state to the new module, add it to data object. The data will be available at module.hot.data on the new module.
   */
  dispose(callback: (data: any) => void): void;
  /**
   * Add a one time handler, which is executed when the current module code is replaced. Here you should destroy/remove any persistent resource you have claimed/created. If you want to transfer state to the new module, add it to data object. The data will be available at module.hot.data on the new module.
   */
  addDisposeHandler(callback: (data: any) => void): void;

  /**
   * Remove a dispose handler.
   * This can useful to add a temporary dispose handler. You could i. e. replace code while in the middle of a multi-step async function.
   */
  removeDisposeHandler(callback: (data: any) => void): void;

  /**
   * Throws an exceptions if status() is not idle.
   * Check all currently loaded modules for updates and apply updates if found.
   * If no update was found, the callback is called with null.
   * If autoApply is truthy the callback will be called with all modules that were disposed. apply() is automatically called with autoApply as options parameter.
   * If autoApply is not set the callback will be called with all modules that will be disposed on apply().
   */
  check(autoApply: boolean, callback: (err: Error, outdatedModules: any[]) => void): void;
  /**
   * Throws an exceptions if status() is not idle.
   * Check all currently loaded modules for updates and apply updates if found.
   * If no update was found, the callback is called with null.
   * If autoApply is not set the callback will be called with all modules that will be disposed on apply().
   */
  check(callback: (err: Error, outdatedModules: NodeModule[]) => void): void;

  /**
   * Continue the update process.
   * If status() != "ready" it throws an error.
   */
  apply(options: HotOptions, callback: (err: Error, outdatedModules: any[]) => void): void;
  apply(callback: (err: Error, outdatedModules: any[]) => void): void;

  /**
   * Return one of idle, check, watch, watch-delay, prepare, ready, dispose, apply, abort or fail.
   *
   * - `idle`
   * The HMR is waiting for your call the check(). When you call it the status will change to check.
   *
   * - `check`
   * The HMR is checking for updates. If it doesn’t find updates it will change back to idle. If updates were found it will go through the steps prepare, dispose and apply. Than back to idle.
   *
   * - `watch`
   * The HMR is in watch mode and will automatically be notified about changes. After the first change it will change to watch-delay and wait for a specified time to start the update process. Any change will reset the timeout, to accumulate more changes. When the update process is started it will go through the steps prepare, dispose and apply. Than back to watch or watch-delay if changes were detected while updating.
   *
   * - `prepare`
   * The HMR is prepare stuff for the update. This may means that it’s downloading something.
   *
   * - `ready`
   * An update is available and prepared. Call apply() to continue.
   *
   * - `dispose`
   * The HMR is calling the dispose handlers of modules that will be replaced.
   *
   * - `apply`
   * The HMR is calling the accept handlers of the parents of replaced modules, than it requires the self accepted modules.
   *
   * - `abort`
   * A update cannot apply, but the system is still in a (old) consistent state.
   *
   * - `fail`
   * A update has thrown an exception in the middle of the process, and the system is (maybe) in a inconsistent state. The system should be restarted.
   */
  status(): HotModuleStatus;

  /**
   * Register a callback on status change.
   */
  status(callback: (status: HotModuleStatus) => void): void;
  /**
   * Register a callback on status change.
   */
  addStatusHandler(callback: (status: HotModuleStatus) => void): void;

  /**
   * Data from the previous version of this module, if set and disposed using the dispose() handler.
   */
  data?: any;
}

export interface HotOptions {
  /**
   * If true the update process continues even if some modules are not accepted (and would bubble to the entry point).
   */
  ignoreUnaccepted?: boolean;
}
