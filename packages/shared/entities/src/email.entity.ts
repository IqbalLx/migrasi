export type MailContent = {
  subject: string;
  text?: string;
  html?: string;
  priority?: 'high' | 'normal' | 'low';
};
