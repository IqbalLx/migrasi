import { ConfigKey, readenv } from '@migrasi/shared/utils';
import { BaseConfig } from './base.config';
import { homedir } from 'os';

export class CLIConfig extends BaseConfig {
  constructor(
    keys: ConfigKey = {
      basedir: {
        envKey: 'CLI_BASE_DIR',
        default: `${homedir()}/.migrasi`,
      },
      configName: {
        envKey: 'CLI_CONFIG_NAME',
        default: 'config.yaml',
      },
    }
  ) {
    super(keys);
  }

  get basedir() {
    return readenv(this.keys['basedir']);
  }

  get configName() {
    return readenv(this.keys['configName']);
  }
}
