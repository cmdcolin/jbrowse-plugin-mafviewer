import React, { useRef, useState } from 'react'

import { getContainingView, getEnv, getSession } from '@jbrowse/core/util'
import { observer } from 'mobx-react'
import { Menu } from '@jbrowse/core/ui'
import { useTheme } from '@mui/material'
import { getRpcSessionId } from '@jbrowse/core/util/tracks'

import YScaleBars from './YScaleBars'
import Crosshairs from './Crosshairs'
import MAFTooltip from './MAFTooltip'

import type { LinearMafDisplayModel } from '../stateModel'
import type { LinearGenomeViewModel } from '@jbrowse/plugin-linear-genome-view'

const LinearMafDisplay = observer(function (props: {
  model: LinearMafDisplayModel
}) {
  const { model } = props
  const { pluginManager } = getEnv(model)
  const { rowHeight, height, scrollTop, samples: sources } = model
  const ref = useRef<HTMLDivElement>(null)
  const theme = useTheme()

  const LinearGenomePlugin = pluginManager.getPlugin(
    'LinearGenomeViewPlugin',
  ) as import('@jbrowse/plugin-linear-genome-view').default
  const { BaseLinearDisplayComponent } = LinearGenomePlugin.exports

  const [mouseY, setMouseY] = useState<number>()
  const [mouseX, setMouseX] = useState<number>()
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState<number>()
  const [dragStartY, setDragStartY] = useState<number>()
  const [dragEndX, setDragEndX] = useState<number>()
  const [dragEndY, setDragEndY] = useState<number>()
  const [contextCoord, setContextCoord] = useState<{
    coord: [number, number]
    dragStartX: number
    dragEndX: number
  }>()
  const { width } = getContainingView(model) as LinearGenomeViewModel

  const handleMouseDown = (event: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    const top = rect?.top || 0
    const left = rect?.left || 0
    const clientX = event.clientX - left
    const clientY = event.clientY - top

    setIsDragging(true)
    setDragStartX(clientX)
    setDragStartY(clientY)
    setDragEndX(clientX)
    setDragEndY(clientY)
    event.stopPropagation()
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    const top = rect?.top || 0
    const left = rect?.left || 0
    const clientX = event.clientX - left
    const clientY = event.clientY - top

    setMouseY(clientY)
    setMouseX(clientX)

    if (isDragging) {
      setDragEndX(clientX)
      setDragEndY(clientY)
    }
  }

  const handleMouseUp = (event: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    const top = rect?.top || 0
    const left = rect?.left || 0
    const relX = event.clientX - left
    const relY = event.clientY - top

    if (isDragging && dragStartX !== undefined && dragEndX !== undefined) {
      const containingView = getContainingView(model) as LinearGenomeViewModel
      // Convert drag start and end positions to base pairs
      const startBp = containingView.pxToBp(dragStartX)
      const endBp = containingView.pxToBp(dragEndX)

      console.log('Drag coordinates in bp:', { startBp, endBp })
      // You can add additional logic here to use these coordinates
      setContextCoord({
        coord: [event.clientX, event.clientY],
        dragEndX: event.clientX!,
        dragStartX: dragStartX!,
      })
    }

    setIsDragging(false)
    setDragStartX(undefined)
    setDragStartY(undefined)
    setDragEndX(undefined)
    setDragEndY(undefined)
  }

  const handleCopySequence = async () => {
    try {
      if (!contextCoord) {
        return
      }
      const { rpcManager } = getSession(model)
      const sessionId = getRpcSessionId(model)
      const view = getContainingView(model) as LinearGenomeViewModel
      const refName = view.displayedRegions[0]!.refName
      const x1 = view.pxToBp(contextCoord.dragStartX)
      const x2 = view.pxToBp(contextCoord.dragEndX)
      const currentRegion = {
        refName,
        start: x1.coord,
        end: x2.coord,
        assemblyName: x1.assemblyName,
      }
      console.log({ currentRegion })

      if (currentRegion) {
        const fastaSequence = await rpcManager.call(
          sessionId,
          'MafGetSequences',
          {
            sessionId,
            adapterConfig: model.adapterConfig,
            regions: [currentRegion],
            bpPerPx: view.bpPerPx,
          },
        )

        // Copy to clipboard
        await navigator.clipboard.writeText(fastaSequence as string)
        getSession(model).notify('Sequence copied to clipboard')
      }
    } catch (e) {
      console.error(e)
      getSession(model).notifyError(`${e}`, e)
    }

    // Close the context menu
    setContextCoord(undefined)
  }

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setMouseY(undefined)
        setMouseX(undefined)
        setIsDragging(false)
      }}
    >
      <BaseLinearDisplayComponent {...props} />
      <YScaleBars model={model} />
      {mouseY && sources ? (
        <div style={{ position: 'relative' }}>
          <Crosshairs
            width={width}
            height={height}
            scrollTop={scrollTop}
            mouseX={mouseX}
            mouseY={mouseY}
          />
          <MAFTooltip mouseY={mouseY} rowHeight={rowHeight} sources={sources} />
        </div>
      ) : null}
      {isDragging &&
      dragStartX !== undefined &&
      dragStartY !== undefined &&
      dragEndX !== undefined &&
      dragEndY !== undefined ? (
        <div
          style={{
            position: 'absolute',
            left: Math.min(dragStartX, dragEndX),
            top: Math.min(dragStartY, dragEndY),
            width: Math.abs(dragEndX - dragStartX),
            height: Math.abs(dragEndY - dragStartY),
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            border: '1px solid rgba(0, 0, 255, 0.5)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <Menu
        open={Boolean(contextCoord)}
        onMenuItemClick={(_, callback) => {
          callback()
          setContextCoord(undefined)
        }}
        onClose={() => {
          setContextCoord(undefined)
        }}
        slotProps={{
          transition: {
            onExit: () => {
              setContextCoord(undefined)
            },
          },
        }}
        anchorReference="anchorPosition"
        anchorPosition={
          contextCoord
            ? { top: contextCoord.coord[1], left: contextCoord.coord[0] }
            : undefined
        }
        style={{
          zIndex: theme.zIndex.tooltip,
        }}
        menuItems={[
          {
            label: 'Copy sequence',
            onClick: handleCopySequence,
          },
        ]}
      />
    </div>
  )
})

export default LinearMafDisplay
