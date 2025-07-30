import React, { useMemo, useRef } from 'react'

import { PrerenderedCanvas } from '@jbrowse/core/ui'
import { observer } from 'mobx-react'
import RBush from 'rbush'

type SerializedRBush = any

interface RBushData {
  minX: number
  maxX: number
  minY: number
  maxY: number
  isInsertion: boolean
}
const LinearMafRendering = observer(function (props: {
  width: number
  height: number
  displayModel: any
  rbush: SerializedRBush
}) {
  const { displayModel, height, rbush } = props
  const ref = useRef<HTMLDivElement>(null)
  const rbush2 = useMemo(() => new RBush<RBushData>().fromJSON(rbush), [rbush])

  function getFeatureUnderMouse(eventClientX: number, eventClientY: number) {
    let offsetX = 0
    let offsetY = 0
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      offsetX = eventClientX - r.left
      offsetY = eventClientY - r.top
    }

    const x = rbush2.search({
      minX: offsetX,
      maxX: offsetX + 1,
      minY: offsetY,
      maxY: offsetY + 1,
    })
    if (x.length) {
      // prioritize insertions
      const { minX, minY, maxX, maxY, ...rest } =
        x.find(f => f.isInsertion) || x[0]!
      return rest
    } else {
      return undefined
    }
  }
  return (
    <div
      ref={ref}
      onMouseMove={e =>
        displayModel.setHoveredInfo?.(
          getFeatureUnderMouse(e.clientX, e.clientY),
        )
      }
      onMouseLeave={() => {
        displayModel.setHoveredInfo?.(undefined)
      }}
      onMouseOut={() => {
        displayModel.setHoveredInfo?.(undefined)
      }}
      style={{
        overflow: 'visible',
        position: 'relative',
        height,
      }}
    >
      <PrerenderedCanvas
        {...props}
        style={{
          position: 'absolute',
          left: 0,
        }}
      />
    </div>
  )
})

export default LinearMafRendering
