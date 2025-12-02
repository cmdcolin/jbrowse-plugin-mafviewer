import React, { useEffect, useRef } from 'react'

import { getContainingView } from '@jbrowse/core/util'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import { isAlive } from 'mobx-state-tree'

import type { LinearMafDisplayModel } from '../../stateModel'
import type { LinearGenomeViewModel } from '@jbrowse/plugin-linear-genome-view'

const SvgWrapper = observer(function ({
  children,
  model,
  exportSVG,
}: {
  model: LinearMafDisplayModel
  children: React.ReactNode
  exportSVG?: boolean
}) {
  const mouseoverRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = mouseoverRef.current?.getContext('2d')
    return ctx
      ? autorun(() => {
          if (isAlive(model)) {
            const {
              totalHeight,
              sidebarWidth,
              leafMap,
              rowHeight,
              highlightedRowNames,
            } = model

            ctx.resetTransform()
            ctx.clearRect(0, 0, sidebarWidth, totalHeight)

            if (highlightedRowNames) {
              ctx.fillStyle = 'rgba(255,165,0,0.2)'
              for (const name of highlightedRowNames) {
                const leaf = leafMap.get(name)
                if (leaf) {
                  const y = leaf.x!
                  ctx.fillRect(0, y - rowHeight / 2, sidebarWidth, rowHeight)
                }
              }
            }
          }
        })
      : undefined
  }, [model])

  if (exportSVG) {
    return <>{children}</>
  } else {
    const { totalHeight, sidebarWidth } = model
    const { width } = getContainingView(model) as LinearGenomeViewModel
    return (
      <>
        <svg
          style={{
            position: 'absolute',
            userSelect: 'none',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            height: totalHeight,
            width,
          }}
        >
          {children}
        </svg>
        <canvas
          ref={mouseoverRef}
          width={sidebarWidth}
          height={totalHeight}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: sidebarWidth,
            height: totalHeight,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        />
      </>
    )
  }
})

export default SvgWrapper
