import React, { useEffect, useRef, useState } from 'react'

import { Menu } from '@jbrowse/core/ui'
import { getContainingView, getEnv, getSession } from '@jbrowse/core/util'
import { getRpcSessionId } from '@jbrowse/core/util/tracks'
import { useTheme } from '@mui/material'
import { observer } from 'mobx-react'

import Crosshairs from './Crosshairs'
import MAFTooltip from './MAFTooltip'
import SequenceDialog from './SequenceDialog/index'
import YScaleBars from './YScaleBars'

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
  const [showSelectionBox, setShowSelectionBox] = useState(false)
  const [contextCoord, setContextCoord] = useState<{
    coord: [number, number]
    dragStartX: number
    dragEndX: number
  }>()
  const [showSequenceDialog, setShowSequenceDialog] = useState(false)
  const [sequenceData, setSequenceData] = useState('')
  const { width } = getContainingView(model) as LinearGenomeViewModel

  const handleMouseDown = (event: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    const top = rect?.top || 0
    const left = rect?.left || 0
    const clientX = event.clientX - left
    const clientY = event.clientY - top

    // Clear the previous selection box when starting a new drag
    setShowSelectionBox(false)
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
    if (isDragging && dragStartX !== undefined && dragEndX !== undefined) {
      // Calculate the drag distance
      const dragDistanceX = Math.abs(dragEndX - dragStartX)
      const dragDistanceY = Math.abs(dragEndY! - dragStartY!)

      // Only show context menu if the drag distance is at least 2 pixels in either direction
      if (dragDistanceX >= 2 || dragDistanceY >= 2) {
        setContextCoord({
          coord: [event.clientX, event.clientY],
          dragEndX: event.clientX,
          dragStartX: dragStartX,
        })

        // Set showSelectionBox to true to keep the selection visible
        setShowSelectionBox(true)
      } else {
        // For very small drags (less than 2px), don't show selection box or context menu
        clearSelectionBox()
      }
    }

    // Only set isDragging to false, but keep the coordinates
    setIsDragging(false)
  }

  // Function to clear the selection box
  const clearSelectionBox = () => {
    setShowSelectionBox(false)
    setDragStartX(undefined)
    setDragStartY(undefined)
    setDragEndX(undefined)
    setDragEndY(undefined)
  }

  // Add keydown event handler to clear selection box when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSelectionBox) {
        clearSelectionBox()
      }
    }

    // Add click handler to clear selection box when clicking outside of it
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        showSelectionBox
      ) {
        clearSelectionBox()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showSelectionBox, clearSelectionBox])

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={() => {
        // Clear selection box on double click
        if (showSelectionBox) {
          clearSelectionBox()
        }
      }}
      onMouseLeave={() => {
        setMouseY(undefined)
        setMouseX(undefined)
        setIsDragging(false)
      }}
    >
      <BaseLinearDisplayComponent {...props} />
      <YScaleBars model={model} />
      {mouseY && mouseX && sources && !contextCoord ? (
        <div style={{ position: 'relative' }}>
          <Crosshairs
            width={width}
            height={height}
            scrollTop={scrollTop}
            mouseX={mouseX}
            mouseY={mouseY}
          />
          <MAFTooltip
            model={model}
            mouseX={mouseX}
            mouseY={mouseY}
            rowHeight={rowHeight}
            sources={sources}
          />
        </div>
      ) : null}
      {(isDragging || showSelectionBox) &&
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
            label: 'View subsequence',
            onClick: () => {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              ;(async () => {
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

                  const fastaSequence = await rpcManager.call(
                    sessionId,
                    'MafGetSequences',
                    {
                      sessionId,
                      adapterConfig: model.adapterConfig,
                      regions: [
                        {
                          refName,
                          start: x1.coord,
                          end: x2.coord,
                          assemblyName: x1.assemblyName,
                        },
                      ],
                      bpPerPx: view.bpPerPx,
                    },
                  )

                  // Set the sequence data and show the dialog
                  setSequenceData(fastaSequence as string)
                  setShowSequenceDialog(true)
                } catch (e) {
                  console.error(e)
                  getSession(model).notifyError(`${e}`, e)
                }

                // Close the context menu
                setContextCoord(undefined)
              })()
            },
          },
        ]}
      />

      {showSequenceDialog ? (
        <SequenceDialog
          sequenceData={sequenceData}
          model={model}
          onClose={() => {
            setShowSequenceDialog(false)
          }}
        />
      ) : null}
    </div>
  )
})

export default LinearMafDisplay
