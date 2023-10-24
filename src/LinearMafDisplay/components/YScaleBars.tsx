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
    const { rowHeight, samples } = model
    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          height: samples.length * rowHeight,
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
  const { model } = props
  const { rowHeight, samples } = model
  const svgFontSize = Math.min(rowHeight, 12)
  const canDisplayLabel = rowHeight >= 10
  const minWidth = 20

  const labelWidth = Math.max(
    ...(samples
      .map(s => measureText(s.label, svgFontSize))
      .map(width => (canDisplayLabel ? width : minWidth)) || [0]),
  )

  return (
    <Wrapper {...props}>
      <ColorLegend model={model} labelWidth={labelWidth} />
    </Wrapper>
  )
})

export default YScaleBars
