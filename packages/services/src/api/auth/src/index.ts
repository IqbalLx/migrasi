import { Config } from '@migrasi/shared/config';
import { AuthService } from './impl/auth.service';
import { AuthRepository } from './impl/auth.repository';
import { db } from '@migrasi/shared/database';
import { AuthValidator } from './impl/auth.validator';

Config.auth.validate();

const authRepo = new AuthRepository(db);
const authValidator = new AuthValidator(authRepo);
export const authService = new AuthService(
  Config.auth,
  authRepo,
  authValidator
);

export * from './auth.interface';
