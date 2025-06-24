import { DomainObject } from 'domain-objects';

// TODO: improve on the type of "declared resource"
export type DeclaredResource<R extends Record<string, any> = {}> =
  DomainObject<R>;
