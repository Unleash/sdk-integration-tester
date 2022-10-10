const path = require('path')
import { SDKDockerfileContainer, SDKOptions } from '../../lib/SDKContainers'

export function create(options: SDKOptions) {
  const buildContext = path.resolve(__dirname, '.')
  return new SDKDockerfileContainer(buildContext, 5133, options)
}
