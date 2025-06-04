import React from 'react'
import { Dialog } from '@jbrowse/core/ui'
import { Button, DialogActions, DialogContent, TextField } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import { makeStyles } from 'tss-react/mui'
import type { LinearMafDisplayModel } from '../../stateModel'
import { getSession } from '@jbrowse/core/util'

interface SequenceDialogProps {
  onClose: () => void
  sequenceData: string
  model: LinearMafDisplayModel
}

const useStyles = makeStyles()({
  dialogContent: {
    width: '80em',
  },
  textAreaFont: {
    fontFamily: 'Courier New',
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
                input: classes.textAreaFont,
              },
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(sequence)
              getSession(model).notify('Sequence copied to clipboard')
            } catch (e) {
              console.error(e)
              getSession(model).notifyError(`${e}`, e)
            }
          }}
          startIcon={<ContentCopyIcon />}
        >
          Copy to Clipboard
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            try {
              // Create a blob with the sequence data
              const blob = new Blob([sequence], { type: 'text/plain' })

              // Create a URL for the blob
              const url = URL.createObjectURL(blob)

              // Create a temporary anchor element
              const a = document.createElement('a')
              a.href = url
              a.download = 'sequence.fasta'

              // Trigger the download
              document.body.appendChild(a)
              a.click()

              // Clean up
              document.body.removeChild(a)
              URL.revokeObjectURL(url)

              getSession(model).notify('Sequence downloaded')
            } catch (e) {
              console.error(e)
              getSession(model).notifyError(`${e}`, e)
            }
          }}
          startIcon={<DownloadIcon />}
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
