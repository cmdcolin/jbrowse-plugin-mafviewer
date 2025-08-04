import React, { useMemo, useRef } from 'react'

import { PrerenderedCanvas } from '@jbrowse/core/ui'
import Flatbush from 'flatbush'
import { observer } from 'mobx-react'

type SerializedRBush = any

const LinearMafRendering = observer(function (props: {
  width: number
  height: number
  displayModel: any
  flatbush: SerializedRBush
  items: any[]
}) {
  const { items, displayModel, height, flatbush } = props
  const ref = useRef<HTMLDivElement>(null)
  const rbush2 = useMemo(() => Flatbush.from(flatbush), [flatbush])

  function getFeatureUnderMouse(eventClientX: number, eventClientY: number) {
    let offsetX = 0
    let offsetY = 0
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      offsetX = eventClientX - r.left
      offsetY = eventClientY - r.top
    }

    const x = rbush2.search(offsetX, offsetY, offsetX + 1, offsetY + 1)
    if (x.length) {
      // prioritize insertions
      const { minX, minY, maxX, maxY, ...rest } = items[x[0]!]
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
