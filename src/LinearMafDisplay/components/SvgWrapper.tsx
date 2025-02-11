import React from 'react'

import { getContainingView } from '@jbrowse/core/util'
import { observer } from 'mobx-react'

// locals
import { LinearMafDisplayModel } from '../stateModel'

const SvgWrapper = observer(function ({
  children,
  model,
  exportSVG,
}: {
  model: LinearMafDisplayModel
  children: React.ReactNode
  exportSVG?: boolean
}) {
  if (exportSVG) {
    return <>{children}</>
  } else {
    const { totalHeight } = model
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          height: totalHeight,
          width: getContainingView(model).width,
        }}
      >
        {children}
      </svg>
    )
  }
})

export default SvgWrapper
