import { DomainEntity } from 'domain-objects';
import { given, then, when } from 'test-fns';

import { getDisplayableDiff } from './getDisplayableDiff';

describe('getDisplayableDiff', () => {
  // demo resource for testing
  interface DemoResource {
    id?: string;
    exid: string;
    alpha: string;
    beta: string;
    gamma: string;
  }
  class DemoResource
    extends DomainEntity<DemoResource>
    implements DemoResource
  {
    public static primary = ['id'] as const;
    public static unique = ['exid'] as const;
    public static updatable = ['alpha', 'beta', 'gamma'] as const;
  }

  given('both from and into are null', () => {
    when('getDisplayableDiff is called', () => {
      then('it should return null', () => {
        const result = getDisplayableDiff({ from: null, into: null });
        expect(result).toBeNull();
      });
    });
  });

  given('from is null and into has a value', () => {
    when('getDisplayableDiff is called', () => {
      then('it should return a diff showing all attributes as added', () => {
        const into = new DemoResource({
          exid: 'new-1',
          alpha: 'a',
          beta: 'b',
          gamma: 'g',
        });

        const result = getDisplayableDiff({ from: null, into });

        expect(result).toBeTruthy();
        expect(result).toContain('Desired');
        expect(result).toContain('alpha');
        expect(result).toContain('beta');
        expect(result).toContain('gamma');
      });
    });
  });

  given('from has a value and into is null', () => {
    when('getDisplayableDiff is called', () => {
      then('it should return a diff showing all attributes as removed', () => {
        const from = new DemoResource({
          exid: 'old-1',
          alpha: 'a',
          beta: 'b',
          gamma: 'g',
        });

        const result = getDisplayableDiff({ from, into: null });

        expect(result).toBeTruthy();
        expect(result).toContain('Remote');
        expect(result).toContain('alpha');
        expect(result).toContain('beta');
        expect(result).toContain('gamma');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('from and into are equivalent', () => {
    when('getDisplayableDiff is called', () => {
      then('it should return null', () => {
        const from = new DemoResource({
          exid: 'same-1',
          alpha: 'a',
          beta: 'b',
          gamma: 'g',
        });
        const into = new DemoResource({
          exid: 'same-1',
          alpha: 'a',
          beta: 'b',
          gamma: 'g',
        });

        const result = getDisplayableDiff({ from, into });

        expect(result).toBeNull();
      });
    });
  });

  given('from and into differ', () => {
    when('getDisplayableDiff is called', () => {
      then('it should return a diff showing the changes', () => {
        const from = new DemoResource({
          exid: 'update-1',
          alpha: 'old-alpha',
          beta: 'b',
          gamma: 'g',
        });
        const into = new DemoResource({
          exid: 'update-1',
          alpha: 'new-alpha',
          beta: 'b',
          gamma: 'g',
        });

        const result = getDisplayableDiff({ from, into });

        expect(result).toBeTruthy();
        expect(result).toContain('old-alpha');
        expect(result).toContain('new-alpha');
      });
    });
  });

  given('from and into have keys in different orders', () => {
    // demo resource with explicit key order for testing
    interface OrderedResource {
      id?: string;
      exid: string;
      zulu: string;
      yankee: string;
      xray: string;
    }
    class OrderedResource
      extends DomainEntity<OrderedResource>
      implements OrderedResource
    {
      public static primary = ['id'] as const;
      public static unique = ['exid'] as const;
      public static updatable = ['zulu', 'yankee', 'xray'] as const;
    }

    when('getDisplayableDiff is called', () => {
      then('it should preserve key order from into (desired)', () => {
        // create from with keys that will be in a certain order
        const from = new OrderedResource({
          exid: 'order-test',
          zulu: 'z-old',
          yankee: 'y',
          xray: 'x',
        });

        // create into with keys in reverse alphabetical order: zulu, yankee, xray
        // this is the order we expect in the diff output
        const into = new OrderedResource({
          exid: 'order-test',
          zulu: 'z-new',
          yankee: 'y',
          xray: 'x',
        });

        const result = getDisplayableDiff({ from, into });

        expect(result).toBeTruthy();
        expect(result).toMatchSnapshot();

        // verify key order in output matches into's order (zulu, yankee, xray)
        const zuluIndex = result!.indexOf('"zulu"');
        const yankeeIndex = result!.indexOf('"yankee"');
        const xrayIndex = result!.indexOf('"xray"');

        // into's key order should be preserved: zulu < yankee < xray
        expect(zuluIndex).toBeLessThan(yankeeIndex);
        expect(yankeeIndex).toBeLessThan(xrayIndex);
      });
    });
  });

  given('only readonly metadata differs', () => {
    when('getDisplayableDiff is called', () => {
      then('it should return null since readonly is omitted', () => {
        const from = new DemoResource({
          id: 'db-id-123',
          exid: 'meta-test',
          alpha: 'a',
          beta: 'b',
          gamma: 'g',
        });
        const into = new DemoResource({
          exid: 'meta-test',
          alpha: 'a',
          beta: 'b',
          gamma: 'g',
        });

        const result = getDisplayableDiff({ from, into });

        expect(result).toBeNull();
      });
    });
  });
});
