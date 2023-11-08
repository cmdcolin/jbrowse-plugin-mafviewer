import * as esbuild from 'esbuild'
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals'
import JbrowseGlobals from '@jbrowse/core/ReExports/list.js'
import prettyBytes from 'pretty-bytes'

function createGlobalMap(jbrowseGlobals) {
  const globalMap = {}
  for (const global of jbrowseGlobals) {
    globalMap[global] = {
      varName: `JBrowseExports["${global}"]`,
      type: 'cjs',
    }
  }
  return globalMap
}

let ctx = await esbuild.context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  globalName: 'JBrowsePluginMafViewer',
  outfile: 'dist/out.js',
  metafile: true,
  plugins: [
    globalExternals(createGlobalMap(JbrowseGlobals.default)),
    {
      name: 'rebuild-log',
      setup({ onStart, onEnd }) {
        let time
        onStart(() => {
          time = Date.now()
        })
        onEnd(({ metafile, errors, warnings }) => {
          console.log(
            `Built in ${Date.now() - time} ms with ${
              errors.length
            } error(s) and ${warnings.length} warning(s)`,
          )
          if (!metafile) {
            return
          }
          const { outputs } = metafile
          for (const [file, metadata] of Object.entries(outputs)) {
            const size = prettyBytes(metadata.bytes)
            console.log(`Wrote ${size} to ${file}`)
          }
        })
      },
    },
  ],
})

let { host, port } = await ctx.serve({
  servedir: '.',
  port: 9000,
  host: 'localhost',
})
const formattedHost = host === '127.0.0.1' ? 'localhost' : host
console.log(`Serving at http://${formattedHost}:${port}`)

await ctx.watch()
console.log('Watching files...')
