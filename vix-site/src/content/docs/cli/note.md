# vix note

`vix note` starts the Vix Note workspace.

Use it to open an interactive note UI, run note cells, work from the current project directory, or export a `.vixnote` document to a standalone HTML lesson.

```bash id="b2z0li"
vix note
```

## Overview

`vix note` runs a local Vix Note server.

Without a file, it starts a workspace for the current directory.

```bash id="fvxwcr"
vix note
```

With a `.vixnote` file, it loads that document.

```bash id="sobiwb"
vix note lessons/pointers.vixnote
```

The command exposes the note UI through HTTP.

```txt id="a8xm4d"
http://127.0.0.1:5179/
```

It can also open the note UI inside a desktop WebView shell when desktop shell support is available.

```bash id="uwbt1f"
vix note --desktop
```

## Usage

```bash id="qjcp8f"
vix note [file.vixnote] [options]
vix note export <file.vixnote> --out <file.html> [options]
```

## Start a workspace

```bash id="wh5wwg"
vix note
```

This starts a note workspace in the current directory.

Vix creates an untitled note document in memory and uses the current folder as the project context.

Example output shape:

```txt id="dg6rrj"
Vix Note
  HTTP: http://127.0.0.1:5179/
  Status: listening
```

## Open a note file

```bash id="p5nllb"
vix note examples/hello.vixnote
```

A note file must use the `.vixnote` extension.

```bash id="fk3jzi"
vix note lessons/pointers.vixnote
```

Use a custom port:

```bash id="rln2ci"
vix note lessons/pointers.vixnote --port 5180
```

Use a custom host:

```bash id="ew89y2"
vix note lessons/pointers.vixnote --host 127.0.0.1 --port 5179
```

## Open in desktop mode

```bash id="wf80n8"
vix note --desktop
```

or:

```bash id="l7b08m"
vix note lessons/pointers.vixnote --desktop
```

Desktop mode starts the local note server, waits until it is ready, then opens the note UI inside a desktop shell.

Set the desktop window size:

```bash id="vc4zyk"
vix note lessons/pointers.vixnote --desktop --width 1400 --height 900
```

Enable developer tools:

```bash id="raq767"
vix note --desktop --devtools
```

Start fullscreen:

```bash id="n6mvi4"
vix note --desktop --fullscreen
```

Disable resizing:

```bash id="hqfugg"
vix note --desktop --no-resizable
```

Use browser/server mode explicitly:

```bash id="v0m9fb"
vix note --browser
```

## Export a note to HTML

```bash id="w0e4do"
vix note export examples/hello.vixnote --out hello.html
```

This exports the `.vixnote` document to a standalone HTML lesson.

Export without cell outputs:

```bash id="l0ucza"
vix note export examples/hello.vixnote --out hello.html --no-outputs
```

Export with outputs:

```bash id="yw5o8t"
vix note export examples/hello.vixnote --out hello.html --with-outputs
```

Cell outputs are included by default.

## Server options

| Option          | Description                                              |
| --------------- | -------------------------------------------------------- |
| `--host <host>` | Host used by the local note server. Default: `127.0.0.1` |
| `--host=<host>` | Same as `--host <host>`                                  |
| `--port <port>` | Port used by the local note server. Default: `5179`      |
| `--port=<port>` | Same as `--port <port>`                                  |

## Desktop options

| Option                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| `--desktop`, `--shell` | Open the note UI in a desktop WebView shell   |
| `--browser`            | Keep browser/server mode                      |
| `--width <px>`         | Desktop shell width. Default: `1280`          |
| `--height <px>`        | Desktop shell height. Default: `820`          |
| `--devtools`           | Enable WebView developer tools when supported |
| `--no-devtools`        | Disable WebView developer tools               |
| `--fullscreen`         | Start the desktop shell fullscreen            |
| `--resizable`          | Allow the desktop shell to be resized         |
| `--no-resizable`       | Disable desktop shell resizing                |

## Export options

| Option              | Description                 |
| ------------------- | --------------------------- |
| `--out <file.html>` | Output HTML file            |
| `--out=<file.html>` | Same as `--out <file.html>` |
| `--with-outputs`    | Export with cell outputs    |
| `--no-outputs`      | Export without cell outputs |

## Output options

| Option          | Description                            |
| --------------- | -------------------------------------- |
| `--quiet`, `-q` | Only print errors                      |
| `--json`        | Emit machine-readable lifecycle events |
| `--no-color`    | Disable ANSI colors                    |
| `--color`       | Force ANSI colors                      |

## Common workflows

Start notes for the current project:

```bash id="rfgbnr"
vix note
```

Open a saved lesson:

```bash id="iqqg5g"
vix note lessons/cpp-basics.vixnote
```

Open a note on another port:

```bash id="xnrvnt"
vix note lessons/cpp-basics.vixnote --port 5180
```

Open the note UI as a desktop app:

```bash id="d00l0p"
vix note lessons/cpp-basics.vixnote --desktop
```

Export a lesson to HTML:

```bash id="rz978d"
vix note export lessons/cpp-basics.vixnote --out cpp-basics.html
```

Export a clean lesson without outputs:

```bash id="v5qez9"
vix note export lessons/cpp-basics.vixnote --out cpp-basics.html --no-outputs
```

Use JSON lifecycle events:

```bash id="fcbff1"
vix note lessons/cpp-basics.vixnote --json
```

Run quietly:

```bash id="cp8osa"
vix note lessons/cpp-basics.vixnote --quiet
```

## Note routes

When the note server is running, the main routes are:

| Route                | Purpose                  |
| -------------------- | ------------------------ |
| `/`                  | Vix Note UI              |
| `/api/document`      | Current document JSON    |
| `/api/cells/<i>/run` | Run one cell             |
| `/api/run-all`       | Run all executable cells |

## Common mistakes

### Passing a non-note file

Wrong:

```bash id="fudz5c"
vix note lesson.md
```

Correct:

```bash id="x2idmv"
vix note lesson.vixnote
```

`vix note` expects `.vixnote` files.

### Using a port outside the valid range

Wrong:

```bash id="e5vluj"
vix note --port 999999
```

Correct:

```bash id="inxy1p"
vix note --port 5179
```

The port must be between `1` and `65535`.

### Exporting without an output file

Wrong:

```bash id="kktge1"
vix note export lessons/pointers.vixnote
```

Correct:

```bash id="x8qikm"
vix note export lessons/pointers.vixnote --out pointers.html
```

### Expecting desktop mode on a build without UI shell support

```bash id="py8mhz"
vix note --desktop
```

Desktop mode requires the CLI to be built with UI shell support.

When it is not available, use browser/server mode:

```bash id="aiv31u"
vix note --browser
```

## Troubleshooting

### Note file not found

Check the path:

```bash id="jyron0"
vix note lessons/pointers.vixnote
```

The file must exist and must be a regular `.vixnote` file.

### The server cannot start

Use another port:

```bash id="p3xdh8"
vix note --port 5180
```

Another process may already be using the default port.

### Desktop shell unavailable

Use normal server mode:

```bash id="kktdfc"
vix note
```

Then open the printed local URL in your browser.

### Vix Note is not available in this build

The CLI must be built with Note support enabled.

```bash id="hwhz56"
cmake -S . -B build -DVIX_ENABLE_NOTE=ON
cmake --build build -j
```

## Difference between note modes

| Mode      | Command                                        | Purpose                                 |
| --------- | ---------------------------------------------- | --------------------------------------- |
| Workspace | `vix note`                                     | Start notes for the current directory   |
| File      | `vix note file.vixnote`                        | Open an existing note document          |
| Desktop   | `vix note --desktop`                           | Open the note UI inside a desktop shell |
| Export    | `vix note export file.vixnote --out file.html` | Export a note to standalone HTML        |

## Related commands

| Command       | Purpose                                 |
| ------------- | --------------------------------------- |
| `vix run`     | Build and run a Vix target              |
| `vix desktop` | Run a Vix web UI inside a desktop shell |
| `vix mobile`  | Generate and run a mobile WebView shell |
| `vix dev`     | Run a development server with reload    |

## Extension options

Vix Note discovers built-in, global, and project extensions when the workspace starts.

List detected extensions and exit:

```bash
vix note --list-extensions
```

Disable external extensions while keeping built-in cell types:

```bash
vix note --no-extensions
```

The built-in cell types are always available:

```txt
markdown
html
cpp
reply
```

Global extensions are read from `~/.vix/global/installed.json` or from `$VIX_GLOBAL_PREFIX/installed.json` when `VIX_GLOBAL_PREFIX` is set. Project extensions are discovered under `<project>/.vix/deps/`.

The local server exposes extension metadata to the UI through:

```txt
/api/extensions
```

This route is used by the browser to build the dynamic cell type picker. A document can keep a cell type such as `python` even when the extension is not currently available; Vix Note reports the runtime as unavailable instead of converting the cell to another type.

See [Creating Note Extensions](/modules/note/extensions) for the package author workflow.
