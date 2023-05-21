import { AuthConfig } from './src/auth.config';
import { DatabaseConfig } from './src/database.config';
import { EmailConfig } from './src/email.config';
import { SystemConfig } from './src/system.config';

export const Config = {
  auth: new AuthConfig(),
  database: new DatabaseConfig(),
  email: new EmailConfig(),
  system: new SystemConfig(),
};

export type Config = typeof Config;
