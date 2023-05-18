import { AuthConfig } from './src/auth.config';
import { DatabaseConfig } from './src/database.config';

export const Config = {
  auth: AuthConfig,
  database: DatabaseConfig,
};

export type Config = typeof Config;
