# declastruct

![test](https://github.com/ehmpathy/declastruct/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/declastruct/workflows/publish/badge.svg)

declarative control for any resource constructs, batteries included

# intro

Add declarative control to any resource construct. Declare, plan, and apply within an observable pit-of-success.

Declare the structures you want. Plan to see the changes required. Apply to make it so 🪄


## what is it?

`declastruct` is a framework for managing any resource construct declaratively using TypeScript.

declare what you want, plan the changes, and apply them safely — all without managing separate state files or learning a new language.

works with:
- **infrastructure** — AWS, GCP, Azure resources
- **SaaS platforms** — Stripe customers, GitHub repos, Slack channels, etc
- **databases** — application data models
- **any API** — anything with a remote state you want to control

think Terraform, but:
- **no state files to manage** — compares directly against live remote state
- **no new language to learn** — uses TypeScript and your existing domain objects
- **pit-of-success by default** — enforces idempotency, clear unique keys, and safe operations
- **not just infrastructure** — works with any resource construct (saas, databases, apis, etc)

# usage

## install

```sh
npm install declastruct --save-dev
```

## use

### 1. **declare** your desired state ✨

define resource constructs with strongly-typed domain objects:

```ts
import { getDeclastructAwsProvider, DeclaredAwsS3Bucket } from 'declastruct-aws';
import { getDeclastructStripeProvider, DeclaredStripeCustomer } from 'declastruct-stripe';

// define which providers support your resource constructs
export const getProviders = async () => [
  await getDeclastructAwsProvider({
    profile: process.env.AWS_PROFILE,
  }),
  await getDeclastructStripeProvider({
    apiKey: process.env.STRIPE_SECRET_KEY,
  }),
];

// declare the resource constructs you want and their desired state
export const getResources = async () => {
  const bucket = DeclaredAwsS3Bucket.as({
    name: 'your-s3-bucket',
    versioning: true,
    encryption: 'AES256',
  });

  const customer = DeclaredStripeCustomer.as({
    email: 'user@example.com',
    name: 'John Doe',
    metadata: { source: 'app-web' },
  });

  return [bucket, customer];
};
```

### 2. **plan** the required changes 🔮

see exactly what will change before applying:

```sh
npx declastruct plan \
  --wish provision/resources.ts \
  --into provision/.temp/plan.json
```

output:
```
planned changes:
  CREATE: DeclaredAwsS3Bucket.your-s3-bucket
    + name: "your-s3-bucket"
    + versioning: true
    + encryption: "AES256"

  CREATE: DeclaredStripeCustomer.user@example.com
    + email: "user@example.com"
    + name: "John Doe"
    + metadata: { source: "app-web" }
```

### 3. **apply** the plan 🪄

execute the plan to make your desired state reality:

```sh
npx declastruct apply --plan provision/.temp/plan.json
```

# benefits - why declastruct?

## summary

✅ **stateless** — no state files to manage, compare directly against reality

✅ **type-safe** — full TypeScript support with domain objects

✅ **idempotent** — safe to run plans multiple times

✅ **observable** — see exactly what will change before applying

✅ **composable** — reuse domain objects and operations across application code and resource management

✅ **pit-of-success** — enforced best practices via idempotent dao interfaces

✅ **universal** — works with any resource construct (infrastructure, saas platforms, databases, apis, etc)


## details

### no state file management

traditional declarative tools (like Terraform) require maintaining a separate state file that tracks what resources exist. this creates problems:
- state files can drift from reality
- state locking issues in team environments
- state files must be carefully secured and backed up

**declastruct eliminates state files entirely.** it compares your desired resource constructs directly against live remote state using unique keys, so the source of truth is always reality itself.

### use your existing domain language

instead of learning HCL, YAML, or another DSL:
- declare resource constructs as TypeScript using `domain-objects`
- reuse the same domain objects across your application code and remote resource management
- leverage TypeScript's type safety, IDE autocomplete, and refactoring tools
- compose and test resource definitions like any other code

### enforced best practices

declastruct providers follow a pit-of-success pattern that guarantees:

**idempotency** — all operations can be safely retried
- `finsert`: find-or-insert (safe create)
- `upsert`: update-or-insert (safe update)
- running the same plan multiple times produces the same result

**explicit unique keys** — every resource declares how to uniquely identify it
- prevents accidental duplicates
- enables accurate comparison against live state
- makes resource relationships clear, typesafe, and composable

**observable change plans** — see exactly what will change before applying
- diff view shows before & after for each resource
- change actions: CREATE, UPDATE, KEEP, DESTROY
- no surprises in production

### provider ecosystem

declastruct is designed to support any resource construct through adapters:

**available providers:**
- `declastruct-aws` — AWS infrastructure (S3, Lambda, RDS, EC2, etc.)
- `declastruct-stripe` — Stripe SaaS resources (customers, subscriptions, products, etc.)
- `declastruct-github` — Github resources (repos, branches, protection, etc.)
- etc

**build your own provider** for any resource construct (GitHub repos, Slack channels, database records, etc.) by implementing the `DeclastructDao` and `DeclastructProvider` interfaces.

## use cases

- **infrastructure as code** — manage AWS, GCP, Azure resources declaratively
- **SaaS platform management** — manage Stripe customers, GitHub repos, Slack channels, etc declaratively
- **database state management** — control database resource states declaratively
- **api state management** — control remote resource state through api's declaratively
- **multi-platform orchestration** — coordinate resources across different providers in one plan


# concepts

## domain

### DeclastructDao

the core abstraction that defines how to interact with a resource type:

```ts
interface DeclastructDao<TResource, TResourceClass, TContext> {
  get: {
    byUnique: (ref: RefByUnique, context) => Promise<TResource | null>;
    byPrimary?: (ref: RefByPrimary, context) => Promise<TResource | null>;
    byRef: (ref: Ref, context) => Promise<TResource | null>;
  };
  set: {
    finsert: (resource: TResource, context) => Promise<TResource>;
    upsert?: (resource: TResource, context) => Promise<TResource>;
    delete?: (ref: Ref, context) => Promise<void>;
  };
}
```

every resource class gets a DeclastructDao that enforces safe, idempotent operations.

### DeclastructProvider

bundles related DAOs and provider context:

```ts
interface DeclastructProvider<TDaos, TContext> {
  name: string;                    // provider identifier
  daos: TDaos;                     // map of resource types to DAOs
  context: TContext;               // auth, region, etc.
  hooks: {
    beforeAll: () => Promise<void>;
    afterAll: () => Promise<void>;
  };
}
```

### DeclastructPlan

captures the changes needed to achieve desired state:

```ts
interface DeclastructPlan {
  changes: DeclastructChange[];    // ordered list of changes
  createdAt: IsoTimestamp;         // when plan was created
  hash: string;                    // fingerprint for validation
}
```

each `DeclastructChange` includes:
- `action`: CREATE | UPDATE | KEEP | DESTROY
- `forResource`: which resource this affects
- `state.desired`: what you want
- `state.remote`: what exists now
- `state.difference`: human-readable diff


## inspiration

inspired by Terraform's declarative approach, but designed to eliminate state management overhead, work with any resource construct, and leverage TypeScript's type system for safer declarative resource management.
