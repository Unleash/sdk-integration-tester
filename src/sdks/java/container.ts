const path = require("path");
import { Wait } from 'testcontainers';
import { RestartMethod } from '../../lib/BaseContainers';
import { SDKDockerfileContainer, SDKOptions } from '../../lib/SDKContainers';

export function create(options: SDKOptions) {
  const buildContext = path.resolve(__dirname, '.');
  return new SDKDockerfileContainer(buildContext, 5100, {
    ...options, 
    // still unclear why but restarting this container results in failure
    restartMethod: RestartMethod.NEW_INSTANCE
  }, {
    // This image does not have wget, curl or nc to run the health check
    waitStrategy: Wait.forLogMessage(/Started Application in [0-9*|\.]+ seconds/)
  })
}