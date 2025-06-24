import { DomainObject } from 'domain-objects';

import { CanNotReferenceDeclaredResourceClassError } from './buildReferenceTo';
import {
  CanNotReferenceDeclaredResourceError,
  getReferenceTo,
} from './getReferenceTo';

// todo: remove the declastruct references in favor of domain-object references
describe.skip('getReferenceTo', () => {
  it('should throw a helpful error if the resource is not an instance of a domain object', () => {
    try {
      getReferenceTo({ name: 'bob', age: 21 });
      throw new Error('should not reach here');
    } catch (error: any) {
      expect(error).toBeInstanceOf(CanNotReferenceDeclaredResourceError);
      expect(error.message).toContain('resource is not an instance of a');
      expect(error).toMatchSnapshot();
    }
  });
  it('should throw a helpful error the class does not have unique key defined', () => {
    interface CNCMachine {
      uuid?: string;
      serialNumber: string;
      size: string;
      location: string;
    }
    class CNCMachine extends DomainObject<CNCMachine> implements CNCMachine {
      public static primary = ['uuid'];
    }
    try {
      getReferenceTo(
        new CNCMachine({
          serialNumber: '821',
          size: 'big',
          location: 'basement',
        }),
      );
      throw new Error('should not reach here');
    } catch (error: any) {
      expect(error).toBeInstanceOf(CanNotReferenceDeclaredResourceClassError);
      expect(error.message).toContain(
        `the static property 'unique' was not defined as an array of strings`,
      );
      expect(error).toMatchSnapshot();
    }
  });
  it('should throw a helpful error the class does not have primary key defined correctly', () => {
    interface CNCMachine {
      uuid?: string;
      serialNumber: string;
      size: string;
      location: string;
    }
    class CNCMachine extends DomainObject<CNCMachine> implements CNCMachine {
      public static primary = 'uuid';
    }
    try {
      getReferenceTo(
        new CNCMachine({
          serialNumber: '821',
          size: 'big',
          location: 'basement',
        }),
      );
      throw new Error('should not reach here');
    } catch (error: any) {
      expect(error).toBeInstanceOf(CanNotReferenceDeclaredResourceError);
      expect(error.message).toContain(
        `the static property 'primary' was not defined as an array of strings`,
      );
      expect(error).toMatchSnapshot();
    }
  });
  it('should be able to reference by unique key', () => {
    interface CNCMachine {
      uuid?: string;
      serialNumber: string;
      size: string;
      location: string;
    }
    class CNCMachine extends DomainObject<CNCMachine> implements CNCMachine {
      public static primary = ['uuid'];
      public static unique = ['serialNumber'];
    }
    const reference = getReferenceTo(
      new CNCMachine({
        serialNumber: '821',
        size: 'big',
        location: 'basement',
      }),
    );
    expect(reference).toEqual({
      referenceOf: 'CNCMachine',
      identifiedBy: {
        key: 'UNIQUE_KEY',
        value: { serialNumber: '821' },
      },
    });
    expect(reference).toMatchSnapshot(); // log for viewing
  });
  it('should reference by primary key if posible', () => {
    interface CNCMachine {
      uuid?: string;
      serialNumber: string;
      size: string;
      location: string;
    }
    class CNCMachine extends DomainObject<CNCMachine> implements CNCMachine {
      public static primary = ['uuid'];
      public static unique = ['serialNumber'];
    }
    const reference = getReferenceTo(
      new CNCMachine({
        uuid: 'de0e34ca-ce61-4884-ace5-093a1a32ff92',
        serialNumber: '821',
        size: 'big',
        location: 'basement',
      }),
    );
    expect(reference).toEqual({
      referenceOf: 'CNCMachine',
      identifiedBy: {
        key: 'PRIMARY_KEY',
        value: { uuid: 'de0e34ca-ce61-4884-ace5-093a1a32ff92' },
      },
    });
    expect(reference).toMatchSnapshot(); // log for viewing
  });
});
