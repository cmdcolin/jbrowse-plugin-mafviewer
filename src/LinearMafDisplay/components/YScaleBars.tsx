import React from 'react'

import { getContainingView, measureText } from '@jbrowse/core/util'
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

export function max(arr: number[], init = Number.NEGATIVE_INFINITY) {
  let max = init
  for (const entry of arr) {
    max = Math.max(entry, max)
  }
  return max
}

export const YScaleBars = observer(function (props: {
  model: LinearMafDisplayModel
  orientation?: string
  exportSVG?: boolean
}) {
  const { model } = props
  const { rowHeight, samples } = model
  const svgFontSize = Math.min(Math.max(rowHeight, 8), 14)
  const canDisplayLabel = rowHeight >= 8
  const minWidth = 20

  const labelWidth = max(
    samples
      .map(s => measureText(s.label, svgFontSize))
      .map(width => (canDisplayLabel ? width : minWidth)),
  )

  return (
    <Wrapper {...props}>
      <ColorLegend
        model={model}
        labelWidth={labelWidth}
        svgFontSize={svgFontSize}
      />
    </Wrapper>
  )
})

export default YScaleBars
