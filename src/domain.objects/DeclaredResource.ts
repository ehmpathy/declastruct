import type { DomainEntity } from 'domain-objects';

// biome-ignore lint/suspicious/noExplicitAny: any here to maximize how generic it is
export type DeclaredResource<TShape extends Record<string, any> = any> =
  DomainEntity<TShape>;
