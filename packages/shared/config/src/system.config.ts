import { ConfigKey, readenv } from '@migrasi/shared/utils';
import { BaseConfig } from './base.config';

export class SystemConfig extends BaseConfig {
  constructor(
    keys: ConfigKey = {
      mode: {
        envKey: 'MODE',
        default: 'dev',
      },
    }
  ) {
    super(keys);
  }

  get mode() {
    return readenv(this.keys['mode']);
  }

  get baseUrl() {
    switch (this.mode) {
      case 'dev':
        return 'http://localhost:5173';

      case 'prod':
        return 'https://migrasi.mbts.dev';

      default:
        throw new Error('No value matched');
    }
  }
}
