# Package Registry

The Vix Registry is the package metadata layer used by the Vix CLI.

It does not replace Git, CMake, or the package source repository. A registry entry tells Vix where a package lives, which versions exist, which commit belongs to each version, which package type Vix should expect, and which extra metadata can be used by commands such as `vix search`, `vix add`, `vix install`, and `vix note`.

The usual registry workflow is:

```bash
vix registry sync
vix search json
vix add namespace/package
vix install
```

For global tools and Vix Note extensions, the same registry is used:

```bash
vix registry sync
vix search --extension note
vix install -g softadastra/pyrelune
vix note --list-extensions
```

A Note extension is not published to a second extension marketplace. It is a normal Vix package with an additional `extensions.note` object in `vix.json`.

## What the registry stores

A registry entry stores package-level metadata and version-level metadata.

Package-level metadata is used for discovery. It includes the package id, package type, description, repository URL, keywords, latest version, and extension summaries. This is the data that `vix search` reads from the local index.

Version-level metadata is the immutable record for a published version. It stores the tag, commit, package hash metadata, generated API metadata for libraries, and the exact extension declaration copied from the tagged `vix.json`.

This split matters because search needs a compact current summary, while installation must resolve a precise version. When `vix install -g` installs a Note extension, it reads the exact `versions.<version>.extensions` object, not only the search summary.

## Local index

`vix search` is offline. It reads the local registry index under the Vix home directory.

```txt
~/.vix/registry/index/index
```

Refresh it with:

```bash
vix registry sync
```

The local index is intentionally separate from installed packages. Syncing registry metadata does not install anything. Installing a package does not automatically search the network for unrelated packages.

## Related pages

- [Package Metadata](/registry/package-metadata)
- [vix.json Reference](/registry/vix-json)
- [Publishing Packages](/registry/publishing)
- [Registry Extensions](/registry/extensions)
- [Creating Note Extensions](/modules/note/extensions)
