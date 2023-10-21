import { getEnv } from '@jbrowse/core/util'
import { observer } from 'mobx-react'
import React from 'react'

const LinearMafDisplay = observer(function (props: any) {
  const { pluginManager } = getEnv(props.model)

  const LinearGenomePlugin = pluginManager.getPlugin(
    'LinearGenomeViewPlugin',
  ) as import('@jbrowse/plugin-linear-genome-view').default
  const { BaseLinearDisplayComponent } = LinearGenomePlugin.exports

  return (
    <div>
      <BaseLinearDisplayComponent {...props} />
    </div>
  )
})

export default LinearMafDisplay
