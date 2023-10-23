import { ConfigurationSchema } from '@jbrowse/core/configuration'

/**
 * #config MafTabixAdapter
 * used to configure MafTabix adapter
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

const configSchema = ConfigurationSchema(
  'MafTabixAdapter',
  {
    /**
     * #slot
     */
    samples: {
      type: 'stringArray',
      defaultValue: [],
    },
    /**
     * #slot
     */
    bedGzLocation: {
      type: 'fileLocation',
      defaultValue: {
        uri: '/path/to/my.bed.gz.tbi',
        locationType: 'UriLocation',
      },
    },
    index: ConfigurationSchema('Index', {
      location: {
        type: 'fileLocation',
        defaultValue: {
          uri: '/path/to/my.bed.gz.tbi',
        },
      },
      indexType: {
        type: 'string',
        defaultValue: 'TBI',
      },
    }),
  },
  { explicitlyTyped: true },
)

export default configSchema
