import { db } from '@migrasi/shared/database';
import { UserRepository } from './impl/user.repository';
import { UserService } from './impl/user.service';

const userRepo = new UserRepository(db);
export const userService = new UserService(userRepo);

export * from './user.interface';
