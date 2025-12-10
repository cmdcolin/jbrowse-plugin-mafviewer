import React, { useCallback } from 'react'

import { observer } from 'mobx-react'

import type { LinearMafDisplayModel } from '../../stateModel'
import type { HierarchyNode } from 'd3-hierarchy'
import type { NodeWithIdsAndLength } from '../../types'

const Tree = observer(function ({ model }: { model: LinearMafDisplayModel }) {
  const {
    // this is needed for redrawing after zoom change, similar to react-msaview
    // renderTreeCanvas
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    rowHeight: _rowHeight,

    hierarchy,
    showBranchLen,
    nodeDescendantNames,
  } = model

  const clearHighlight = useCallback(() => {
    model.setHighlightedRowNames(undefined)
  }, [model])

  const makeMouseEnterHandler = useCallback(
    (node: HierarchyNode<NodeWithIdsAndLength>) => () => {
      model.setHighlightedRowNames(nodeDescendantNames.get(node))
    },
    [model, nodeDescendantNames],
  )

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
            const key = `${sy}-${ty}-${tx}-${sx}`

            return (
              <React.Fragment key={key}>
                <line
                  stroke="black"
                  x1={sx}
                  y1={sy}
                  x2={sx}
                  y2={ty}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onMouseEnter={makeMouseEnterHandler(source)}
                  onMouseLeave={clearHighlight}
                />
                <line
                  stroke="black"
                  x1={sx}
                  y1={ty}
                  x2={tx}
                  y2={ty}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onMouseEnter={makeMouseEnterHandler(target)}
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
