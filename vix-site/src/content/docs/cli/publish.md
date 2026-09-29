# vix publish

`vix publish` submits a tagged package version to the Vix Registry.

```bash
vix publish
vix publish 0.1.0
vix publish --dry-run
```

A normal publish is intentionally quiet. On success it prints only the package version and, when available, the registry pull request URL.

```text
✔ published vixcpp/ovi@0.1.0
  Pull request: https://github.com/vixcpp/registry/pull/123
```

## Prerequisites

Run `vix publish` from the package Git repository.

Before publishing:

- `vix.json` must exist in the tagged source.
- The working tree must be clean.
- `origin` must be configured.
- The publish tag must exist locally and on `origin`.
- The local tag and the remote tag must point to the same commit.
- `vix.json` `version` must match the tag, for example `0.1.0` and `v0.1.0`.
- `vix.json` `repository` must match Git `origin` after URL normalization.
- Public headers must exist under the declared include root for library packages.

## Version and tag

For an explicit version:

```bash
vix publish 0.1.0
```

Vix publishes tag `v0.1.0`.

For an implicit version:

```bash
vix publish
```

Vix uses the latest local SemVer tag and then verifies that tag against `origin`.

Published versions are immutable. If `vixcpp/ovi@0.1.0` already exists with the same commit, the command succeeds idempotently:

```text
✔ vixcpp/ovi@0.1.0 is already published
```

If the same version points to a different commit, publish fails.

## Package identity

A published package identity is the combination of:

- `namespace` and `name` from `vix.json`;
- the normalized Git repository URL.

On first publish, the registry records this identity. Later publishes from the same repository must keep the same package name.

For example, if the registry already associates:

```text
https://github.com/vixcpp/ovi -> vixcpp/ovi
```

then changing `vix.json` to `softadastra/ovi2` is rejected. Vix does not create a second package silently for the same repository. Renames require an explicit registry workflow.

## Tagged source

Publish validates the exact commit referenced by the tag. Vix creates a temporary detached checkout of the tag commit and reads `vix.json`, public headers and API information from that checkout.

This avoids publishing metadata from files that are newer than the tag.

## Manifest validation

`vix.json` is validated before any registry branch is pushed.

Vix checks the package identity, version, type, license, description, repository, authors, keywords, dependencies, include paths and executable metadata. It does not invent missing metadata such as `MIT` when the license is absent.

Supported package types are the types understood by Vix, including:

```text
header-only
library
header-and-source
executable
```

## Headers and API

For library packages, Vix scans the declared include root instead of assuming one fixed header name.

Supported shapes include:

```text
include/ovi/ovi.hpp
include/ovi.hpp
include/ovi/core.hpp
single_include/ovi.hpp
```

Unsafe include paths, absolute paths and `..` traversal are rejected.

During publish, Vix generates deterministic API metadata from the public headers. The registry entry records a `vix.api.json` document with package, version, commit, headers and public symbols detected from the tagged source.

## Dry run

Use dry run before publishing:

```bash
vix publish --dry-run
```

Normal output is short:

```text
✔ vixcpp/ovi@0.1.0 is ready to publish
```

Dry run performs local validations but does not push a registry branch or create a pull request.

For structured output:

```bash
vix publish --dry-run --json
```

## Verbose and JSON

Use verbose mode when you need internal details:

```bash
vix publish --verbose
```

Verbose mode may show Git commands, registry paths, retries, selected branches, header scanning and API generation details.

Use JSON for automation:

```bash
vix publish --json
```

JSON output is not mixed with decorative text.

## Network and retry

Publishing requires network access to update the registry branch and create or reuse a pull request. Temporary Git or network failures are retried when Vix can safely retry them.

If a publish is interrupted after a branch is pushed, running `vix publish` again should resume or report the already submitted state instead of creating duplicate registry work.

## Examples

Publish the latest tag:

```bash
vix publish
```

Publish an explicit version:

```bash
vix publish 0.1.0
```

Validate first:

```bash
vix publish 0.1.0 --dry-run
```

Get machine-readable dry-run output:

```bash
vix publish 0.1.0 --dry-run --json
```

## Note extension packages

`vix publish` validates `extensions.note` when the manifest declares a Vix Note extension.

A Note extension is still a normal package. The package type remains one of the supported Vix package types, usually `executable` for an external runtime. The extra metadata only tells Vix Note which cell types and runtime protocol the package contributes.

During publish, Vix validates the same package fields as any other package, then validates the Note extension declaration:

```txt
extensions must be an object
extensions.note must be an object
extensions.note.api must be "1"
extensions.note.cellTypes must be an array
external cell type ids cannot be markdown, html, cpp, or reply
runtime.protocol must be vix-note-extension-1
runtime.mode must be oneshot
runtime.command must be a command name, not a path
```

The registry entry stores a compact extension summary for search and stores the exact extension declaration under the published version. Installation uses the version-level declaration.

See [Publishing Packages](/registry/publishing) and [Extension Manifest](/modules/note/extension-manifest) for the full manifest shape.
