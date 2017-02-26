import { Loader, TemplateRegistryEntry, LoaderPlugin } from 'aurelia-loader';
export declare type LoaderPlugin = {
    fetch: (address: string) => Promise<TemplateRegistryEntry> | TemplateRegistryEntry;
};
/**
* An implementation of the TemplateLoader interface implemented with text-based loading.
*/
export declare class TextTemplateLoader {
    /**
    * Loads a template.
    * @param loader The loader that is requesting the template load.
    * @param entry The TemplateRegistryEntry to load and populate with a template.
    * @return A promise which resolves when the TemplateRegistryEntry is loaded with a template.
    */
    loadTemplate(loader: Loader, entry: TemplateRegistryEntry): Promise<void>;
}
export declare function ensureOriginOnExports(moduleExports: any, moduleId: string): any;
/**
* A default implementation of the Loader abstraction which works with webpack (extended common-js style).
*/
export declare class WebpackLoader extends Loader {
    moduleRegistry: any;
    loaderPlugins: {
        [name: string]: LoaderPlugin & {
            hot?: ((moduleId: string) => void) | undefined;
        };
    };
    modulesBeingLoaded: Map<string, Promise<any>>;
    templateLoader: TextTemplateLoader;
    hmrContext: {
        handleModuleChange(moduleId: string, hot: Webpack.WebpackHotModule): Promise<void>;
        handleViewChange(moduleId: string): Promise<void>;
    };
    constructor();
    _import(address: string, defaultHMR?: boolean): Promise<any>;
    /**
    * Maps a module id to a source.
    * @param id The module id.
    * @param source The source to map the module to.
    */
    map(id: string, source: any): void;
    /**
    * Normalizes a module id.
    * @param moduleId The module id to normalize.
    * @param relativeTo What the module id should be normalized relative to.
    * @return The normalized module id.
    */
    normalizeSync(moduleId: string, relativeTo: string): string;
    /**
    * Normalizes a module id.
    * @param moduleId The module id to normalize.
    * @param relativeTo What the module id should be normalized relative to.
    * @return The normalized module id.
    */
    normalize(moduleId: string, relativeTo: string): Promise<string>;
    /**
    * Instructs the loader to use a specific TemplateLoader instance for loading templates
    * @param templateLoader The instance of TemplateLoader to use for loading templates.
    */
    useTemplateLoader(templateLoader: TextTemplateLoader): void;
    /**
    * Loads a collection of modules.
    * @param ids The set of module ids to load.
    * @return A Promise for an array of loaded modules.
    */
    loadAllModules(ids: Array<string>): Promise<any[]>;
    /**
    * Loads a module.
    * @param moduleId The module ID to load.
    * @return A Promise for the loaded module.
    */
    loadModule(moduleId: string, defaultHMR?: boolean): Promise<any>;
    /**
    * Loads a template.
    * @param url The url of the template to load.
    * @return A Promise for a TemplateRegistryEntry containing the template.
    */
    loadTemplate(url: string): Promise<any>;
    /**
    * Loads a text-based resource.
    * @param url The url of the text file to load.
    * @return A Promise for text content.
    */
    loadText(url: string): Promise<any>;
    /**
    * Alters a module id so that it includes a plugin loader.
    * @param url The url of the module to load.
    * @param pluginName The plugin to apply to the module id.
    * @return The plugin-based module id.
    */
    applyPluginToUrl(url: string, pluginName: string): string;
    /**
    * Registers a plugin with the loader.
    * @param pluginName The name of the plugin.
    * @param implementation The plugin implementation.
    */
    addPlugin(pluginName: string, implementation: LoaderPlugin): void;
}
