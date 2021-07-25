import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';

const externals = Object.keys(pkg.dependencies);

export default [{
  input: 'src/aurelia-loader-webpack.ts',
  output: [
    { file: `dist/amd/${pkg.name}.js`, format: 'amd', amd: { id: pkg.name } },
    { file: `dist/commonjs/${pkg.name}.js`, format: 'cjs' },
    { file: `dist/native-modules/${pkg.name}.js`, format: 'es' },
  ],
  plugins: [
    typescript()
  ],
  external: externals,
}, {
  input: 'src/aurelia-loader-webpack.ts',
  output: [
    { file: `dist/es2015/${pkg.name}.js`, format: 'es' },
    { file: `dist/es2017/${pkg.name}.js`, format: 'es' },
  ],
  plugins: [
    typescript({
      target: 'es2015'
    })
  ],
  external: externals,
},  {
  input: 'src/aurelia-loader-webpack.ts',
  output: [
    { file: `dist/es2017/${pkg.name}.js`, format: 'es' },
  ],
  plugins: [
    typescript({
      target: 'es2017'
    })
  ],
  external: externals,
}];
