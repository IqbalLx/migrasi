import { access, constants } from 'fs/promises';

export function checkFileExists(file: string): Promise<boolean> {
  return new Promise((resolve) => {
    access(file, constants.F_OK)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}
