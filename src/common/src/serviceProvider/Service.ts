/**
 * A type representing a service class constructor
 */
export type Service = abstract new (...args: unknown[] | []) => unknown;
