import React, { useState } from 'react'

import { ErrorMessage, FileSelector } from '@jbrowse/core/ui'
import {
  FileLocation,
  getSession,
  isSessionModelWithWidgets,
  isSessionWithAddTracks,
} from '@jbrowse/core/util'
import { AddTrackModel } from '@jbrowse/plugin-data-management'
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material'
import { getRoot } from 'mobx-state-tree'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(theme => ({
  textbox: {
    width: '100%',
  },
  paper: {
    margin: theme.spacing(),
    padding: theme.spacing(),
  },
  submit: {
    marginTop: 25,
    marginBottom: 100,
    display: 'block',
  },
}))

export default function MultiMAFWidget({ model }: { model: AddTrackModel }) {
  const { classes } = useStyles()
  const [samples, setSamples] = useState('')
  const [loc, setLoc] = useState<FileLocation>()
  const [indexLoc, setIndexLoc] = useState<FileLocation>()
  const [error, setError] = useState<unknown>()
  const [trackName, setTrackName] = useState('MAF track')
  const [fileTypeChoice, setFileTypeChoice] = useState('BigMafAdapter')
  const [indexTypeChoice, setIndexTypeChoice] = useState('TBI')

  const rootModel = getRoot<any>(model)
  return (
    <Paper className={classes.paper}>
      <Paper>
        {error ? <ErrorMessage error={error} /> : null}
        <FormControl>
          <FormLabel>File type</FormLabel>
          <RadioGroup
            value={fileTypeChoice}
            onChange={event => {
              setFileTypeChoice(event.target.value)
            }}
          >
            <FormControlLabel
              value="BigMafAdapter"
              control={<Radio />}
              checked={fileTypeChoice === 'BigMafAdapter'}
              label="bigMaf"
            />
            <FormControlLabel
              value="MafTabixAdapter"
              control={<Radio />}
              checked={fileTypeChoice === 'MafTabixAdapter'}
              label="mafTabix"
            />
          </RadioGroup>
        </FormControl>
        {fileTypeChoice === 'BigMafAdapter' ? (
          <FileSelector
            location={loc}
            name="Path to bigMaf"
            rootModel={rootModel}
            setLocation={arg => {
              setLoc(arg)
            }}
          />
        ) : (
          <>
            <FormControl>
              <FormLabel>Index type</FormLabel>
              <RadioGroup
                value={fileTypeChoice}
                onChange={event => {
                  setIndexTypeChoice(event.target.value)
                }}
              >
                <FormControlLabel
                  value="TBI"
                  control={<Radio />}
                  checked={indexTypeChoice === 'TBI'}
                  label="TBI"
                />
                <FormControlLabel
                  value="CSI"
                  control={<Radio />}
                  checked={indexTypeChoice === 'CSI'}
                  label="CSI"
                />
              </RadioGroup>
            </FormControl>
            <FileSelector
              location={loc}
              name="Path to MAF tabix"
              setLocation={arg => {
                setLoc(arg)
              }}
              rootModel={rootModel}
            />
            <FileSelector
              location={indexLoc}
              name="Path to MAF tabix index"
              setLocation={arg => {
                setIndexLoc(arg)
              }}
              rootModel={rootModel}
            />
          </>
        )}
      </Paper>
      <TextField
        multiline
        rows={10}
        value={samples}
        onChange={event => {
          setSamples(event.target.value)
        }}
        placeholder={
          'Enter sample names from the MAF file, one per line, or JSON formatted array of samples'
        }
        variant="outlined"
        fullWidth
      />

      <TextField
        value={trackName}
        helperText="Track name"
        onChange={event => {
          setTrackName(event.target.value)
        }}
      />
      <Button
        variant="contained"
        className={classes.submit}
        onClick={() => {
          try {
            const session = getSession(model)
            let sampleNames = [] as string[]
            try {
              sampleNames = JSON.parse(samples)
            } catch (e) {
              sampleNames = samples.split(/\n|\r\n|\r/)
            }

            const trackId = [
              `${trackName.toLowerCase().replaceAll(' ', '_')}-${Date.now()}`,
              session.adminMode ? '' : '-sessionTrack',
            ].join('')

            if (isSessionWithAddTracks(session)) {
              session.addTrackConf({
                trackId,
                type: 'MafTrack',
                name: trackName,
                assemblyNames: [model.assembly],
                adapter:
                  fileTypeChoice === 'BigMafAdapter'
                    ? {
                      type: fileTypeChoice,
                      bigBedLocation: loc,
                      samples: sampleNames,
                    }
                    : {
                      type: fileTypeChoice,
                      bedGzLocation: loc,
                      index: {
                        indexType: indexTypeChoice,
                        location: indexLoc,
                      },
                      samples: sampleNames,
                    },
              })

              model.view?.showTrack(trackId)
            }
            model.clearData()
            if (isSessionModelWithWidgets(session)) {
              session.hideWidget(model)
            }
          } catch (e) {
            setError(e)
          }
        }}
      >
        Submit
      </Button>
    </Paper>
  )
}
