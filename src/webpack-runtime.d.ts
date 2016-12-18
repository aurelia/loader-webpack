declare const __webpack_require__: {
  (moduleId: string): any;
  /**
   * require.ensure method
   */
  e(chunkId: string): Promise<void>;
  /**
   * Object containing available Webpack modules
   */
  m: { [name: string]: any; [number: number]: any; };
  /**
   * The module cache (already loaded modules)
   */
  c: { [name: string]: any; [number: number]: any; };
  /**
   * Identity function for calling harmory imports with the correct context
   */
  i<T>(value: T): T;
  /**
   * Define getter function for harmory exports
   */
  d<T, Y extends () => any>(exports: T, name: string, getter: Y): T & { name: Y };
  /**
   * getDefaultExport function for compatibility with non-harmony modules
   */
  n(module: any): any;
  o: typeof Object.prototype.hasOwnProperty;
  /**
   * __webpack_public_path__
   */
  p: string;
  /**
   * on error function for async loading
   */
  oe(err: Error): void;
  /**
   * entry module ID
   */
  s: number | string;
};
