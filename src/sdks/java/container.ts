const path = require("path");
import { Wait } from 'testcontainers';
import { SDKDockerfileContainer, SDKOptions } from '../../lib/SDKContainers';

export function create(options: SDKOptions) {
  const buildContext = path.resolve(__dirname, '.');
  return new SDKDockerfileContainer(buildContext, 5100, options, {
    waitStrategy: Wait.forLogMessage(/Started Application in [0-9*|\.]+ seconds/)
  })
}