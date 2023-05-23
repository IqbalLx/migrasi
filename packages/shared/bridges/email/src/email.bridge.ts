import { EventEmitter } from 'tseep';

import { MailContent } from '@migrasi/shared/entities';
import { emailService } from '@migrasi/third-parties/email';

export type EmailBridge = EventEmitter<{
  send: (to: string, content: MailContent) => Promise<void>;
}>;

const emailBridge: EmailBridge = new EventEmitter();

// mapping bidge event to actual service
emailBridge.on('send', (to, content) => emailService.send(to, content));

export { emailBridge };
