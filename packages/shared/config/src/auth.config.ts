import { ConfigKey, readenv } from '@migrasi/shared/utils';
import { BaseConfig } from './base.config';

export class AuthConfig extends BaseConfig {
  constructor(
    keys: ConfigKey = {
      authSecret: {
        envKey: 'AUTH_SECRET',
      },
      authExpireInDay: {
        envKey: 'AUTH_EXPIRE_IN_DAY',
        default: '30',
      },
    }
  ) {
    super(keys);
  }

  get secret() {
    return readenv(this.keys['authSecret']);
  }

  get expireInDay() {
    return Number(readenv(this.keys['authExpireInDay']));
  }
}
