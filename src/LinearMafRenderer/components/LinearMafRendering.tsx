import React, { useCallback, useMemo, useRef, useState } from 'react'

import { PrerenderedCanvas } from '@jbrowse/core/ui'
import Flatbush from 'flatbush'
import { observer } from 'mobx-react'

import { Sample } from '../../LinearMafDisplay/types'
import { RenderedBase } from '../rendering'

type SerializedRBush = any

const LinearMafRendering = observer(function (props: {
  width: number
  height: number
  displayModel: any
  flatbush: SerializedRBush
  items: RenderedBase[]
  samples: Sample[]
}) {
  const { items, displayModel, height, samples, flatbush } = props
  const ref = useRef<HTMLDivElement>(null)
  const flatbush2 = useMemo(() => Flatbush.from(flatbush), [flatbush])
  const [isOverLargeInsertion, setIsOverLargeInsertion] = useState(false)

  const getFeatureUnderMouse = useCallback(
    (eventClientX: number, eventClientY: number) => {
      let offsetX = 0
      let offsetY = 0
      if (ref.current) {
        const r = ref.current.getBoundingClientRect()
        offsetX = eventClientX - r.left
        offsetY = eventClientY - r.top
      }

      const x = flatbush2.search(offsetX, offsetY, offsetX + 1, offsetY + 1)
      if (x.length) {
        const elt = x.find(idx => items[idx]?.isInsertion)
        const r = elt !== undefined ? items[elt]! : items[x[0]!]!
        const s = samples[r.sampleId]
        return {
          ...r,
          sampleId: s?.id ?? 'unknown',
          sampleLabel: s?.label || s?.id || 'unknown',
        }
      } else {
        return undefined
      }
    },
    [flatbush2, items, samples],
  )

  return (
    <div
      ref={ref}
      onClick={e => {
        const feature = getFeatureUnderMouse(e.clientX, e.clientY)
        if (feature?.isLargeInsertion) {
          displayModel.showInsertionSequenceDialog?.({
            sequence: feature.base,
            sampleLabel: feature.sampleLabel,
            chr: feature.chr,
            pos: feature.pos,
          })
        }
      }}
      onMouseMove={e => {
        const feature = getFeatureUnderMouse(e.clientX, e.clientY)
        displayModel.setHoveredInfo?.(feature)
        displayModel.setHighlightedRowNames?.(
          feature?.sampleId ? [feature.sampleId] : undefined,
        )
        setIsOverLargeInsertion(!!feature?.isLargeInsertion)
      }}
      onMouseLeave={() => {
        displayModel.setHoveredInfo?.(undefined)
        displayModel.setHighlightedRowNames?.(undefined)
        setIsOverLargeInsertion(false)
      }}
      style={{
        overflow: 'visible',
        position: 'relative',
        height,
        cursor: isOverLargeInsertion ? 'pointer' : 'default',
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
