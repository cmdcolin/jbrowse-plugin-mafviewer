import React, { useRef, useState } from 'react'

import BaseTooltip from '@jbrowse/core/ui/BaseTooltip'
import SanitizedHTML from '@jbrowse/core/ui/SanitizedHTML'
import { getContainingView, getEnv } from '@jbrowse/core/util'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

import YScaleBars from './YScaleBars'
import { LinearMafDisplayModel } from '../stateModel'

import type { LinearGenomeViewModel } from '@jbrowse/plugin-linear-genome-view'

const useStyles = makeStyles()({
  cursor: {
    pointerEvents: 'none',
  },
})

const LinearMafDisplay = observer(function (props: {
  model: LinearMafDisplayModel
}) {
  const { model } = props
  const { classes } = useStyles()
  const { pluginManager } = getEnv(model)
  const { rowHeight, height, scrollTop, samples: sources } = model
  const ref = useRef<HTMLDivElement>(null)

  const LinearGenomePlugin = pluginManager.getPlugin(
    'LinearGenomeViewPlugin',
  ) as import('@jbrowse/plugin-linear-genome-view').default
  const { BaseLinearDisplayComponent } = LinearGenomePlugin.exports

  const [mouseY, setMouseY] = useState<number>()
  const [mouseX, setMouseX] = useState<number>()
  const { width } = getContainingView(model) as LinearGenomeViewModel

  return (
    <div
      ref={ref}
      onMouseMove={event => {
        const rect = ref.current?.getBoundingClientRect()
        const top = rect?.top || 0
        const left = rect?.left || 0
        setMouseY(event.clientY - top)
        setMouseX(event.clientX - left)
      }}
      onMouseLeave={() => {
        setMouseY(undefined)
        setMouseX(undefined)
      }}
    >
      <BaseLinearDisplayComponent {...props} />
      <YScaleBars model={model} />
      {mouseY && sources ? (
        <div style={{ position: 'relative' }}>
          <svg
            className={classes.cursor}
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: scrollTop,
            }}
          >
            <line
              x1={0}
              x2={width}
              y1={mouseY - scrollTop}
              y2={mouseY - scrollTop}
              stroke="black"
            />
            <line x1={mouseX} x2={mouseX} y1={0} y2={height} stroke="black" />
          </svg>
          <BaseTooltip>
            <SanitizedHTML
              html={Object.entries(
                sources[Math.floor(mouseY / rowHeight)] || {},
              )
                .filter(([key]) => key !== 'color' && key !== 'id')
                .map(([key, value]) => `${key}:${value}`)
                .join('\n')}
            />
          </BaseTooltip>
        </div>
      ) : null}
    </div>
  )
})

export default LinearMafDisplay
