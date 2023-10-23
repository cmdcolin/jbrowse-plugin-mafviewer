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
  const svgFontSize = Math.min(rowHeight, 12)
  const canDisplayLabel = rowHeight > 11
  const colorBoxWidth = 15
  const legendWidth = labelWidth + colorBoxWidth + 5
  const extraOffset = 0

  return samples ? (
    <>
      {samples.map((source, idx) => {
        const boxHeight = Math.min(20, rowHeight)
        return (
          <React.Fragment key={`${source.name}-${idx}`}>
            {source.color ? (
              <RectBg
                y={idx * rowHeight + 1}
                x={extraOffset}
                width={colorBoxWidth}
                height={boxHeight}
                color={source.color}
              />
            ) : null}
            <RectBg
              y={idx * rowHeight + 1}
              x={extraOffset}
              width={legendWidth}
              height={boxHeight}
            />
            {canDisplayLabel ? (
              <text
                y={idx * rowHeight + 13}
                x={extraOffset + colorBoxWidth + 2}
                fontSize={svgFontSize}
              >
                {source.name}
              </text>
            ) : null}
          </React.Fragment>
        )
      })}
    </>
  ) : null
})

export default ColorLegend
