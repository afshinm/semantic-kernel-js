import { JsonSchema } from '@semantic-kernel/ai';
import { type KernelFunction } from './KernelFunction';

type BaseKernelPlugin = {
  name: string;
  description: string;
};

/**
 * ArrayKernelPlugin represents a plugin that contains an array of functions.
 *This type is used in {@link KernelPlugins} to represent a plugin.
 */
type EmptyJsonSchema = {} & JsonSchema;

type ArrayKernelPlugin = BaseKernelPlugin & {
  functions: Array<KernelFunction<unknown, EmptyJsonSchema, unknown>>;
};

export type KernelPlugin = ArrayKernelPlugin;

/**
 * MapKernelPlugin represents a plugin that contains a map of functions.
 * This type is the internal representation of a plugin in {@link KernelPlugins}.
 */
export type MapKernelPlugin = BaseKernelPlugin & {
  functions: Map<string, KernelFunction>;
};
