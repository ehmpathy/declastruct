import { DomainLiteral } from 'domain-objects';
import Joi from 'joi';

export enum DeclaredResourceReferenceKeyType {
  PRIMARY_KEY = 'PRIMARY_KEY',
  UNIQUE_KEY = 'UNIQUE_KEY',
}

/**
 * a value that a declared resource reference identifier specifies to identify the resource
 */
export class DeclaredResourceReferenceIdentifierValue<
  V extends Record<string, any>,
> extends DomainLiteral<V> {}

/**
 * an identifier for a declared resource reference
 */
export interface DeclaredResourceReferenceIdentifier<
  KT extends DeclaredResourceReferenceKeyType,
  T,
  K extends keyof T,
> {
  key: KT;
  value: Required<Pick<T, K>>;
}
export class DeclaredResourceReferenceIdentifier<
    KT extends DeclaredResourceReferenceKeyType,
    T,
    K extends keyof T,
  >
  extends DomainLiteral<DeclaredResourceReferenceIdentifier<KT, T, K>>
  implements DeclaredResourceReferenceIdentifier<KT, T, K>
{
  public static nested = { value: DeclaredResourceReferenceIdentifierValue };
}

const schema = Joi.alternatives(
  Joi.object().keys({
    _dobj: Joi.string().optional(), // may be specified if hydrating from serialized form (e.g., a cache)
    referenceOf: Joi.string().required(),
    identifiedBy: Joi.object().keys({
      _dobj: Joi.string().optional(), // may be specified if hydrating from serialized form (e.g., a cache)
      key: Joi.string()
        .valid(...Object.values(DeclaredResourceReferenceKeyType))
        .required(),
      value: Joi.object(),
    }),
  }),
  Joi.string().required(), // alternatively, may be in a string representation if we're displaying a 'grokified' version of the resource (note: this should only occur in internal declastruct usage, so its safe that we allow the type to not match the typescript type in this way)
);

/**
 * a reference to a resource
 * - allows reference by primary key (i.e., can specify just the primary)
 * - allows reference by unique key (i.e., can specify the unique traits of the entity)
 */
export interface DeclaredResourceReference<
  T,
  /**
   * the names of the primary key attributes
   */
  P extends keyof T,
  /**
   * the names of the unique key attributes
   */
  U extends keyof T,
> {
  /**
   * the class.name of the resource being referenced
   */
  referenceOf: string;

  /**
   * the mechanism used to reference
   */
  identifiedBy:
    | {
        key: DeclaredResourceReferenceKeyType.PRIMARY_KEY;
        value: Required<Pick<T, P>>;
      }
    | {
        key: DeclaredResourceReferenceKeyType.UNIQUE_KEY;
        value: Required<Pick<T, U>>;
      };
  // TODO: determine why types dont fit with the below
  //   | DeclaredResourceReferenceIdentifier<
  //       DeclaredResourceReferenceKeyType.PRIMARY_KEY,
  //       T,
  //       P
  //     >
  //   | DeclaredResourceReferenceIdentifier<
  //       DeclaredResourceReferenceKeyType.UNIQUE_KEY,
  //       T,
  //       U
  //     >;
}
export class DeclaredResourceReference<
    T,
    /**
     * the names of the primary key attributes
     */
    P extends keyof T,
    /**
     * the names of the unique key attributes
     */
    U extends keyof T,
  >
  extends DomainLiteral<DeclaredResourceReference<T, P, U>>
  implements DeclaredResourceReference<T, P, U>
{
  public static schema = schema;
  public static nested = {
    identifiedBy: DeclaredResourceReferenceIdentifier,
  };
}
