declare namespace Webpack {
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
}
