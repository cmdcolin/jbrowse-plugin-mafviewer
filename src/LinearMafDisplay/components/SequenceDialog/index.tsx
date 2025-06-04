import React from 'react'

import { Dialog } from '@jbrowse/core/ui'
import { getSession } from '@jbrowse/core/util'
import { Button, DialogActions, DialogContent, TextField } from '@mui/material'
import { makeStyles } from 'tss-react/mui'

import type { LinearMafDisplayModel } from '../../stateModel'

interface SequenceDialogProps {
  onClose: () => void
  sequenceData: string
  model: LinearMafDisplayModel
}

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
function SequenceDialog({
  onClose,
  sequenceData: sequence,
  model,
}: SequenceDialogProps) {
  const sequenceTooLarge = sequence ? sequence.length > 1_000_000 : false
  const { classes } = useStyles()

  return (
    <Dialog open onClose={onClose} title="Subsequence Data" maxWidth="xl">
      <DialogContent>
        <TextField
          variant="outlined"
          multiline
          minRows={5}
          maxRows={10}
          disabled={sequenceTooLarge}
          className={classes.dialogContent}
          fullWidth
          value={
            sequenceTooLarge
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
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
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
}

export default SequenceDialog
