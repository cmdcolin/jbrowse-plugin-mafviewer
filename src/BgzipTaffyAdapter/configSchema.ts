import { ConfigurationSchema } from '@jbrowse/core/configuration'

/**
 * #config BgzipTaffyAdapter
 * used to configure BgzipTaffy adapter
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

const configSchema = ConfigurationSchema(
  'BgzipTaffyAdapter',
  {
    /**
     * #slot
     */
    samples: {
      type: 'frozen',
      description: 'string[] or {id:string,label:string,color?:string}[]',
      defaultValue: [],
    },
    /**
     * #slot
     */
    tafGzLocation: {
      type: 'fileLocation',
      defaultValue: {
        uri: '/path/to/my.taf',
        locationType: 'UriLocation',
      },
    },
    /**
     * #slot
     */
    taiLocation: {
      type: 'fileLocation',
      defaultValue: {
        uri: '/path/to/my.taf.gz.tai',
        locationType: 'UriLocation',
      },
    },
  },
  { explicitlyTyped: true },
)

export default configSchema
