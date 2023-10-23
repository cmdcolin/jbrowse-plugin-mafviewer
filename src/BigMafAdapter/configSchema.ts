import { ConfigurationSchema } from '@jbrowse/core/configuration'

/**
 * #config BigMafAdapter
 * used to configure BigMaf adapter
 */
function x() {} // eslint-disable-line @typescript-eslint/no-unused-vars

const configSchema = ConfigurationSchema(
  'BigMafAdapter',
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
    bigBedLocation: {
      type: 'fileLocation',
      defaultValue: {
        uri: '/path/to/my.bb',
        locationType: 'UriLocation',
      },
    },
  },
  { explicitlyTyped: true },
)

export default configSchema
