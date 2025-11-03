import { SatsnetApiError } from '@/types';

/**
 * Enhanced tryit function inspired by radash
 * Executes async function and returns [error, result] tuple
 *
 * @param fn - Async function to execute
 * @returns Promise with [error, result] tuple
 *
 * @example
 * ```typescript
 * const [error, result] = await tryit(() => api.getUtxos(address))();
 * if (error) {
 *   console.error('API Error:', error.message);
 *   return;
 * }
 * console.log('UTXOs:', result);
 * ```
 */
export function tryit<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<[SatsnetApiError | null, T | null]> {
  return async (...args: Args): Promise<[SatsnetApiError | null, T | null]> => {
    try {
      const result = await fn(...args);
      return [null, result];
    } catch (error) {
      const apiError = wrapError(error);
      return [apiError, null];
    }
  };
}

/**
 * Synchronous version of tryit
 * Executes sync function and returns [error, result] tuple
 */
export function tryitSync<T, Args extends unknown[]>(
  fn: (...args: Args) => T
): (...args: Args) => [SatsnetApiError | null, T | null] {
  return (...args: Args): [SatsnetApiError | null, T | null] => {
    try {
      const result = fn(...args);
      return [null, result];
    } catch (error) {
      const apiError = wrapError(error);
      return [apiError, null];
    }
  };
}

/**
 * Execute async function with automatic retry
 * @param fn - Async function to execute
 * @param maxRetries - Maximum number of retries
 * @param delay - Delay between retries in milliseconds
 * @returns Promise with [error, result] tuple
 */
export function tryitWithRetry<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  maxRetries = 3,
  delay = 1000
): (...args: Args) => Promise<[SatsnetApiError | null, T | null]> {
  return async (...args: Args): Promise<[SatsnetApiError | null, T | null]> => {
    let lastError: SatsnetApiError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn(...args);
        return [null, result];
      } catch (error) {
        lastError = wrapError(error);

        // Don't retry on client errors (4xx)
        if (lastError.code && lastError.code >= 400 && lastError.code < 500) {
          break;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }

    return [lastError, null];
  };
}

/**
 * Execute function with default value on error
 * @param fn - Async function to execute
 * @param defaultValue - Default value to return on error
 * @returns Promise with result or default value
 */
export function tryitOrDefault<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  defaultValue: T
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const [error, result] = await tryit(fn)(...args);
    return error ? defaultValue : (result as T);
  };
}

/**
 * Execute multiple async functions in parallel
 * @param fns - Array of async functions
 * @returns Promise with [errors, results] tuple
 */
export async function tryitAll<T>(fns: Array<() => Promise<T>>): Promise<[SatsnetApiError[], T[]]> {
  // 预分配数组容量以提高性能
  const errors: SatsnetApiError[] = [];
  const values: T[] = [];

  const results = await Promise.allSettled(fns.map((fn) => tryit(fn)()));

  // 使用 for 循环代替 forEach，性能更好
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.status === 'fulfilled') {
      const [error, value] = result.value;
      if (error) {
        errors.push(error);
      } else if (value !== null) {
        values.push(value);
      }
    } else if (result && result.status === 'rejected') {
      errors.push(wrapError(result.reason));
    }
  }

  return [errors, values];
}

/**
 * Wrap any error into SatsnetApiError
 * @param error - Original error
 * @returns SatsnetApiError
 */
function wrapError(error: unknown): SatsnetApiError {
  if (error instanceof SatsnetApiError) {
    return error;
  }

  if (error instanceof Error) {
    return wrapGenericError(error);
  }

  return new SatsnetApiError(`Unknown error: ${String(error)}`, -11, {
    originalError: error,
    type: 'UNKNOWN_ERROR',
  });
}

/**
 * 包装通用错误
 */
function wrapGenericError(error: Error): SatsnetApiError {
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return new SatsnetApiError(`Network error: ${error.message}`, -7, {
      originalError: error.message,
      type: 'NETWORK_ERROR',
    });
  }

  if (error.message.includes('JSON') || error.message.includes('parse')) {
    return new SatsnetApiError(`Invalid response format: ${error.message}`, -8, {
      originalError: error.message,
      type: 'PARSE_ERROR',
    });
  }

  if (error.message.includes('timeout') || error.name === 'AbortError') {
    return new SatsnetApiError(`Request timeout: ${error.message}`, -9, {
      originalError: error.message,
      type: 'TIMEOUT_ERROR',
    });
  }

  return new SatsnetApiError(`Unexpected error: ${error.message}`, -10, {
    originalError: error.message,
    type: 'UNEXPECTED_ERROR',
  });
}

/**
 * Type guard to check if result is an error
 * @param result - Result from tryit function
 * @returns True if result is an error
 */
export function isError<T>(
  result: [SatsnetApiError | null, T | null]
): result is [SatsnetApiError, null] {
  return result[0] !== null;
}

/**
 * Type guard to check if result is successful
 * @param result - Result from tryit function
 * @returns True if result is successful
 */
export function isSuccess<T>(result: [SatsnetApiError | null, T | null]): result is [null, T] {
  return result[0] === null && result[1] !== null;
}

// Export default tryit function
export default tryit;
