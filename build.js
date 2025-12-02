import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'script.js',
  minify: false,
  sourcemap: true,
  target: ['es2020'],
})