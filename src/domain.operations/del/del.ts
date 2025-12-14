import type { DeclaredResource } from '../../domain.objects/DeclaredResource';
import { DECLASTRUCT_DELETE } from '../../domain.objects/symbols';

/**
 * .what = marks a resource for deletion via declarative instruction
 * .why = enables users to express deletion intent
 *
 * .how = attaches a symbol-keyed property to the resource object
 *
 * @example
 * ```ts
 * const getResources = async () => {
 *   const tokens = await getAllIamAuthTokens(...);
 *   return tokens.map(token => del(token)); // mark all for deletion
 * }
 * ```
 */
export const del = <T extends DeclaredResource>(
  resource: T,
): T & { [DECLASTRUCT_DELETE]: true } => {
  return Object.assign(resource, { [DECLASTRUCT_DELETE]: true as const });
};

/**
 * .what = checks if a resource is marked for deletion
 * .why = enables planChanges to detect deletion intent
 * .note = type guard narrows to the marked type for downstream type safety
 */
export const isMarkedForDeletion = <T extends DeclaredResource>(
  resource: T,
): resource is T & { [DECLASTRUCT_DELETE]: true } => {
  // biome-ignore lint/suspicious/noExplicitAny: symbol access requires any cast
  return (resource as any)[DECLASTRUCT_DELETE] === true;
};
