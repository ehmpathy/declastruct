import { DomainEntity, DomainLiteral } from 'domain-objects';

import { buildRef, getRef } from '../../..';
import {
  CNCMachineReference,
  CNCMachineRegistrationReference,
  getExampleContext,
} from '../../../__test_assets__/getExampleContext';
import { DeclaredResourceReference } from '../../../domain/DeclaredResourceReference';
import { resolveReferencesToCommonComparableForm } from './resolveReferencesToCommonComparableForm';

const {
  exampleContext,
  exampleMachine,
  CNCMachine,
  exampleRegistration,
  CNCMachineRegistration,
} = getExampleContext();

describe('resolveReferencesToCommonComparableForm', () => {
  describe('basic types', () => {
    it('should resolve strings', async () => {
      const original = 'hello!';
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
    it('should resolve numbers', async () => {
      const original = 821;
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });

    // TODO: fix this
    it.skip('should resolve dates', async () => {
      const original = new Date('2020-08-21 00:00:00');
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
    it('should resolve undefined', async () => {
      const original = undefined;
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
    it('should resolve nulls', async () => {
      const original = null;
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });

    // TODO: fix this
    it.skip('should resolve buffers', async () => {
      const original = Buffer.from('821');
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
  });
  describe('arrays', () => {
    it('should be able to resolve arrays', async () => {
      const original = ['821', 721, 'leopard', 7, 'apple', 3];
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
    it('should resolve arrays even if they have objects', async () => {
      const original = [
        'banana',
        { id: 1, value: 821, meaning: 42 },
        821,
        { id: 0, value: undefined, meaning: null }, // should go first, because id is 0
      ];
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
  });
  describe('objects', () => {
    it('should be able to resolve an object with all sorts of types', async () => {
      const original = {
        color: 'blue',
        cost: 821,
        orders: [
          { id: 1, value: 821, meaning: 42 },
          { id: 0, value: undefined, meaning: null },
        ],
        application: {
          type: 'PAINTING',
        },
      };
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
  });
  describe('domain objects', () => {
    // define some domain objects to test with
    interface Spaceship {
      uuid?: string;
      serialNumber: string;
      fuelQuantity: number;
      passengers: number;
    }
    class Spaceship extends DomainEntity<Spaceship> implements Spaceship {
      public static primary = ['uuid'] as const;
      public static unique = ['serialNumber'];
      public static updatable = ['serialNumber'];
    }
    type SpaceshipReference = DeclaredResourceReference<
      Spaceship,
      'uuid',
      'serialNumber'
    >;
    interface Address {
      id?: number;
      galaxy: string;
      solarSystem: string;
      planet: string;
      continent: string;
    }
    class Address extends DomainLiteral<Address> implements Address {}
    interface Spaceport {
      uuid: string;
      address: Address;
      spaceships: SpaceshipReference[];
    }
    class Spaceport extends DomainEntity<Spaceport> implements Spaceport {
      public static primary = ['uuid'] as const;
      public static unique = ['uuid'];
      public static updatable = ['spaceships'];
      public static nested = {
        address: Address,
        spaceships: DeclaredResourceReference,
      };
    }

    // run the tests
    it('should resolve a domain object with no nested references', async () => {
      const ship = new Spaceship({
        serialNumber: '__UUID__',
        fuelQuantity: 9001,
        passengers: 21,
      });
      const original = ship;
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
    it('should not change nested references already in common form', async () => {
      const shipA = new Spaceship({
        serialNumber: '__SHIP_A__',
        fuelQuantity: 9001,
        passengers: 21,
      });
      const shipB = new Spaceship({
        uuid: '821',
        serialNumber: '__SHIP_B__',
        fuelQuantity: 7000,
        passengers: 42,
      });
      const spaceport = new Spaceport({
        uuid: '__SPACEPORT_UUID__',
        address: new Address({
          galaxy: 'Milky Way',
          solarSystem: 'Sun',
          planet: 'Earth',
          continent: 'North America',
        }),
        spaceships: [getRef(shipA), getRef(shipB)],
      });
      const original = spaceport;
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual(original);
    });
    it('should resolve each nested primary key reference to its common form', async () => {
      const primaryKeyRef: CNCMachineReference = buildRef(CNCMachine, {
        uuid: exampleMachine.uuid,
      });
      const uniqueKeyRef: CNCMachineReference = buildRef(CNCMachine, {
        serialNumber: exampleMachine.serialNumber,
      });
      const original = {
        machine: primaryKeyRef,
      };
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).not.toEqual(original);
      expect(resolved).toEqual({ machine: uniqueKeyRef }); // should have taken it to common form
    });
    it('should resolve each nested unique key reference to its common form', async () => {
      const uniqueKeyRef: CNCMachineReference = buildRef(CNCMachine, {
        serialNumber: exampleMachine.serialNumber,
      });
      const original = {
        machine: uniqueKeyRef,
      };
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).toEqual({ machine: uniqueKeyRef }); // should have taken it to common form
    });
    it('should resolve a primary key reference to a multi level nested unique key reference common form', async () => {
      const primaryKeyRef: CNCMachineRegistrationReference = buildRef(
        CNCMachineRegistration,
        {
          uuid: exampleRegistration.uuid,
        },
      );
      const uniqueKeyRef: CNCMachineRegistrationReference = buildRef(
        CNCMachineRegistration,
        {
          machine: buildRef(CNCMachine, {
            serialNumber: exampleMachine.serialNumber,
          }),
        },
      );
      const original = {
        registration: primaryKeyRef,
      };
      const resolved = await resolveReferencesToCommonComparableForm(
        { in: original },
        exampleContext,
      );
      expect(resolved).not.toEqual(original);
      expect(resolved).toEqual({ registration: uniqueKeyRef }); // should have taken it to common form});
    });
  });
});
