import { access, constants, stat } from 'fs/promises';

export function checkFileExists(file: string): Promise<boolean> {
  return new Promise((resolve) => {
    access(file, constants.F_OK)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

export async function checkFolderExists(folderPath: string) {
  try {
    const stats = await stat(folderPath);
    return stats.isDirectory();
  } catch (error) {
    if ((error as { code: string }).code === 'ENOENT') return false;

    throw error;
  }
}
