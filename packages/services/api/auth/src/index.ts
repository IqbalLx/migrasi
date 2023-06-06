import { Config } from '@migrasi/shared/config';
import { AuthService } from './impl/auth.service';
import { AuthRepository } from './impl/auth.repository';
import { db } from '@migrasi/shared/database';
import { AuthValidator } from './impl/auth.validator';
import { emailBridge } from '@migrasi/shared/bridges/email';

Config.auth.validate();
Config.system.validate();

const authRepo = new AuthRepository(db);
const authValidator = new AuthValidator(authRepo);
export const authService = new AuthService(
  Config.auth,
  Config.system,
  authRepo,
  authValidator,
  emailBridge
);

export * from './auth.interface';
