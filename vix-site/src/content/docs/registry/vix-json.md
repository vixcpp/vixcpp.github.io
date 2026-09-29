# vix.json Reference

`vix.json` is the package and workflow manifest used by Vix commands.

This page documents the package fields used by the registry, publishing, installation, search, and Vix Note extension discovery. Other Vix commands may also read workflow sections such as `production`, but those sections are documented with their command families.

## Required publish fields

| Field         | Type   | Purpose                                                             |
| ------------- | ------ | ------------------------------------------------------------------- |
| `namespace`   | string | Package owner namespace.                                            |
| `name`        | string | Package name inside the namespace.                                  |
| `version`     | string | Version published from the matching Git tag.                        |
| `type`        | string | One of `header-only`, `library`, `header-and-source`, `executable`. |
| `license`     | string | Package license metadata.                                           |
| `description` | string | Searchable human description.                                       |
| `repository`  | string | Source repository URL, validated against Git `origin`.              |
| `authors`     | array  | Non-empty list of authors; each author needs `name`.                |

## Optional registry fields

| Field         | Type   | Purpose                                                        |
| ------------- | ------ | -------------------------------------------------------------- |
| `displayName` | string | Human-readable package name used by search when present.       |
| `keywords`    | array  | Search keywords.                                               |
| `include`     | string | Public include root for library packages.                      |
| `includes`    | array  | Multiple public include roots.                                 |
| `bin`         | object | Global command names provided by executable packages.          |
| `executables` | array  | Alternate executable declaration used by existing packages.    |
| `extensions`  | object | Host-specific extension metadata, currently `extensions.note`. |

## Normal library

A compiled library package describes its public identity and include layout. CMake remains responsible for building and installing the library.

```json
{
  "namespace": "example",
  "name": "math",
  "version": "1.0.0",
  "type": "library",
  "license": "MIT",
  "description": "Small math helpers for Vix projects.",
  "repository": "https://github.com/example/vix-math",
  "authors": [{ "name": "Example" }],
  "keywords": ["math", "cpp"],
  "include": "include"
}
```

Use `library` when the package builds compiled artifacts and exposes public headers.

## Header-only package

Header-only packages do not need a runtime binary. The include root is the important part.

```json
{
  "namespace": "example",
  "name": "headers",
  "version": "1.0.0",
  "type": "header-only",
  "license": "MIT",
  "description": "Header-only helpers for Vix projects.",
  "repository": "https://github.com/example/headers",
  "authors": [{ "name": "Example" }],
  "include": "include"
}
```

Publish scans the tagged source and validates that public headers exist under the declared include root.

## Executable package

Executable packages install commands into the global prefix when used with `vix install -g`.

```json
{
  "namespace": "example",
  "name": "tool",
  "version": "1.0.0",
  "type": "executable",
  "license": "MIT",
  "description": "Command-line helper for Vix workflows.",
  "repository": "https://github.com/example/vix-tool",
  "authors": [{ "name": "Example" }],
  "bin": {
    "vix-tool": "vix-tool"
  }
}
```

The `bin` field documents the expected command. The package still needs CMake install rules that install the executable.

## Note extension

A Note extension is a normal package with extra metadata.

```json
{
  "namespace": "softadastra",
  "name": "pyrelune",
  "version": "0.1.1",
  "type": "executable",
  "license": "MIT",
  "description": "Python execution kernel for Vix Note.",
  "repository": "https://github.com/softadastra/pyrelune",
  "authors": [{ "name": "Softadastra" }],
  "keywords": ["note", "python", "kernel"],
  "bin": {
    "pyrelune": "pyrelune"
  },
  "extensions": {
    "note": {
      "api": "1",
      "capabilities": [
        "execute",
        "stdout",
        "stderr",
        "mime-output",
        "diagnostics"
      ],
      "cellTypes": [
        {
          "id": "python",
          "label": "Python",
          "language": "python",
          "aliases": ["py"],
          "executable": true,
          "commentLine": "#",
          "defaultSource": "# Write your explanation here.\n",
          "placeholder": "Write your Python code here."
        }
      ],
      "runtime": {
        "command": "pyrelune",
        "protocol": "vix-note-extension-1",
        "mode": "oneshot"
      }
    }
  }
}
```

The package type is still `executable`. The extension metadata only tells Vix Note which cell types the package contributes and how to start the runtime.

## Field behavior

Vix treats `vix.json` as input to validation, not as a loose display file. Publishing reads the manifest from the tagged source checkout. Global installation records the resolved version metadata in `~/.vix/global/installed.json`. Vix Note discovers global extensions from that installed manifest.

That means changes in your working tree do not affect an already published version. Create a new tag and publish a new version when metadata changes.
