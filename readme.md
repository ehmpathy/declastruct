# declastruct

![test](https://github.com/ehmpathy/declastruct/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/declastruct/workflows/publish/badge.svg)

Add declarative control to any resource constructs. Declare, plan, and apply within an observable pit-of-success.

Declare the structures you want. Plan to see the changes required. Apply to make it so 🪄

# benefits

- no dedicated state required
  - looks at the source of truth directly
  - leverages unique keys of resources to understand remote state automatically and eliminate the middleman

- no new language syntax required
  - no awkward new-language limitations
  - reuse your existing domain language to manage your resources

# features

- flexible resource references
  - eliminate primary-key constraint; enable declaration of resources via unique-key references
  - eliminate single-key constraint; enable usage of whichever key is accessible

- declarative resource structures
  - manage resource states declaratively

- declarative persistence structures
  - standard shape for any operation for interaction with resources
  - plug and play handlers of resources (interface w/ many remote state stores for the same resource via prebuilt providers)

- declarative instructions
  - declare desired state
  - plan changes required to get to desired state
  - apply changes to get to desired state


# install

```sh
npm install -s declastruct
```

# use

### `declare`

### `plan`

### `apply`


# todo

swap to domain-objects.Refs
