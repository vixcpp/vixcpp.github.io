# Registry Extensions

Registry extensions are host-specific metadata stored inside a normal Vix package.

They do not create a second registry. They do not change dependency resolution. They do not add a second lockfile. They only let a Vix host, such as Vix Note, discover extra capabilities from packages that were already published and installed through the normal registry workflow.

```json
{
  "extensions": {
    "note": {
      "api": "1",
      "cellTypes": []
    }
  }
}
```

## Why extensions are metadata

A package manager should have one source of truth for identity, version, repository, commit, and installation ownership. If Note extensions used a separate registry, Vix would need a second resolver, a second install state, and a second trust model for packages that are still just source repositories.

Vix avoids that split. A Note extension is installed with:

```bash
vix install -g softadastra/pyrelune
```

and listed with:

```bash
vix note --list-extensions
```

The extension appears because the installed package metadata contains `extensions.note`.

## Supported hosts

The implemented extension host is:

```txt
note
```

Unknown extension hosts can be preserved as JSON metadata, but Vix Note only reads `extensions.note`.

## Search

Extension summaries are copied to the package-level registry entry so search can filter without resolving a version.

```bash
vix search --extension note
vix search python --extension note
vix search --extension note --capability mime-output
vix search --extension note --type executable
```

`vix search` stays offline. It reads the local registry index created by `vix registry sync`.

## Installation

Global installation records the version-level extension metadata in:

```txt
~/.vix/global/installed.json
```

or under the prefix selected by `VIX_GLOBAL_PREFIX`.

This installed manifest is what Vix Note reads during global extension discovery. The runtime command declared by an extension must be installed under the global `bin/` directory, and package files installed by CMake are tracked so global uninstall can remove them later.

## Current boundaries

The current Note extension system supports declarative cell types and one-shot external runtimes.

It does not automatically load extension JavaScript, arbitrary CSS, native `.so` or `.dll` plugins, persistent processes, or interactive permission prompts. Those features require a larger security model and are intentionally outside the first implemented extension API.
