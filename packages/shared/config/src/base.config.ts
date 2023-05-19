import { ConfigKey, validateenv } from '@migrasi/shared/utils';

export class BaseConfig {
  constructor(protected keys: ConfigKey) {}

  // separated validate and read because the read method is lazy-loaded
  // but we still need some mechanism to provide fast feedback by throwing
  // error for missing env ahead of time
  validate() {
    Object.keys(this.keys).forEach((k) => validateenv(this.keys[k]));
  }
}
