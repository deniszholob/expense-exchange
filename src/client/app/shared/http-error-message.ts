import { HttpErrorResponse } from '@angular/common/http';

// #region Helpers
export function getHttpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const responseMessage = readResponseMessage(error.error);
    const status = error.statusText
      ? `${error.status} ${error.statusText}`
      : String(error.status);
    return responseMessage
      ? `Request failed (${status}): ${responseMessage}`
      : `Request failed (${status}).`;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

function readResponseMessage(response: unknown): string | undefined {
  if (typeof response === 'string' && response.trim()) return response.trim();
  if (
    typeof response !== 'object' ||
    response === null ||
    !('message' in response)
  )
    return undefined;

  const message = response.message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  if (
    Array.isArray(message) &&
    message.every((item: unknown) => typeof item === 'string')
  )
    return message.join('; ');
  return undefined;
}
// #endregion
