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
  const {
    hierarchy,
    totalHeight,
    treeWidth,
    showBranchLen,
    samples,
    rowHeight,
  } = model
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
      {hierarchy
        ? [...hierarchy.links()].map(link => {
            const { source, target } = link
            const sy = source.x!
            const ty = target.x!
            // @ts-expect-error
            const tx = showBranchLen ? target.len : target.y
            // @ts-expect-error
            const sx = showBranchLen ? source.len : source.y

            // 1d line intersection to check if line crosses block at all, this is
            // an optimization that allows us to skip drawing most tree links
            // outside the block
            return (
              <React.Fragment key={[sy, ty, tx, sx].join('-')}>
                <line stroke="black" x1={sx} y1={sy} x2={sx} y2={ty} />
                <line stroke="black" x1={sx} y1={ty} x2={tx} y2={ty} />
              </React.Fragment>
            )
          })
        : null}
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
