import React from 'react'
import { getContainingView } from '@jbrowse/core/util'
import {
  ExportSvgDisplayOptions,
  LinearGenomeViewModel,
} from '@jbrowse/plugin-linear-genome-view'

// locals
import { LinearMafDisplayModel } from './stateModel'
import YScaleBars from './components/YScaleBars'

export async function renderSvg(
  self: LinearMafDisplayModel,
  opts: ExportSvgDisplayOptions,
  superRenderSvg: (opts: ExportSvgDisplayOptions) => Promise<React.ReactNode>,
) {
  const { offsetPx } = getContainingView(self) as LinearGenomeViewModel
  return (
    <>
      <g id="snpcov">{await superRenderSvg(opts)}</g>
      <g transform={`translate(${Math.max(-offsetPx, 0)})`}>
        <YScaleBars model={self} orientation="left" exportSVG />
      </g>
    </>
  )
}
