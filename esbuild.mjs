import * as esbuild from 'esbuild'
import http from 'node:http'
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

if (process.env.NODE_ENV === 'production') {
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    globalName: 'JBrowsePluginMafViewer',
    sourcemap: true,
    outfile: 'dist/jbrowse-plugin-mafviewer.umd.production.min.js',
    metafile: true,
    minify: true,
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
} else {
  let ctx = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    globalName: 'JBrowsePluginMafViewer',
    sourcemap: true,
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
  let { hosts, port } = await ctx.serve({
    servedir: '.',
    port: 9001,
  })

  http
    .createServer((req, res) => {
      const proxyReq = http.request(
        {
          hostname: hosts[0],
          port: 9001,
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        proxyRes => {
          //restore the CORS after
          //https://github.com/evanw/esbuild/releases/tag/v0.25.0 disabled it
          //as a potential vuln
          res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            'Access-Control-Allow-Origin': '*',
          })
          proxyRes.pipe(res, { end: true })
        },
      )

      // Forward the body of the request to esbuild
      req.pipe(proxyReq, { end: true })
    })
    .listen(9000)
  console.log(`Serving at http://${hosts[0]}:9000`)

  await ctx.watch()
  console.log('Watching files...')
}
