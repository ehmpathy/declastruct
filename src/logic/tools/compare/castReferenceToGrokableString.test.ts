import { DomainEntity, DomainLiteral } from 'domain-objects';

import { buildRef, getRef } from '../../..';
import {
  CNCMachineReference,
  CNCMachineRegistrationReference,
  getExampleContext,
} from '../../../__test_assets__/getExampleContext';
import { DeclaredResourceReference } from '../../../domain/DeclaredResourceReference';
import { castReferenceToGrokableString } from './castReferenceToGrokableString';

const {
  exampleContext,
  exampleMachine,
  CNCMachine,
  exampleRegistration,
  CNCMachineRegistration,
} = getExampleContext();

describe('castReferenceToGrokableString', () => {
  describe('shallow', () => {
    it('should be able to cast a shallow unique key reference to grokable string', async () => {
      const reference: CNCMachineReference = buildRef(CNCMachine, {
        serialNumber: exampleMachine.serialNumber,
      });
      const string = await castReferenceToGrokableString(
        { reference },
        exampleContext,
      );
      console.log(string);
      expect(string).toEqual(`CNCMachine.serialNumber:'821'`);
    });
  });

  describe('nested', () => {
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
      public static unique = ['address'];
      public static updatable = ['spaceships'];
      public static nested = {
        address: Address,
        spaceships: DeclaredResourceReference,
      };
    }
    interface HumanAgent {
      uuid?: string;
      birthCode: string;
      name: string;
    }
    class HumanAgent extends DomainEntity<HumanAgent> implements HumanAgent {
      public static primary = ['uuid'] as const;
      public static unique = ['birthCode'];
    }
    type HumanAgentReference = DeclaredResourceReference<
      HumanAgent,
      'uuid',
      'birthCode'
    >;
    interface Captain {
      uuid?: string;
      agent: HumanAgentReference;
      ship: SpaceshipReference;
    }
    class Captain extends DomainEntity<Captain> implements Captain {
      public static primary = ['uuid'] as const;
      public static unique = ['agent', 'ship'];
      public static nested = {
        agent: DeclaredResourceReference,
        ship: DeclaredResourceReference,
      };
    }

    it('should be able to cast a unique key based on referenced entities to a grokable string', async () => {
      // instantiate them
      const ship = new Spaceship({
        serialNumber: '__SHIP_A__',
        fuelQuantity: 9001,
        passengers: 21,
      });
      const bob = new HumanAgent({
        birthCode: '821',
        name: 'Bobby Tables', // https://xkcd.com/327/
      });
      const captain = new Captain({
        agent: getRef(bob),
        ship: getRef(ship),
      });
      const string = await castReferenceToGrokableString(
        { reference: getRef(captain) },
        exampleContext,
      );
      expect(string).toEqual(
        `Captain.agent.birthCode:'821'.ship.serialNumber:'__SHIP_A__'`,
      );
    });

    it('should be able to cast a unique key based on valueobject to a grokable string', async () => {
      // instantiate them
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
      const string = await castReferenceToGrokableString(
        { reference: getRef(spaceport) },
        exampleContext,
      );
      expect(string).toEqual(
        `Spaceport.address.galaxy:'Milky Way'.address.solarSystem:'Sun'.address.planet:'Earth'.address.continent:'North America'`, // a literal is unique on all of its keys, so they must each be enumerated
      );
    });

    it('should be able to get a grokable string for a primary key reference to a multi-layer nested unique key resource', async () => {
      const primaryKeyRef: CNCMachineRegistrationReference = buildRef(
        CNCMachineRegistration,
        {
          uuid: exampleRegistration.uuid,
        },
      );
      const string = await castReferenceToGrokableString(
        { reference: primaryKeyRef },
        exampleContext,
      );
      expect(string).toEqual(
        `CNCMachineRegistration.machine.serialNumber:'821'`,
      );
    });
    it('should be able to get a grokable string for a unique key reference w/ a nested primary key reference', async () => {
      const uniqueKeyRef: CNCMachineRegistrationReference = buildRef(
        CNCMachineRegistration,
        {
          machine: buildRef(CNCMachine, {
            uuid: exampleMachine.uuid,
          }),
        },
      );
      const string = await castReferenceToGrokableString(
        { reference: uniqueKeyRef },
        exampleContext,
      );
      expect(string).toEqual(
        `CNCMachineRegistration.machine.serialNumber:'821'`,
      );
    });
  });
});
