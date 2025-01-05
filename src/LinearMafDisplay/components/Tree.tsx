import React from 'react'
import { observer } from 'mobx-react'

const Tree = observer(function ({ model }: { model: any }) {
  const { hierarchy, showBranchLen } = model

  return (
    <>
      {hierarchy
        ? [...hierarchy.links()].map(link => {
            const { source, target } = link
            const sy = source.x!
            const ty = target.x!
            const tx = showBranchLen ? target.len : target.y
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
    </>
  )
})

export default Tree
