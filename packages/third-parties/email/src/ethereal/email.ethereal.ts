import { MailContent } from '@migrasi/shared/entities';
import { IEmailService } from '../email.interface';
import {
  createTransport,
  type Transporter,
  createTestAccount,
} from 'nodemailer';

export class EtherealEmail implements IEmailService {
  static provider = 'ethereal';

  private SENDER = 'Iqbal Test <iqbal@test.id>';
  private transporter: Transporter | undefined;

  private async prepareAccount() {
    const testAccount = await createTestAccount();
    this.transporter = createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.debug('ethereal account created', { testAccount });
  }

  async send(to: string, content: MailContent, sendAttempt = 1): Promise<void> {
    if (sendAttempt > 3) return;

    if (this.transporter === undefined) await this.prepareAccount();

    try {
      const res = await this.transporter?.sendMail({
        ...content,
        from: this.SENDER,
        to,
      });

      console.debug({ res });

      return;
    } catch (error) {
      await new Promise((resolve) =>
        setTimeout(() => resolve(undefined), sendAttempt * 1000)
      );

      return this.send(to, content, sendAttempt + 1);
    }
  }
}
