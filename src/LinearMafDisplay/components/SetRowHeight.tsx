import React, { useState } from 'react'

import { Dialog } from '@jbrowse/core/ui'
import {
  Button,
  DialogActions,
  DialogContent,
  TextField,
  Typography,
} from '@mui/material'
import { observer } from 'mobx-react'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()({
  root: {
    width: 500,
  },
})

const SetRowHeightDialog = observer(function (props: {
  model: {
    rowHeight?: number
    rowProportion?: number
    setRowHeight: (arg: number) => void
    setRowProportion: (arg: number) => void
  }
  handleClose: () => void
}) {
  const { model, handleClose } = props
  const { classes } = useStyles()
  const [rowHeight, setRowHeight] = useState(`${model.rowHeight}`)
  const [rowProportion, setRowProportion] = useState(`${model.rowProportion}`)

  return (
    <Dialog open onClose={handleClose} title="Filter options">
      <DialogContent className={classes.root}>
        <Typography>
          Set row height and the proportion of the row height to use for drawing
          each row
        </Typography>
        <TextField
          value={rowHeight}
          helperText="Enter row height"
          onChange={event => {
            setRowHeight(event.target.value)
          }}
        />
        <TextField
          value={rowProportion}
          helperText="Enter row proportion"
          onChange={event => {
            setRowProportion(event.target.value)
          }}
        />
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            autoFocus
            onClick={() => {
              model.setRowProportion(+rowProportion)
              model.setRowHeight(+rowHeight)
              handleClose()
            }}
          >
            Submit
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              handleClose()
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
})
export default SetRowHeightDialog
