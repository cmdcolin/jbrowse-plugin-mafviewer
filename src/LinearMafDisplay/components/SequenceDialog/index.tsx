import React, { useEffect, useState } from 'react'

import { Dialog, ErrorMessage, LoadingEllipses } from '@jbrowse/core/ui'
import { getContainingView, getSession } from '@jbrowse/core/util'
import { getRpcSessionId } from '@jbrowse/core/util/tracks'
import { Button, DialogActions, DialogContent, TextField } from '@mui/material'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

import type { LinearMafDisplayModel } from '../../stateModel'
import type { LinearGenomeViewModel } from '@jbrowse/plugin-linear-genome-view'

const useStyles = makeStyles()({
  dialogContent: {
    width: '80em',
  },
  textAreaInput: {
    fontFamily: 'Courier New',
    whiteSpace: 'pre',
    overflowX: 'auto',
  },
  ml: {
    marginLeft: 10,
  },
})

const SequenceDialog = observer(function ({
  onClose,
  model,
  selectionCoords,
}: {
  onClose: () => void
  model: LinearMafDisplayModel
  selectionCoords?: {
    dragStartX: number
    dragEndX: number
  }
}) {
  const { samples } = model
  const [sequence, setSequence] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const sequenceTooLarge = sequence ? sequence.length > 1_000_000 : false
  const { classes } = useStyles()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      if (!selectionCoords) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { rpcManager } = getSession(model)
        const sessionId = getRpcSessionId(model)
        const view = getContainingView(model) as LinearGenomeViewModel
        const { refName, assemblyName } = view.displayedRegions[0]!
        const { dragStartX, dragEndX } = selectionCoords
        const [s, e] = [
          Math.min(dragStartX, dragEndX),
          Math.max(dragStartX, dragEndX),
        ]

        const fastaSequence = await rpcManager.call(
          sessionId,
          'MafGetSequences',
          {
            sessionId,
            adapterConfig: model.adapterConfig,
            regions: [
              {
                refName,
                start: view.pxToBp(s).coord,
                end: view.pxToBp(e).coord,
                assemblyName,
              },
            ],
            bpPerPx: view.bpPerPx,
          },
        )

        // Set the sequence data
        setSequence(fastaSequence as string)
      } catch (e) {
        console.error(e)
        setError(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [model, selectionCoords])

  return (
    <Dialog open onClose={onClose} title="Subsequence Data" maxWidth="xl">
      <DialogContent>
        {error ? (
          <ErrorMessage error={error} />
        ) : (
          <>
            {loading ? <LoadingEllipses /> : null}
            <TextField
              variant="outlined"
              multiline
              minRows={5}
              maxRows={10}
              disabled={sequenceTooLarge}
              className={classes.dialogContent}
              fullWidth
              value={
                loading
                  ? 'Loading...'
                  : sequenceTooLarge
                    ? 'Reference sequence too large to display, use the download FASTA button'
                    : sequence
              }
              slotProps={{
                input: {
                  readOnly: true,
                  classes: {
                    input: classes.textAreaInput,
                  },
                },
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          disabled={loading || !sequence}
          onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            ;(async () => {
              try {
                await navigator.clipboard.writeText(sequence)
                getSession(model).notify('Sequence copied to clipboard', 'info')
              } catch (e) {
                console.error(e)
                getSession(model).notifyError(`${e}`, e)
              }
            })()
          }}
        >
          Copy to Clipboard
        </Button>
        <Button
          variant="contained"
          disabled={loading || !sequence}
          onClick={() => {
            try {
              const url = URL.createObjectURL(
                new Blob([sequence], { type: 'text/plain' }),
              )

              // Create a temporary anchor element
              const a = document.createElement('a')
              a.href = url
              a.download = 'sequence.fasta'

              // Trigger the download
              document.body.append(a)
              a.click()

              // Clean up
              a.remove()
              URL.revokeObjectURL(url)
              getSession(model).notify('Sequence downloaded', 'info')
            } catch (e) {
              console.error(e)
              getSession(model).notifyError(`${e}`, e)
            }
          }}
        >
          Download
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
})

export default SequenceDialog
