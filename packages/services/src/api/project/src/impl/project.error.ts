import { ChildHTTPErrorInput, NotFoundException } from '@migrasi/shared/errors';

const errorPrefixCode = 'PROJ-';
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
      internal_code: `${errorPrefixCode}-404-${ProjectError[reason]}`,
    });
  }
}
