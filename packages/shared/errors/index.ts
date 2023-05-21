import { HTTPError } from '@migrasi/shared/entities';
import { ReasonPhrases, StatusCodes, getReasonPhrase } from 'http-status-codes';

type HTTPErrorInput = {
  code: StatusCodes;
  internal_code?: string;
  reason?: ReasonPhrases;
  message?: string;
  internal_message?: string;
  error?: Error;
};
export type ChildHTTPErrorInput = Partial<HTTPErrorInput>;

export class HTTPException extends Error {
  private error: HTTPError;

  constructor(error: HTTPErrorInput) {
    super(error.message);

    this.error = this.mapToHTTPError(
      error.code,
      error.internal_code,
      error.reason,
      error.message,
      error.internal_message,
      error.error
    );
  }

  private mapToHTTPError(
    code: StatusCodes,
    internal_code?: string,
    reason?: ReasonPhrases,
    message?: string,
    internal_message?: string,
    error?: Error
  ): HTTPError {
    return {
      code,
      internal_code: internal_code,
      reason: reason ?? getReasonPhrase(code),
      message: message ?? getReasonPhrase(code),
      internal_message: internal_message,
      error: error !== undefined ? this.parseStackTrace(error) : null,
    };
  }

  private parseStackTrace(error: Error): string[] | null {
    const stackTrace = error.stack;
    if (stackTrace === undefined) return null;

    const lines = stackTrace.split('\n').map((line) => line.trim());
    return lines;
  }

  getHTTPError(): HTTPError {
    return this.error;
  }
}

export class BadRequestException extends HTTPException {
  constructor(error: ChildHTTPErrorInput) {
    super({
      code: error.code ?? StatusCodes.BAD_REQUEST,
      reason: error.reason ?? ReasonPhrases.BAD_REQUEST,
      message: error.message ?? ReasonPhrases.BAD_REQUEST,
      error: error.error,
    });
  }
}

export class NotFoundException extends HTTPException {
  constructor(error: ChildHTTPErrorInput) {
    super({
      code: error.code ?? StatusCodes.NOT_FOUND,
      reason: error.reason ?? ReasonPhrases.NOT_FOUND,
      message: error.message ?? ReasonPhrases.NOT_FOUND,
      error: error.error,
    });
  }
}

export class UnauthorizedException extends HTTPException {
  constructor(error: ChildHTTPErrorInput) {
    super({
      code: error.code ?? StatusCodes.UNAUTHORIZED,
      reason: error.reason ?? ReasonPhrases.UNAUTHORIZED,
      message: error.message ?? ReasonPhrases.UNAUTHORIZED,
      error: error.error,
    });
  }
}

export class ConflictException extends HTTPException {
  constructor(error: ChildHTTPErrorInput) {
    super({
      code: error.code ?? StatusCodes.CONFLICT,
      reason: error.reason ?? ReasonPhrases.CONFLICT,
      message: error.message ?? ReasonPhrases.CONFLICT,
      error: error.error,
    });
  }
}

export class ForbiddenException extends HTTPException {
  constructor(error: ChildHTTPErrorInput) {
    super({
      code: error.code ?? StatusCodes.FORBIDDEN,
      reason: error.reason ?? ReasonPhrases.FORBIDDEN,
      message: error.message ?? ReasonPhrases.FORBIDDEN,
      error: error.error,
    });
  }
}

export class InternalServerError extends HTTPException {
  constructor(error: ChildHTTPErrorInput) {
    super({
      code: error.code ?? StatusCodes.INTERNAL_SERVER_ERROR,
      reason: error.reason ?? ReasonPhrases.INTERNAL_SERVER_ERROR,
      message: error.message ?? ReasonPhrases.INTERNAL_SERVER_ERROR,
      error: error.error,
    });
  }
}
