# declastruct

![test](https://github.com/ehmpathy/declastruct/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/declastruct/workflows/publish/badge.svg)

declarative control of any resource constructs, batteries included

# intro

Control any resource construct declaratively. Declare what you want ✨. Plan to see what must change 🔮. Apply to make it so 🪄

## what is it?

`declastruct` is a framework to control any resource construct via **declarative instructions** — you describe **what** you want the end state to be, and the system figures out **how** to get there.

**declarative instructions** means:
- you declare the desired state of your resources
- the system compares your desires against reality
- the system computes the changes required to reconcile reality with your desires
- you review and apply those changes

in contrast to **imperative instructions**, where you specify each step and _hope_ it produces what you want:
```ts
// imperative 👎 = you say HOW to do things, step by step
await createBucket({ name: 'my-bucket' });
await enableVersioning({ bucket: 'my-bucket' });
await setEncryption({ bucket: 'my-bucket', type: 'AES256' });
```

the advantage of **declarative instructions** is that you simply declare what you want and _know_ it will work:
```ts
// declarative 👍 = you say WHAT you want, the system figures out how
const bucket = DeclaredAwsS3Bucket.as({
  name: 'my-bucket',
  versioning: true,
  encryption: 'AES256',
});
await apply({ resources: [bucket] });
```

works with:
- **infrastructure** — AWS, GCP, Azure resources
- **SaaS platforms** — Stripe customers, GitHub repos, Slack channels, etc
- **databases** — application data models
- **any API** — anything with a remote state you want to control

think Terraform, but:
- **no state files to manage** — compares directly against live remote state
- **no new language to learn** — declare via TypeScript, reuse domain objects and operations
- **pit-of-success by default** — enforces idempotency, clear unique keys, and safe operations
- **not just infrastructure** — works with any resource construct (saas, databases, apis, etc)

# usage

## install

```sh
npm install declastruct --save-dev
```

## use

### 1. **declare** your desired state ✨

declare your wish via strongly-typed [domain-objects](https://github.com/ehmpathy/domain-objects). these are the declarative instructions that will control your resources.

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

see exactly what must change to make your wish come true, ahead of time

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

apply the plan to make your wish come true

```sh
npx declastruct apply --plan provision/.temp/plan.json
```

# benefits - why declastruct?

## summary

✅ **stateless** — no state files to manage, compare directly against reality

✅ **type-safe** — full TypeScript support with domain objects

✅ **idempotent** — safe to plan and apply repeatedly

✅ **observable** — see exactly what would change if you apply

✅ **composable** — reuse domain objects and operations across application code and declarative instructions

✅ **pit-of-success** — enforced best practices via idempotent dao interfaces

✅ **universal** — works with any resource construct (infrastructure, saas platforms, databases, apis, etc)


## details

### no state file management

traditional declarative tools (like Terraform) require separate state files to track resources existence. this creates problems:
- state files can drift from reality
- state lock issues in team environments
- state files must be carefully secured and backed up

**declastruct eliminates state files entirely.** it compares your declared desires directly against live remote state via unique keys, so the source of truth is always reality itself.

### use your existing domain language

instead of HCL, YAML, or another DSL:
- write declarative instructions via TypeScript with [`domain-objects`](https://github.com/ehmpathy/domain-objects)
- reuse the domain objects and domain operations across your application code and declarative instructions
- leverage TypeScript's type safety, IDE autocomplete, and refactor tools
- compose and test declarative instructions like any other code

### enforced best practices

declastruct providers follow a pit-of-success pattern that guarantees:

**idempotency** — all operations can be safely retried
- `finsert`: find-or-insert (safe create)
- `upsert`: update-or-insert (safe update)
- repeat any operation multiple times, get the same result each time

**explicit unique keys** — every resource declares how to uniquely identify it
- prevents accidental duplicates
- enables accurate comparison against live state
- makes resource relationships clear, typesafe, and composable

**observable change plans** — see exactly what must change before you apply
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

**build your own provider** for any resource construct (GitHub repos, Slack channels, database records, etc.) via the `DeclastructDao` and `DeclastructProvider` interfaces.

## use cases

- **infrastructure as code** — control AWS, GCP, Azure resources via declarative instructions
- **SaaS platform management** — control Stripe customers, GitHub repos, Slack channels via declarative instructions
- **database state management** — control database resource states via declarative instructions
- **api state management** — control remote resource state via declarative instructions
- **multi-platform orchestration** — coordinate resources across different providers in one plan


# concepts

## domain

### DeclastructDao

the core abstraction that defines how to get and set a resource type:

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

every resource class has a DeclastructDao that enforces safe, idempotent operations.

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

captures the changes needed to reconcile reality with declared desires:

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

inspired by Terraform's declarative approach, but designed to eliminate state file overhead, work with any resource construct, be reusable across both prod codepaths and cicd control, and leverage TypeScript's type system for safer declarative instructions.
