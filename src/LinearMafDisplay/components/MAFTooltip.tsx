import React from 'react'
import { SanitizedHTML } from '@jbrowse/core/ui'
import BaseTooltip from '@jbrowse/core/ui/BaseTooltip'

interface MAFTooltipProps {
  mouseY?: number
  rowHeight: number
  sources: Record<string, any>[]
}

const MAFTooltip = ({ mouseY, rowHeight, sources }: MAFTooltipProps) => {
  if (!mouseY || !sources) {
    return null
  }
  const ret = Object.entries(sources[Math.floor(mouseY / rowHeight)] || {})
    .filter(([key]) => key !== 'color' && key !== 'id')
    .map(([key, value]) => `${key}:${value}`)
    .join('\n')

  return ret ? (
    <BaseTooltip>
      <SanitizedHTML html={ret} />
    </BaseTooltip>
  ) : null
}

export default MAFTooltip
