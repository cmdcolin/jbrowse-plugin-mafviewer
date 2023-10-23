import React from 'react'
import { measureText, getContainingView } from '@jbrowse/core/util'
import { observer } from 'mobx-react'

// locals
import { LinearMafDisplayModel } from '../stateModel'
import ColorLegend from './ColorLegend'

const Wrapper = observer(function ({
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
    const { height } = model
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          height,
          width: getContainingView(model).width,
        }}
      >
        {children}
      </svg>
    )
  }
})

export const YScaleBars = observer(function (props: {
  model: LinearMafDisplayModel
  orientation?: string
  exportSVG?: boolean
}) {
  const { model, exportSVG } = props
  const { rowHeight, sources } = model
  const svgFontSize = Math.min(rowHeight, 12)
  const canDisplayLabel = rowHeight > 11
  const minWidth = 20

  const labelWidth = Math.max(
    ...(sources
      .map(s => measureText(s, svgFontSize))
      .map(width => (canDisplayLabel ? width : minWidth)) || [0]),
  )
  console.log({ sources, labelWidth })

  return (
    <Wrapper {...props}>
      <ColorLegend
        exportSVG={exportSVG}
        model={model}
        rowHeight={model.rowHeight}
        labelWidth={labelWidth}
      />
    </Wrapper>
  )
})

export default YScaleBars
