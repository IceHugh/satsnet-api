/**
 * tryit 工具函数单元测试
 */

import { describe, expect, it } from 'bun:test';
import { SatsnetApiError } from '@/types';
import {
  isError,
  isSuccess,
  tryit,
  tryitAll,
  tryitOrDefault,
  tryitSync,
  tryitWithRetry,
} from '@/utils/tryit';

describe('tryit', () => {
  it('should handle successful async function', async () => {
    const successFn = async () => 'success';
    const wrappedFn = tryit(successFn);

    const [error, result] = await wrappedFn();

    expect(error).toBeNull();
    expect(result).toBe('success');
  });

  it('should handle failed async function', async () => {
    const errorFn = async () => {
      throw new Error('test error');
    };
    const wrappedFn = tryit(errorFn);

    const [error, result] = await wrappedFn();

    expect(error).toBeInstanceOf(SatsnetApiError);
    expect(result).toBeNull();
    expect(error?.message).toContain('test error');
  });

  it('should handle functions with parameters', async () => {
    const addFn = async (a: number, b: number) => a + b;
    const wrappedFn = tryit(addFn);

    const [error, result] = await wrappedFn(2, 3);

    expect(error).toBeNull();
    expect(result).toBe(5);
  });
});

describe('tryitSync', () => {
  it('should handle successful sync function', () => {
    const successFn = () => 'success';
    const wrappedFn = tryitSync(successFn);

    const [error, result] = wrappedFn();

    expect(error).toBeNull();
    expect(result).toBe('success');
  });

  it('should handle failed sync function', () => {
    const errorFn = () => {
      throw new Error('sync error');
    };
    const wrappedFn = tryitSync(errorFn);

    const [error, result] = wrappedFn();

    expect(error).toBeInstanceOf(SatsnetApiError);
    expect(result).toBeNull();
  });
});

describe('tryitWithRetry', () => {
  it('should succeed on first try', async () => {
    let attempts = 0;
    const successFn = async () => {
      attempts++;
      return 'success';
    };
    const wrappedFn = tryitWithRetry(successFn, 3, 100);

    const [error, result] = await wrappedFn();

    expect(error).toBeNull();
    expect(result).toBe('success');
    expect(attempts).toBe(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    let attempts = 0;
    const eventuallySuccessFn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('temporary failure');
      }
      return 'success after retries';
    };
    const wrappedFn = tryitWithRetry(eventuallySuccessFn, 5, 50);

    const [error, result] = await wrappedFn();

    expect(error).toBeNull();
    expect(result).toBe('success after retries');
    expect(attempts).toBe(3);
  });

  it('should fail after max retries', async () => {
    let attempts = 0;
    const alwaysFailFn = async () => {
      attempts++;
      throw new Error('permanent failure');
    };
    const wrappedFn = tryitWithRetry(alwaysFailFn, 3, 10);

    const [error, result] = await wrappedFn();

    expect(error).toBeInstanceOf(SatsnetApiError);
    expect(result).toBeNull();
    expect(attempts).toBe(3);
  });
});

describe('tryitOrDefault', () => {
  it('should return result on success', async () => {
    const successFn = async () => 'success';
    const wrappedFn = tryitOrDefault(successFn, 'default');

    const result = await wrappedFn();

    expect(result).toBe('success');
  });

  it('should return default value on error', async () => {
    const errorFn = async () => {
      throw new Error('error');
    };
    const wrappedFn = tryitOrDefault(errorFn, 'default');

    const result = await wrappedFn();

    expect(result).toBe('default');
  });
});

describe('tryitAll', () => {
  it('should handle all successful functions', async () => {
    const fns = [async () => 'result1', async () => 'result2', async () => 'result3'];

    const [errors, results] = await tryitAll(fns);

    expect(errors).toHaveLength(0);
    expect(results).toHaveLength(3);
    expect(results).toEqual(['result1', 'result2', 'result3']);
  });

  it('should handle mixed success and failure', async () => {
    const fns = [
      async () => 'result1',
      async () => {
        throw new Error('error2');
      },
      async () => 'result3',
      async () => {
        throw new Error('error4');
      },
    ];

    const [errors, results] = await tryitAll(fns);

    expect(errors).toHaveLength(2);
    expect(results).toHaveLength(2);
    expect(results).toEqual(['result1', 'result3']);
    expect(errors.every((error) => error instanceof SatsnetApiError)).toBe(true);
  });

  it('should handle all failures', async () => {
    const fns = [
      async () => {
        throw new Error('error1');
      },
      async () => {
        throw new Error('error2');
      },
    ];

    const [errors, results] = await tryitAll(fns);

    expect(errors).toHaveLength(2);
    expect(results).toHaveLength(0);
  });
});

describe('isError and isSuccess', () => {
  it('should correctly identify error results', () => {
    const errorResult: [SatsnetApiError, null] = [new SatsnetApiError('test error', 1), null];

    expect(isError(errorResult)).toBe(true);
    expect(isSuccess(errorResult)).toBe(false);
  });

  it('should correctly identify success results', () => {
    const successResult: [null, string] = [null, 'success'];

    expect(isError(successResult)).toBe(false);
    expect(isSuccess(successResult)).toBe(true);
  });

  it('should handle null results', () => {
    const nullResult: [null, null] = [null, null];

    expect(isError(nullResult)).toBe(false);
    expect(isSuccess(nullResult)).toBe(false);
  });
});
