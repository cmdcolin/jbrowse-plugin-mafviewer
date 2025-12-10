import React, { useCallback, useMemo } from 'react'

import { observer } from 'mobx-react'

import type { LinearMafDisplayModel } from '../../stateModel'
import type { NodeWithIdsAndLength } from '../../types'
import type { HierarchyNode } from 'd3-hierarchy'

const hitboxStyle = {
  pointerEvents: 'all',
  cursor: 'pointer',
  strokeWidth: 8,
  stroke: 'transparent',
} as const

const Tree = observer(function ({ model }: { model: LinearMafDisplayModel }) {
  const {
    // rowHeight is needed for redrawing after zoom change
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    rowHeight: _rowHeight,
    treeAreaWidth,
    hierarchy,
    showBranchLen,
    nodeDescendantNames,
  } = model

  const clearHighlight = useCallback(() => {
    model.setHighlightedRowNames(undefined)
  }, [model])

  const nodeHandlers = useMemo(() => {
    const handlers = new Map<HierarchyNode<NodeWithIdsAndLength>, () => void>()
    if (hierarchy) {
      for (const node of hierarchy.descendants()) {
        handlers.set(node, () => {
          model.setHighlightedRowNames(nodeDescendantNames.get(node), {
            x: node.x!,
            y: node.y!,
          })
        })
      }
    }
    return handlers
  }, [model, hierarchy, nodeDescendantNames, treeAreaWidth])

  return (
    <>
      {hierarchy
        ? [...hierarchy.links()].map(link => {
            const { source, target } = link
            const sy = source.x!
            const ty = target.x!
            // @ts-expect-error
            const tx = showBranchLen ? target.len : target.y
            // @ts-expect-error
            const sx = showBranchLen ? source.len : source.y

            return (
              <React.Fragment key={`${treeAreaWidth}-${sy}-${ty}-${tx}-${sx}`}>
                {/* Visible lines */}
                <line stroke="black" x1={sx} y1={sy} x2={sx} y2={ty} />
                <line stroke="black" x1={sx} y1={ty} x2={tx} y2={ty} />
                {/* Invisible hitbox lines */}
                <line
                  x1={sx}
                  y1={sy}
                  x2={sx}
                  y2={ty}
                  style={hitboxStyle}
                  onMouseEnter={nodeHandlers.get(source)}
                  onMouseLeave={clearHighlight}
                />
                <line
                  x1={sx}
                  y1={ty}
                  x2={tx}
                  y2={ty}
                  style={hitboxStyle}
                  onMouseEnter={nodeHandlers.get(target)}
                  onMouseLeave={clearHighlight}
                />
              </React.Fragment>
            )
          })
        : null}
    </>
  )
})

export default Tree
