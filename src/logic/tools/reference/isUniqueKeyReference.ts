import {
  DeclaredResourceReference,
  DeclaredResourceReferenceKeyType,
} from '../../../domain/DeclaredResourceReference';

export const isUniqueKeyReference = <
  T,
  /**
   * the names of the primary key attributes
   */
  P extends keyof T,
  /**
   * the names of the unique key attributes
   */
  U extends keyof T,
>(
  ref: DeclaredResourceReference<T, P, U>,
): ref is DeclaredResourceReference<T, P, U> & {
  identifiedBy: { key: DeclaredResourceReferenceKeyType.UNIQUE_KEY };
} => ref.identifiedBy.key === DeclaredResourceReferenceKeyType.UNIQUE_KEY;
