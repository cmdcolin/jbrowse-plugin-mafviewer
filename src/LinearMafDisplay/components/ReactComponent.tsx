import React from 'react'
import { getEnv } from '@jbrowse/core/util'
import { observer } from 'mobx-react'
import YScaleBars from './YScaleBars'

const LinearMafDisplay = observer(function (props: any) {
  const { model } = props
  const { pluginManager } = getEnv(model)

  const LinearGenomePlugin = pluginManager.getPlugin(
    'LinearGenomeViewPlugin',
  ) as import('@jbrowse/plugin-linear-genome-view').default
  const { BaseLinearDisplayComponent } = LinearGenomePlugin.exports

  return (
    <div>
      <BaseLinearDisplayComponent {...props} />
      <YScaleBars model={model} />
    </div>
  )
})

export default LinearMafDisplay
