import { serialize } from 'domain-objects';
import { flattie } from 'flattie';
import { createCache } from 'simple-in-memory-cache';
import { isPresent } from 'type-fns';
import { VisualogicContext } from 'visualogic';
import { withSimpleCaching } from 'with-simple-caching';

import { DeclaredResourceReference } from '../../../domain/DeclaredResourceReference';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { resolveReferenceToCommonComparableForm } from './resolveReferenceToCommonComparableForm';

/**
 * create a string representation of the reference which can be easily and intuitively understood
 *
 * example
 * - name:'default',campaign.name:'abcd',campaign.account.name:'xyz'
 *
 * relevance
 * - references, especially unique references, are difficult to read (lots of nesting and metadata; lots of noise)
 * - we need to be able to display a succinct, easy to read, high signal string for a reference to display in diffs
 */
export const castReferenceToGrokableString = withSimpleCaching(
  async (
    {
      reference,
    }: {
      reference: DeclaredResourceReference<any, any, any>;
    },
    context: DeclastructContext & VisualogicContext,
  ) => {
    // resolve the reference to common-comparable-form, which will resolve all of references into unique keys
    const comparableReference = await resolveReferenceToCommonComparableForm(
      { reference },
      context,
    );

    // now, flatten the reference object (i.e., `{ campaign: { account: { name: 'name' } } }` => `{ campaign.account.name: 'name' }`)
    const flat = flattie(comparableReference);

    // now, remove the noise from the keys
    const highSignalFlat = Object.fromEntries(
      Object.entries(flat)
        .map(([key, value]) => {
          // if the key ends with a metadata attribute, skip it
          if (key.includes('referenceOf')) return null;
          if (key.includes('identifiedBy.key')) return null;

          // otherwise, strip out the metadata parts in the key
          const highSignalKey = key.replace(/identifiedBy.value./g, '');

          // and return the new key value pair
          return [highSignalKey, value];
        })
        .filter(isPresent) // skip the nulls
        .sort((a, b) => {
          // count how many layers away the value is from the root object for each of these keys
          const layersAwayA = a[0].split('.').length;
          const layersAwayB = b[0].split('.').length;

          // sort the keys that are "closer" to the root object first (i.e., things that describe the object directly should go before things that describe a nested reference; that way, the most specific, and least likely to repeat across different resources, attribute is first)
          return layersAwayA < layersAwayB ? -1 : 1;
        }),
    );

    // now, convert that high signal flat object into a string
    const grokableString = [
      reference.referenceOf, // prefixed by what its referencing
      ...Object.entries(highSignalFlat).map(([key, value]) =>
        [
          key,
          JSON.stringify(value)
            .replace(/'/g, "\\'")
            .replace(/^"/g, "'")
            .replace(/"$/g, "'"), // replace the surrounding `"` with `'` for better display in the console (since in console the string is typically already shown inside of `"`, so we get a lot of `\"` otherwise)
        ].join(':'),
      ),
    ].join('.');
    return grokableString;
  },
  {
    cache: createCache({
      expiration: { seconds: 300 }, // todo: set this to "infinite", since grokable references are deterministic; they never change for a given input
    }),
    serialize: {
      key: ({ forInput }) => serialize(forInput[0]), // omit context
    },
  },
);
