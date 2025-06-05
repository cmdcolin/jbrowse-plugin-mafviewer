import { getContainingView, getSession } from '@jbrowse/core/util'
import { getRpcSessionId } from '@jbrowse/core/util/tracks'
import type { LinearGenomeViewModel } from '@jbrowse/plugin-linear-genome-view'
import type { LinearMafDisplayModel } from '../LinearMafDisplay/stateModel'

/**
 * Fetch sequences for the given selection coordinates
 * @param model - The LinearMafDisplayModel
 * @param selectionCoords - The selection coordinates (dragStartX and dragEndX)
 * @returns Promise that resolves to the FASTA sequence
 */
export async function fetchSequences({
  model,
  selectionCoords,
}: {
  model: LinearMafDisplayModel
  selectionCoords: {
    dragStartX: number
    dragEndX: number
  }
}): Promise<string> {
  const { samples, adapterConfig } = model
  const { rpcManager } = getSession(model)
  const sessionId = getRpcSessionId(model)
  const view = getContainingView(model) as LinearGenomeViewModel
  const { refName, assemblyName } = view.displayedRegions[0]!
  const { dragStartX, dragEndX } = selectionCoords
  const [s, e] = [
    Math.min(dragStartX, dragEndX),
    Math.max(dragStartX, dragEndX),
  ]

  const fastaSequence = await rpcManager.call(sessionId, 'MafGetSequences', {
    sessionId,
    adapterConfig,
    samples,
    regions: [
      {
        refName,
        start: view.pxToBp(s).coord,
        end: view.pxToBp(e).coord,
        assemblyName,
      },
    ],
  })

  return fastaSequence as string
}
