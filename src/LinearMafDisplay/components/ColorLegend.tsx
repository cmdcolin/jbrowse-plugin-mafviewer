import React from 'react'

import { observer } from 'mobx-react'

// locals
import { LinearMafDisplayModel } from '../stateModel'
import RectBg from './RectBg'
import Tree from './Tree'

const ColorLegend = observer(function ({
  model,
  labelWidth,
  svgFontSize,
}: {
  model: LinearMafDisplayModel
  svgFontSize: number
  labelWidth: number
}) {
  const { totalHeight, treeWidth, samples, rowHeight } = model
  const canDisplayLabel = rowHeight >= 8
  const boxHeight = Math.min(20, rowHeight)

  return (
    <>
      <RectBg
        y={0}
        x={0}
        width={labelWidth + 5 + treeWidth}
        height={totalHeight}
      />
      <Tree model={model} />
      <g transform={`translate(${treeWidth + 5},0)`}>
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
      </g>
    </>
  )
})

export default ColorLegend
