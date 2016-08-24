/**
 * Configuration class
 */
const defaultExpiration = 60 * 60 * 24; // one day
export class RemoteConfig {
  constructor(options) {
    this.config = options || {};

    this.setDefaultRemoteConfig(options)
    .then(() => this.configured = true);
  }

  setDefaultRemoteConfig(options) {
    return promisify('setDefaultRemoteConfig')(options);
  }

  fetchWithExpiration(expirationSeconds=defaultExpiration) {
    return promisify('fetchWithExpiration')(expirationSeconds)
  }

  config(name) {
    return promisify('configValueForKey')(name);
  }

  setDev() {
    return promisify('setDev')();
  }
}

export default RemoteConfig;