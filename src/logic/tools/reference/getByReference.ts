import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import { serialize } from 'domain-objects';
import { createCache } from 'simple-in-memory-cache';
import { VisualogicContext } from 'visualogic';
import { withSimpleCaching } from 'with-simple-caching';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import {
  DeclaredResourceReference,
  DeclaredResourceReferenceKeyType,
} from '../../../domain/DeclaredResourceReference';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { getByReferencedPrimaryKey } from './getByReferencedPrimaryKey';
import { getByReferencedUniqueKey } from './getByReferencedUniqueKey';

export class InvalidReferenceError extends Error {
  constructor({
    reference,
  }: {
    reference: DeclaredResourceReference<any, any, any>;
  }) {
    super(
      `Invalid reference of '${
        reference.referenceOf
      }' detected. Could not find an instance identified by ${JSON.stringify(
        reference.identifiedBy,
      )}`,
    );
  }
}

/**
 * resolves references into the referenced resource
 */
export const getByReference = withSimpleCaching(
  // withLogTrail(
  async <T extends DeclaredResource, P extends keyof T, U extends keyof T>(
    {
      reference,
    }: {
      reference: DeclaredResourceReference<T, P, U>;
    },
    context: DeclastructContext & VisualogicContext,
  ): Promise<Required<T> | null> => {
    // if reference is by primary key, lookup the resource by primary key
    if (
      reference.identifiedBy.key ===
      DeclaredResourceReferenceKeyType.PRIMARY_KEY
    ) {
      return await getByReferencedPrimaryKey<T, P>(
        {
          referenceOf: reference.referenceOf,
          primaryKey: reference.identifiedBy.value,
        },
        context,
      );
    }

    // if reference is by primary key, lookup the resource by primary key
    if (
      reference.identifiedBy.key === DeclaredResourceReferenceKeyType.UNIQUE_KEY
    ) {
      return await getByReferencedUniqueKey<T, U>(
        {
          referenceOf: reference.referenceOf,
          uniqueKey: reference.identifiedBy.value,
        },
        context,
      );
    }

    // otherwise, resource reference was declared incorrectly. this should not happen due to types
    throw new UnexpectedCodePathError(
      'invalid resource reference declaration',
      {
        reference,
      },
    );
  },
  // {
  //   name: getResourceNameFromFileName(__filename),
  // },
  // ),
  {
    cache: createCache({
      expiration: { seconds: 60 }, // cache up to 60 sec. no operation will both .get, .set, and .get again (read-after-write) within 60 sec
    }),
    serialize: {
      key: ({ forInput }) => serialize(forInput[0]), // omit the context
    },
  },
);
