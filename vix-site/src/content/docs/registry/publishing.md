# Publishing Packages

`vix publish` submits a tagged package version to the Vix Registry.

Publishing is deliberately strict. A registry entry is used by other machines later, often without the original working tree. Vix therefore validates the tag, repository, manifest, package shape, and extension metadata before it submits registry changes.

```bash
vix publish
vix publish 0.1.0
vix publish 0.1.0 --dry-run
```

## Workflow

A normal release looks like this:

```bash
git status
git tag v0.1.0
git push origin main
git push origin v0.1.0
vix publish 0.1.0
```

`vix publish` can also infer the latest SemVer tag:

```bash
vix publish
```

In both cases, the version in `vix.json` must match the tag without the leading `v`.

## What Vix validates

Vix validates the repository state before changing the registry.

```txt
working tree is clean
origin exists
local tag exists
remote tag exists
local and remote tags point to the same commit
vix.json exists in the tagged source
vix.json is a JSON object
version matches the tag
repository matches Git origin after normalization
package identity is stable for that repository
```

It then validates package metadata:

```txt
namespace and name are present and safe
package type is supported
license is present
description is meaningful
authors is a non-empty array
keywords is an array when present
include roots are relative and safe
public headers exist for library-style packages
```

For library packages, publish scans the public include roots from the tagged checkout and generates deterministic API metadata for the registry.

## Extension validation

If `vix.json` contains `extensions`, Vix validates it during publish.

For `extensions.note`, Vix checks:

```txt
extensions is an object
extensions.note is an object
api is present and equals "1"
cellTypes is an array
cell type ids are non-empty and safe
cell type ids do not replace markdown, html, cpp, or reply
aliases are strings, safe, normalized, and deduplicated
runtime is an object when present
runtime.protocol is vix-note-extension-1
runtime.mode is oneshot
runtime.command is a command name, not a path
runtime has command or path
```

The registry stores two forms of extension metadata.

The package-level summary is used by search:

```json
{
  "extensions": {
    "note": {
      "api": "1",
      "capabilities": ["execute", "mime-output"],
      "cellTypes": [
        {
          "id": "python",
          "label": "Python",
          "language": "python",
          "executable": true
        }
      ]
    }
  }
}
```

The version-level declaration is the exact extension metadata for that version:

```json
{
  "versions": {
    "0.1.1": {
      "tag": "v0.1.1",
      "commit": "...",
      "extensions": {
        "note": {
          "api": "1",
          "cellTypes": [
            { "id": "python", "label": "Python", "executable": true }
          ],
          "runtime": {
            "command": "pyrelune",
            "protocol": "vix-note-extension-1",
            "mode": "oneshot"
          }
        }
      }
    }
  }
}
```

Installation uses the version-level declaration because it is tied to the resolved commit.

## Immutability

A published version is immutable.

If `namespace/name@0.1.0` already exists at the same commit, publishing it again is idempotent. If it exists at another commit, Vix rejects the publish. This is the rule that protects lockfiles: a version should identify one source state.

To replace a broken package version, publish a new version such as `0.1.1`.

## Dry run

Use dry run when changing metadata or adding extension metadata:

```bash
vix publish 0.1.1 --dry-run
```

Dry run performs local validations and reports whether the tagged source is ready. It does not push a registry branch or create a pull request.

## Common errors

Missing namespace:

```txt
invalid vix.json: missing string field `namespace`
```

Unsupported package type:

```txt
invalid vix.json: unsupported package type `plugin`
```

Repository mismatch:

```txt
Repository mismatch

  vix.json
  https://github.com/example/wrong

  Git origin
  https://github.com/example/package
```

Unsupported Note runtime protocol:

```txt
invalid vix.json: unsupported note runtime protocol
```

Reserved Note cell type:

```txt
invalid vix.json: invalid or reserved note cell type id `cpp`
```

These errors are intentionally early. Fix the tagged source, create a new tag if the tag already points to the old commit, and publish again.
