import { DomainObject } from 'domain-objects';

// TODO: improve on the type of "declared resource"
// eslint-disable-next-line @typescript-eslint/ban-types
export type DeclaredResource<R extends Record<string, any> = {}> =
  DomainObject<R>;
