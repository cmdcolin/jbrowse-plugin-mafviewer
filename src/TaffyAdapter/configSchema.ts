import { ConfigurationSchema } from '@jbrowse/core/configuration'

/**
 * #config TaffyAdapter
 * used to configure Taffy adapter
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

const configSchema = ConfigurationSchema(
  'TaffyAdapter',
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
    tafLocation: {
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
        uri: '/path/to/my.taf.tai',
        locationType: 'UriLocation',
      },
    },
  },
  { explicitlyTyped: true },
)

export default configSchema
