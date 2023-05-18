import { z } from 'zod';
import { KyselyTableDefault, TableDefault, mapTableDefault } from './common';

const UserEntity = z.object({
  name: z.string().min(2, 'minimum 2 characters'),
  email: z.string().email('correct email is required'),
  password: z.string(),
});
export const User = UserEntity.merge(TableDefault);

export const UserRegister = User.pick({ name: true, email: true }).merge(
  z.object({ password: z.string().min(8, 'minimum 8 characters is required') })
);
export const UserLogin = User.pick({ email: true, password: true });
export const UserToken = User.pick({ id: true });
export const UserDPO = User.omit({ password: true });

export type User = z.infer<typeof User>;
export type UserRegister = z.infer<typeof UserRegister>;
export type UserLogin = z.infer<typeof UserLogin>;
export type UserToken = z.infer<typeof UserToken>;
export type UserDPO = z.infer<typeof UserDPO>;

export type UserTable = KyselyTableDefault & z.infer<typeof UserEntity>;

export class UserMapper {
  static convertToDPO(user: User): UserDPO {
    return {
      name: user.name,
      email: user.email,
      ...mapTableDefault(user),
    };
  }
}
