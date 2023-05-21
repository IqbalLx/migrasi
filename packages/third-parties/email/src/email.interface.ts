import { MailContent } from '@migrasi/shared/bridges/email';

export interface IEmailService {
  send(to: string, content: MailContent): Promise<void>;
}
