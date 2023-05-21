import { Context, User, UserToken } from '@migrasi/shared/entities';

import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@migrasi/shared/errors';

import { IAuthRepository } from '../auth.interface';

import { compare } from 'bcrypt';
import { verify, type JwtPayload } from 'jsonwebtoken';

export class AuthValidator {
  constructor(private authRepo: IAuthRepository) {
    this.authRepo = authRepo;
  }

  async validateByEmail(email: string): Promise<User> {
    const user = await this.authRepo.getByEmail(email);
    if (user === undefined)
      throw new UnauthorizedException({ message: 'auth failed' });

    if (!user.email_confirmed)
      throw new ForbiddenException({ message: 'confirm your email first' });

    return user;
  }

  async checkDuplicate(email: string): Promise<void> {
    const isExists = await this.authRepo.checkExistsByEmail(email);
    if (isExists) throw new ForbiddenException({ message: 'auth failed' });
  }

  async validateById(id: string): Promise<User> {
    const user = await this.authRepo.getById(id);
    if (user === undefined)
      throw new NotFoundException({ message: `user with id ${id} not found` });

    return user;
  }

  async validatePassword(plainPassword: string, hashedPassword: string) {
    const isValid = await compare(plainPassword, hashedPassword);
    if (!isValid) throw new UnauthorizedException({ message: 'auth failed' });
  }

  validateToken(token: string, secret: string): string {
    try {
      const tokenPayload = verify(token, secret);

      if (typeof tokenPayload === 'string')
        throw new UnauthorizedException({ message: 'auth failed' });

      const populatedTokenPayload = tokenPayload as JwtPayload & UserToken;
      return populatedTokenPayload.id;
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException({ message: 'auth failed' });
    }
  }

  async validateSession(sessionId: string): Promise<Context> {
    const context = await this.authRepo.getSession(sessionId);

    if (context === undefined)
      throw new UnauthorizedException({ message: 'auth failed' });

    const isEmailConfirmed = await this.authRepo.getUserEmailConfirmationStatus(
      context.user_id
    );
    if (!isEmailConfirmed)
      throw new ForbiddenException({ message: 'confirm your email first' });

    return context;
  }
}
