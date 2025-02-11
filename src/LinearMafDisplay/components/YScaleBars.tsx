import React from 'react'

import { measureText } from '@jbrowse/core/util'
import { observer } from 'mobx-react'

// locals
import { LinearMafDisplayModel } from '../stateModel'
import ColorLegend from './ColorLegend'
import SvgWrapper from './SvgWrapper'
import { max } from './util'

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
      ?.map(s => measureText(s.label, svgFontSize))
      .map(width => (canDisplayLabel ? width : minWidth)) || [],
    0,
  )

  return (
    <SvgWrapper {...props}>
      <ColorLegend
        model={model}
        labelWidth={labelWidth}
        svgFontSize={svgFontSize}
      />
    </SvgWrapper>
  )
})

export default YScaleBars
