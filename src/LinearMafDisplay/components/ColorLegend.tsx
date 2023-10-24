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
  const boxHeight = Math.min(20, rowHeight)

  return samples ? (
    <>
      {samples.map((sample, idx) => (
        <RectBg
          key={`${sample.id}-${idx}`}
          y={idx * rowHeight + 1}
          x={0}
          width={labelWidth + 5}
          height={boxHeight}
          color={sample.color}
        />
      ))}
      {canDisplayLabel
        ? samples.map((sample, idx) => (
            <text
              key={`${sample.id}-${idx}`}
              y={idx * rowHeight + 14}
              x={2}
              fontSize={svgFontSize}
            >
              {sample.label}
            </text>
          ))
        : null}
    </>
  ) : null
})

export default ColorLegend
