import { MailContent } from '@migrasi/shared/entities';

export interface IEmailService {
  send(to: string, content: MailContent): Promise<void>;
}
