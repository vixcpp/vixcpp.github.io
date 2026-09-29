# Extension Manifest

A Note extension is declared under `extensions.note` in `vix.json`.

The field is optional. A package without `extensions.note` remains a normal Vix package. A package with `extensions.note` is still a normal Vix package; it only adds metadata that Vix Note can read after installation.

```json
{
  "extensions": {
    "note": {
      "api": "1",
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

## api

`api` is required for Note extensions.

```json
{
  "api": "1"
}
```

The current implementation accepts only `"1"`. Vix rejects other values during publish and marks incompatible installed extensions unavailable during discovery.

## cellTypes

`cellTypes` is required and must be an array.

Each cell type needs a safe, non-empty `id`.

```json
{
  "id": "python",
  "label": "Python",
  "language": "python",
  "executable": true
}
```

The id is the source of truth stored in `.vixnote` documents. Vix Note preserves unknown type ids rather than converting them to C++ or Markdown. That is what allows a document containing a Python cell to remain readable even if the Python extension is not currently installed.

External extensions cannot declare these reserved ids:

```txt
markdown
html
cpp
reply
```

Those types are built into Vix Note and cannot be replaced by registry packages in API `1`.

## label and language

`label` is the human-facing name shown in the UI. If it is missing, Vix Note can fall back to the id.

`language` tells the editor and exporter which language the cell source represents. It should usually match the fence language used in the `.vixnote` file.

```json
{
  "id": "python",
  "label": "Python",
  "language": "python"
}
```

## aliases

Aliases let the parser and UI resolve alternate spellings.

```json
{
  "aliases": ["py"]
}
```

Aliases are normalized to lowercase, validated with the same safety rules as ids, and deduplicated. Reserved built-in ids cannot be used as external aliases.

## executable

`executable` tells Vix Note whether the cell can be run.

```json
{
  "executable": true
}
```

Executable external cell types require a runtime. Non-executable cell types can exist as metadata-only or render-only types, but API `1` does not load third-party frontend renderers.

## commentLine, commentBlock, defaultSource, placeholder

These optional fields improve the editing experience.

```json
{
  "commentLine": "#",
  "defaultSource": "# Write your explanation here.\n",
  "placeholder": "Write your Python code here."
}
```

`commentLine` gives the UI a safe line-comment prefix for generated starter content. `commentBlock` is reserved for languages where block comments are more appropriate. `defaultSource` is the actual source inserted when a new cell of that type is created. `placeholder` is UI text and should not be saved as source.

These fields exist so a new Python cell does not start with plain English text that would be invalid Python. If `defaultSource` is missing, the UI falls back to language-based defaults.

## capabilities

`capabilities` is an optional array of strings.

```json
{
  "capabilities": ["execute", "stdout", "stderr", "mime-output", "diagnostics"]
}
```

Vix stores capabilities in registry metadata so `vix search --extension note --capability <name>` can filter packages. Vix Note also exposes them through `/api/extensions` for the UI.

Capabilities are descriptive in API `1`. They do not grant permissions by themselves.

## permissions

`permissions` is optional metadata preserved from the manifest.

```json
{
  "permissions": ["process.execute", "project.read"]
}
```

The current implementation does not provide an interactive permission prompt. Treat permissions as documentation of what the runtime expects, not as a user approval system.

## runtime

`runtime` describes how Vix Note starts an external process for executable cell types.

Global installed packages use `command`:

```json
{
  "runtime": {
    "command": "pyrelune",
    "protocol": "vix-note-extension-1",
    "mode": "oneshot"
  }
}
```

Project extensions can use `path` relative to the package root:

```json
{
  "runtime": {
    "path": "tools/pyrelune",
    "protocol": "vix-note-extension-1",
    "mode": "oneshot"
  }
}
```

`command` must be a command name, not a path. It cannot contain `/` or `\`. Vix Note resolves it under the global `bin/` directory. `path` must be relative and must not contain traversal out of the package root.

## protocol and mode

The current protocol is:

```txt
vix-note-extension-1
```

The current mode is:

```txt
oneshot
```

In oneshot mode, Vix Note starts the runtime for one execution, writes one JSON request to stdin, closes stdin, reads one JSON response from stdout, captures stderr separately, and exits the process.

Persistent runtimes are not implemented in API `1`.

## Unsupported contributions

The API does not currently accept arbitrary frontend JavaScript, arbitrary CSS, or native dynamic libraries as extension contributions. Theme and renderer contribution models require additional validation and are not part of the publish-time Note extension contract documented here.
