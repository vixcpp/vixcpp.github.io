# Package Metadata

Package metadata lives in `vix.json`.

Vix uses this file for more than display text. The metadata defines package identity, tells the installer what kind of package it is handling, lets search rank and filter results, and gives consumers enough information to reproduce the exact source version they installed.

A minimal publishable package needs identity, version, package type, license, description, repository, and authors.

```json
{
  "namespace": "softadastra",
  "name": "core",
  "version": "1.0.0",
  "type": "library",
  "license": "MIT",
  "description": "Core utilities for Vix projects.",
  "repository": "https://github.com/softadastra/core",
  "authors": [{ "name": "Softadastra" }]
}
```

## Identity

The package id is:

```txt
namespace/name
```

Both parts must be present and must use characters accepted by Vix package validation. Keep them lowercase and restrict them to letters, numbers, `_`, `-`, and `.`.

The namespace is the ownership boundary. The name is the package inside that boundary. Together they are the identifier used by commands:

```bash
vix add softadastra/core
vix install -g softadastra/pyrelune
```

The registry also binds the package identity to the normalized Git repository URL. After a repository has published one package identity, later publishes from the same repository must keep that identity. Vix rejects silent renames because they would make dependency resolution ambiguous.

## Version

`version` is the package version from `vix.json`. During publish it must match the Git tag being published. A package version `0.1.0` is published from tag `v0.1.0`.

Published versions are immutable. If the same version already exists at the same commit, publish is idempotent. If the same version exists at a different commit, publish fails. Release a fix as a new version instead of moving an existing tag.

## Repository

`repository` points to the source repository used for publishing and installing.

During publish, Vix normalizes this value and compares it with Git `origin`. This prevents publishing metadata for one repository while the tag actually belongs to another repository.

Use a stable repository URL:

```json
{
  "repository": "https://github.com/softadastra/pyrelune"
}
```

## Package type

`type` tells Vix what kind of package it is handling.

Supported values are:

```txt
header-only
library
header-and-source
executable
```

A Note extension does not introduce a new package type. A runtime extension that provides a command is normally an `executable` package. A metadata-only package can use the normal package type that matches its source layout.

## License

`license` is required when publishing. Vix does not invent a license when the field is missing.

Use a concise license identifier when possible:

```json
{
  "license": "MIT"
}
```

The registry stores this value so users can inspect package terms before adding or installing a dependency.

## Description

`description` is required and must be useful. Publish rejects descriptions that are too short.

Search uses the description as one of its scoring fields, so write a sentence that describes what the package provides rather than repeating the package name.

## Authors

`authors` must be a non-empty array when publishing. Each author object needs a non-empty `name`.

```json
{
  "authors": [{ "name": "Softadastra" }]
}
```

The array format leaves room for richer author metadata later without changing the basic manifest shape.

## Keywords

`keywords` is optional. When present, it must be an array.

```json
{
  "keywords": ["notebook", "python", "kernel"]
}
```

Search matches keywords in addition to package id, name, namespace, display name, and description. Keywords should describe concepts a developer is likely to search for.

## Include roots

Library packages can declare public include roots with `include` or `includes`.

```json
{
  "include": "include"
}
```

```json
{
  "includes": ["include", "single_include"]
}
```

Publish validates include roots and rejects absolute paths, traversal with `..`, and public include symlinks that escape the tagged repository checkout.

## Executables

Global executable packages can declare command names with `bin`.

```json
{
  "bin": {
    "pyrelune": "pyrelune"
  }
}
```

The key is the command name expected under the global `bin/` directory. CMake install rules remain authoritative: during global install, Vix validates that declared commands were actually installed by CMake.

Vix also accepts an `executables` array for existing manifests, but `bin` is the compact shape used by current executable packages.

## Extensions

`extensions` is optional. It lets a package contribute metadata to a Vix host without becoming a different package kind.

Currently the implemented host is:

```json
{
  "extensions": {
    "note": {}
  }
}
```

See [Registry Extensions](/registry/extensions) and [Extension Manifest](/modules/note/extension-manifest) for the supported `extensions.note` fields.

## Common mistakes

The most common metadata errors are structural rather than C++ errors.

```txt
missing namespace
missing name
version does not match the Git tag
repository does not match origin
unsupported package type
missing license
empty authors
keywords is not an array
unsafe include path
extensions is not an object
```

Fix the manifest first. The registry cannot safely accept a package whose identity, source repository, or version cannot be verified.
