# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.2.1"></a>
## [2.2.1](https://github.com/aurelia/loader-webpack/compare/2.1.0...2.2.1) (2018-06-19)


### Bug Fixes

* **eachModule:** shortcircuit the iteration when callback returns true ([d5a6d73](https://github.com/aurelia/loader-webpack/commit/d5a6d73))
* **loader-webpack:** handle HMR changes also in async modules ([#40](https://github.com/aurelia/loader-webpack/issues/40)) ([36c5de3](https://github.com/aurelia/loader-webpack/commit/36c5de3))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/aurelia/loader-webpack/compare/1.0.2...v1.0.3) (2016-09-22)


### Bug Fixes

* **index:** delete the empty cache element if failed to __webpack_require__ ([13fb8b8](https://github.com/aurelia/loader-webpack/commit/13fb8b8)), closes [#18](https://github.com/aurelia/loader-webpack/issues/18)



<a name="1.0.2"></a>
## [1.0.2](https://github.com/aurelia/loader-webpack/compare/1.0.1...v1.0.2) (2016-07-29)


### Bug Fixes

* **index:** incorrect contextual "this" reference ([bf29b49](https://github.com/aurelia/loader-webpack/commit/bf29b49))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/aurelia/loader-webpack/compare/1.0.0...v1.0.1) (2016-07-29)


### Bug Fixes

* **index:** cache loading Promises and fix lazy loading ([26e1a74](https://github.com/aurelia/loader-webpack/commit/26e1a74)), closes [#15](https://github.com/aurelia/loader-webpack/issues/15)



<a name="1.0.0"></a>
# [1.0.0](https://github.com/aurelia/loader-webpack/compare/1.0.0-rc.1.0.0...v1.0.0) (2016-07-27)


### Features

* **index:** expose ensureOriginOnExports and simplify loadModule ([b6a3ed0](https://github.com/aurelia/loader-webpack/commit/b6a3ed0))
* **index:** further simplify loadModule ([4fe5405](https://github.com/aurelia/loader-webpack/commit/4fe5405))
* **index:** implement PLATFORM.eachModule ([a942c57](https://github.com/aurelia/loader-webpack/commit/a942c57))



<a name="1.0.0-rc.1.0.0"></a>
# [1.0.0-rc.1.0.0](https://github.com/aurelia/loader-webpack/compare/1.0.0-beta.2.0.1...v1.0.0-rc.1.0.0) (2016-06-22)



### 1.0.0-beta.1.0.3 (2016-06-09)


#### Features

* **index:**
  * support css-loader ([c767f849](http://github.com/aurelia/loader-webpack/commit/c767f849ed7375990db105fb559a46b325c3e4e1))
  * use a named chunk ([12ab2481](http://github.com/aurelia/loader-webpack/commit/12ab2481b1ebbfbc8cbf68c4ad8dcbaabd44d852))


### 1.0.0-beta.1.0.2 (2016-05-10)


### 1.0.0-beta.1.0.1 (2016-04-13)


#### Bug Fixes

* **index:** ensure correct cache lookup ([b9c9aa55](http://github.com/aurelia/loader-webpack/commit/b9c9aa5511df0b3b7f5615d5368e6c34e96a0175))


#### Features

* **index:** implement PLATFORM.eachModule for webpack ([9bd90f47](http://github.com/aurelia/loader-webpack/commit/9bd90f47f83f848f11106b2f3996125b37be7997))


### 1.0.0-beta.1.0.0 (2016-03-22)

* Update to Babel 6

### 0.1.2 (2016-03-01)


#### Bug Fixes

* **all:** remove core-js dependency ([dfb7784a](http://github.com/aurelia/loader-webpack/commit/dfb7784a622604a31a99f605692b5db5916d5750))


### 0.1.1 (2016-02-25)
