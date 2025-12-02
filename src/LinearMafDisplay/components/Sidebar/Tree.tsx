import React from 'react'

import { observer } from 'mobx-react'

import type { LinearMafDisplayModel } from '../../stateModel'

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
                  onMouseEnter={() => {
                    model.setHighlightedRowNames(
                      nodeDescendantNames.get(source),
                    )
                  }}
                  onMouseLeave={() => {
                    model.setHighlightedRowNames(undefined)
                  }}
                />
                <line
                  stroke="black"
                  x1={sx}
                  y1={ty}
                  x2={tx}
                  y2={ty}
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onMouseEnter={() => {
                    model.setHighlightedRowNames(
                      nodeDescendantNames.get(target),
                    )
                  }}
                  onMouseLeave={() => {
                    model.setHighlightedRowNames(undefined)
                  }}
                />
              </React.Fragment>
            )
          })
        : null}
    </>
  )
})

export default Tree
