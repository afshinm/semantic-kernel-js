/**
 * Checks if the provided function is an AsyncGenerator.
 * @param fn The function to check.
 * @returns True if the function is an AsyncGenerator, false otherwise.
 */
export const isAsyncGenerator = <T>(fn: unknown): fn is AsyncGenerator<T> => {
  return (fn as AsyncGenerator<T>)[Symbol.asyncIterator] !== undefined;
};
