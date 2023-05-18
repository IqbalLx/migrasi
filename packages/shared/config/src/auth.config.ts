import { readenv } from '@migrasi/shared/utils';

export class AuthConfig {
  static get secret() {
    return readenv('AUTH_SECRET');
  }
  static get expireInDay() {
    return Number(readenv('AUTH_EXPIRE_IN_DAY', '30'));
  }
}
