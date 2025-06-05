import React, { useEffect, useState } from 'react'

import { Dialog, ErrorMessage, LoadingEllipses } from '@jbrowse/core/ui'
import { getSession } from '@jbrowse/core/util'
import { Button, DialogActions, DialogContent, TextField } from '@mui/material'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

import { fetchSequences } from '../../../util/fetchSequences'
import type { LinearMafDisplayModel } from '../../stateModel'

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
        setError(undefined)

        setSequence(await fetchSequences({ model, selectionCoords }))
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
