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
      emailConfirmationSecret: {
        envKey: 'AUTH_EMAIL_CONFIRMATION_SECRET',
      },
      emailConfirmationExpireInDay: {
        envKey: 'AUTH_EMAIL_CONFIRMATION_EXPIRE_IN_DAY',
        default: '1',
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

  get emailConfirmationSecret() {
    return readenv(this.keys['emailConfirmationSecret']);
  }

  get emailConfirmationExpireInDay() {
    return Number(readenv(this.keys['emailConfirmationExpireInDay']));
  }
}
