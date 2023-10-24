import React from 'react'
import { observer } from 'mobx-react'

// locals
import { LinearMafDisplayModel } from '../stateModel'
import RectBg from './RectBg'

const ColorLegend = observer(function ({
  model,
  labelWidth,
}: {
  model: LinearMafDisplayModel
  labelWidth: number
}) {
  const { samples, rowHeight } = model
  const svgFontSize = Math.min(rowHeight, 10)
  const canDisplayLabel = rowHeight >= 10
  const colorBoxWidth = 0
  const legendWidth = labelWidth + colorBoxWidth + 5
  const extraOffset = 0

  return samples ? (
    <>
      {samples.map((sample, idx) => {
        const boxHeight = Math.min(20, rowHeight)
        return (
          <React.Fragment key={`${sample.id}-${idx}`}>
            <RectBg
              y={idx * rowHeight + 1}
              x={extraOffset}
              width={legendWidth}
              height={boxHeight}
              color={sample.color}
            />
            {canDisplayLabel ? (
              <text
                y={idx * rowHeight + 14}
                x={extraOffset + colorBoxWidth + 2}
                fontSize={svgFontSize}
              >
                {sample.label}
              </text>
            ) : null}
          </React.Fragment>
        )
      })}
    </>
  ) : null
})

export default ColorLegend
