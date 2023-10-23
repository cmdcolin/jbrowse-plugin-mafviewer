import { PrerenderedCanvas } from '@jbrowse/core/ui'
import React from 'react'

function ReactComponent(props: any) {
  return (
    <div>
      <PrerenderedCanvas {...props} />
    </div>
  )
}

export default ReactComponent
