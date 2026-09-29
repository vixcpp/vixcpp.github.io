# Creating Note Extensions

A Vix Note extension is a normal Vix package that contributes Note metadata.

The package is published with `vix publish`, found with `vix search`, installed with `vix install -g`, recorded in the global installed manifest, and discovered by `vix note` at startup. There is no separate Note registry and no manual registration step inside Vix Note.

```txt
developer writes a package
  -> adds extensions.note to vix.json
  -> publishes a tagged version
  -> user installs the package globally
  -> Vix Note discovers the installed metadata
  -> contributed cell types appear in the UI
```

## What an extension can do today

The implemented API supports two things:

```txt
cell type descriptors
one-shot external runtimes
```

A cell type descriptor tells the UI how to label and edit a cell. A runtime tells the kernel how to execute that cell by starting an external process and exchanging JSON through stdin and stdout.

This is enough for packages such as Pyrelune to add Python cells to Vix Note without linking native code into the Note process.

## Discovery order

Vix Note builds its extension registry when `vix note` starts.

```txt
built-in extensions
global extensions
project extensions
```

Built-ins provide the protected cell types:

```txt
markdown
html
cpp
reply
```

Global extensions are read from:

```txt
~/.vix/global/installed.json
```

If `VIX_GLOBAL_PREFIX` is set, Vix Note reads:

```txt
$VIX_GLOBAL_PREFIX/installed.json
```

Project extensions are discovered from packages under:

```txt
<project>/.vix/deps/
```

A project extension can override the same package installed globally. External packages cannot replace built-in cell types.

## Start with search and install

Users find Note extensions through the normal registry index:

```bash
vix registry sync
vix search --extension note
vix search python --extension note
```

Then they install the package globally:

```bash
vix install -g softadastra/pyrelune
```

The extension can be inspected without starting the UI:

```bash
vix note --list-extensions
```

Start the workspace after installation:

```bash
vix note lesson.vixnote
```

The contributed cell type appears in the cell type picker when the extension is available.

## Availability

Installed metadata is not enough for execution. Vix Note also checks whether the extension is usable.

For a global executable runtime, the declared command must be safe and must resolve under the global `bin/` directory. For a project runtime, `runtime.path` must be relative to the package root and must not traverse out of it.

If the runtime is missing or unsupported, the extension remains visible as unavailable. Existing cells keep their source and type, but running them returns a diagnostic instead of crashing the server.

## No frontend plugins yet

The current implementation does not execute JavaScript from extension packages. It also does not load arbitrary extension CSS.

This is intentional. Cell types and runtimes are declarative and controlled by the local server. Frontend plugin execution needs a separate security model and is not part of `extensions.note` API `1`.
