import globals from '@jbrowse/core/ReExports/list'
import { createRollupConfig } from '@jbrowse/development-tools'

function stringToBoolean(string) {
  if (string === undefined) {
    return false
  }
  if (string === 'true') {
    return true
  }
  if (string === 'false') {
    return false
  }
  throw new Error('unknown boolean string')
}

const includeUMD = true
const includeCJS = stringToBoolean(process.env.JB_CJS)
const includeESMBundle = stringToBoolean(process.env.JB_ESM_BUNDLE)
const includeNPM = stringToBoolean(process.env.JB_NPM)

export default createRollupConfig(globals.default, {
  includeUMD,
  includeCJS,
  includeESMBundle,
  includeNPM,
})
