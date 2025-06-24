import { DomainObject } from 'domain-objects';

import { DeclaredResourceReference } from '../../../domain/DeclaredResourceReference';
import {
  CanNotReferenceDeclaredResourceClassError,
  buildReferenceTo,
} from './buildReferenceTo';

// todo: remove the declastruct references in favor of domain-object references
describe.skip('getReferenceTo', () => {
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
    type CNCMachineReference = DeclaredResourceReference<
      CNCMachine,
      'uuid',
      'serialNumber'
    >;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ref: CNCMachineReference = buildReferenceTo(
        CNCMachine,
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
    type CNCMachineReference = DeclaredResourceReference<
      CNCMachine,
      'uuid',
      'serialNumber'
    >;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const ref: CNCMachineReference = buildReferenceTo(
        CNCMachine,
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
    type CNCMachineReference = DeclaredResourceReference<
      CNCMachine,
      'uuid',
      'serialNumber'
    >;
    const reference: CNCMachineReference = buildReferenceTo(
      CNCMachine,
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
  it('should be able to reference by primary key', () => {
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
    type CNCMachineReference = DeclaredResourceReference<
      CNCMachine,
      'uuid',
      'serialNumber'
    >;
    const reference: CNCMachineReference = buildReferenceTo(CNCMachine, {
      uuid: '__UUID__',
    });
    expect(reference).toEqual({
      referenceOf: 'CNCMachine',
      identifiedBy: {
        key: 'PRIMARY_KEY',
        value: { uuid: '__UUID__' },
      },
    });
    expect(reference).toMatchSnapshot(); // log for viewing
  });
  it('should reference by unique key if both are available', () => {
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
    type CNCMachineReference = DeclaredResourceReference<
      CNCMachine,
      'uuid',
      'serialNumber'
    >;
    const reference: CNCMachineReference = buildReferenceTo(
      CNCMachine,
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
        key: 'UNIQUE_KEY',
        value: { serialNumber: '821' },
      },
    });
    expect(reference).toMatchSnapshot(); // log for viewing
  });
  it('should be able to instantiate with more specific reference class if one exists', () => {
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
    class CNCMachineReference extends DeclaredResourceReference<
      CNCMachine,
      'uuid',
      'serialNumber'
    > {}
    const reference = buildReferenceTo(
      CNCMachine,
      new CNCMachine({
        uuid: 'de0e34ca-ce61-4884-ace5-093a1a32ff92',
        serialNumber: '821',
        size: 'big',
        location: 'basement',
      }),
      CNCMachineReference,
    );
    expect(reference).toBeInstanceOf(CNCMachineReference);
    expect(reference).toMatchSnapshot(); // log for viewing
  });
});
