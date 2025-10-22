import { tryit } from 'radash';
import { SatsnetApiError } from '@/types';

/**
 * Enhanced error handler with radash tryit
 * Wraps async functions with consistent error handling
 */
export class ErrorHandler {
  /**
   * Execute async function with error handling
   * @param fn - Async function to execute
   * @returns [error, result] tuple
   */
  static async safeExecute<T>(fn: () => Promise<T>): Promise<[SatsnetApiError | null, T | null]> {
    const [error, result] = await tryit(fn)();

    if (error) {
      const apiError = ErrorHandler.wrapError(error);
      return [apiError, null];
    }

    return [null, result];
  }

  /**
   * Wrap any error into SatsnetApiError
   * @param error - Original error
   * @returns SatsnetApiError
   */
  private static wrapError(error: unknown): SatsnetApiError {
    if (error instanceof SatsnetApiError) {
      return error;
    }

    if (error instanceof Error) {
      // Handle fetch errors
      if (error.message.includes('fetch')) {
        return new SatsnetApiError(`Network error: ${error.message}`, -1, {
          originalError: error.message,
        });
      }

      // Handle JSON parsing errors
      if (error.message.includes('JSON')) {
        return new SatsnetApiError(`Invalid response format: ${error.message}`, -2, {
          originalError: error.message,
        });
      }

      return new SatsnetApiError(`Unexpected error: ${error.message}`, -3, {
        originalError: error.message,
      });
    }

    return new SatsnetApiError(`Unknown error: ${String(error)}`, -4, { originalError: error });
  }
}
