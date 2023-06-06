import {
  ChildHTTPErrorInput,
  ForbiddenException,
  NotFoundException,
} from '@migrasi/shared/errors';

const projectErrorPrefixCode = 'PROJ-';
export enum ProjectError {
  NOTFOUND = '01',
  NOTAUTHOR = '02',
  NOTMEMBER = '03',
}
export type ProjectErrorType = keyof typeof ProjectError;

export class ProjectNotFoundException extends NotFoundException {
  constructor(error: ChildHTTPErrorInput, reason: ProjectErrorType) {
    super({
      ...error,
      internal_message: `${error.internal_message}. reason: ${reason}`,
      internal_code: `${projectErrorPrefixCode}-404-${ProjectError[reason]}`,
    });
  }
}

const migrationErrorPrefixCode = 'MIGR';
export enum MigrationError {
  NOTFOUND = '01',
  NOTAUTHOR = '02',
  ALREADYMIGRATED = '03',
}
export type MigrationErrorType = keyof typeof MigrationError;

export class ProjectMigrationNotFoundException extends NotFoundException {
  constructor(error: ChildHTTPErrorInput, reason: MigrationErrorType) {
    super({
      ...error,
      internal_message: `${error.internal_message}. reason: ${reason}`,
      internal_code: `${migrationErrorPrefixCode}-404-${MigrationError[reason]}`,
    });
  }
}

export class ProjectMigrationForbiddenException extends ForbiddenException {
  constructor(error: ChildHTTPErrorInput) {
    super({
      ...error,
      internal_message: `${error.internal_message}. reason: ALREADYMIGRATED`,
      internal_code: `${migrationErrorPrefixCode}-403-${MigrationError['ALREADYMIGRATED']}`,
    });
  }
}
