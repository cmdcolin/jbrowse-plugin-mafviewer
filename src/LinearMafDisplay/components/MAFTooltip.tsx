import React from 'react'

import { SanitizedHTML } from '@jbrowse/core/ui'
import BaseTooltip from '@jbrowse/core/ui/BaseTooltip'
import { getContainingView, toLocale } from '@jbrowse/core/util'
import { observer } from 'mobx-react'

import type { LinearMafDisplayModel } from '../stateModel'
import type { LinearGenomeViewModel } from '@jbrowse/plugin-linear-genome-view'

interface MAFTooltipProps {
  mouseY: number
  mouseX: number
  rowHeight: number
  sources: Record<string, any>[]
  model: LinearMafDisplayModel
}

const MAFTooltip = observer(function ({
  model,
  mouseY,
  mouseX,
  rowHeight,
  sources,
}: MAFTooltipProps) {
  const view = getContainingView(model) as LinearGenomeViewModel
  const ret = Object.entries(sources[Math.floor(mouseY / rowHeight)] || {})
    .filter(([key]) => key !== 'color' && key !== 'id')
    .map(([key, value]) => `${key}:${value}`)
    .join('\n')
  const position = view.pxToBp(mouseX)
  return ret ? (
    <BaseTooltip>
      <SanitizedHTML
        html={`${ret} - ${position.refName}:${toLocale(position.coord)}`}
      />
    </BaseTooltip>
  ) : null
})

export default MAFTooltip
