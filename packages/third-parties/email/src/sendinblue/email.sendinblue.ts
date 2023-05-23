import { MailContent } from '@migrasi/shared/entities';
import { IEmailService } from '../email.interface';
import { createTransport, type Transporter } from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';

export class SendinblueEmail implements IEmailService {
  static provider = 'sendinblue';
  private SENDER = 'Iqbal Maulana <iqbal@mbts.dev>';

  private transporter: Transporter;
  constructor(transport: SmtpOptions) {
    this.transporter = createTransport(transport);
  }

  async send(to: string, content: MailContent, sendAttempt = 1): Promise<void> {
    if (sendAttempt > 3) return;

    try {
      const res = await this.transporter.sendMail({
        ...content,
        from: this.SENDER,
        to,
      });

      return;
    } catch (error) {
      await new Promise((resolve) =>
        setTimeout(() => resolve(undefined), sendAttempt * 1000)
      );

      return this.send(to, content, sendAttempt + 1);
    }
  }
}
