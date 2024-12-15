import React from 'react'
import { observer } from 'mobx-react'

// locals
import { LinearMafDisplayModel } from '../stateModel'
import RectBg from './RectBg'

const ColorLegend = observer(function ({
  model,
  labelWidth,
  svgFontSize,
}: {
  model: LinearMafDisplayModel
  svgFontSize: number
  labelWidth: number
}) {
  const { samples, rowHeight } = model
  const canDisplayLabel = rowHeight >= 10
  const boxHeight = Math.min(20, rowHeight)

  return (
    <>
      {samples.map((sample, idx) => (
        <RectBg
          key={`${sample.id}-${idx}`}
          y={idx * rowHeight}
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
              y={idx * rowHeight + rowHeight / 2}
              dominantBaseline="middle"
              x={2}
              fontSize={svgFontSize}
            >
              {sample.label}
            </text>
          ))
        : null}
    </>
  )
})

export default ColorLegend
