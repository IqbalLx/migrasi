import { EventEmitter } from 'tseep';

import { emailService } from '@migrasi/third-parties/email';

export type MailContent = {
  subject: string;
  text?: string;
  html?: string;
  priority?: 'high' | 'normal' | 'low';
};

export type EmailBridge = EventEmitter<{
  send: (to: string, content: MailContent) => Promise<void>;
}>;

const emailBridge: EmailBridge = new EventEmitter();

// mapping bidge event to actual service
emailBridge.on('send', (to, content) => emailService.send(to, content));

export { emailBridge };
