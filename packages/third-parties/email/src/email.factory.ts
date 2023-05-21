import { IEmailService } from './email.interface';
import { Config } from '@migrasi/shared/config';
import { SendinblueEmail } from './sendinblue/email.sendinblue';
import { EtherealEmail } from './ethereal/email.ethereal';

Config.email.validate();

let emailService: IEmailService;

switch (Config.email.provider) {
  case 'ethereal':
    emailService = new EtherealEmail();
    break;

  case 'sendinblue':
    emailService = new SendinblueEmail({
      host: Config.email.sendindblueHost,
      port: Config.email.sendindbluePort,
      auth: {
        user: Config.email.sendindblueUser,
        pass: Config.email.sendindbluePassword,
      },
      secure: false,
    });
    break;

  default:
    throw new Error('Not implemented yet');
}

export { emailService };
