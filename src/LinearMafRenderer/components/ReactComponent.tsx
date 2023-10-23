import { PrerenderedCanvas } from '@jbrowse/core/ui'
import { observer } from 'mobx-react'
import React from 'react'

const LinearMafRendering = observer(function (props: any) {
  return <PrerenderedCanvas {...props} />
})

export default LinearMafRendering
