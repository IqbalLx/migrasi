import { AuthConfig } from './src/auth.config';
import { DatabaseConfig } from './src/database.config';

export const Config = {
  auth: new AuthConfig(),
  database: new DatabaseConfig(),
};

export type Config = typeof Config;
