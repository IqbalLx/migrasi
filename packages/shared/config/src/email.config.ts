import { ConfigKey, readenv, validateenv } from '@migrasi/shared/utils';
import { BaseConfig } from './base.config';

export class EmailConfig extends BaseConfig {
  constructor(
    keys: ConfigKey = {
      provider: {
        envKey: 'EMAIL_PROVIDER',
        default: 'ethereal',
      },
      sendindblueHost: {
        envKey: 'SENDINBLUE_EMAIL_HOST',
      },
      sendindbluePort: {
        envKey: 'SENDINBLUE_EMAIL_PORT',
        default: '587',
      },
      sendindblueUser: {
        envKey: 'SENDINBLUE_EMAIL_USER',
      },
      sendindbluePassword: {
        envKey: 'SENDINBLUE_EMAIL_PASSWORD',
      },
    }
  ) {
    super(keys);
  }

  override validate() {
    Object.keys(this.keys).forEach((k) => {
      if (k.startsWith(this.provider)) return validateenv(this.keys[k]);

      return;
    });
  }

  get provider() {
    return readenv(this.keys['provider']);
  }
  get sendindblueHost() {
    return readenv(this.keys['sendindblueHost']);
  }
  get sendindbluePort() {
    return Number(readenv(this.keys['sendindbluePort']));
  }
  get sendindblueUser() {
    return readenv(this.keys['sendindblueUser']);
  }
  get sendindbluePassword() {
    return readenv(this.keys['sendindbluePassword']);
  }
}
