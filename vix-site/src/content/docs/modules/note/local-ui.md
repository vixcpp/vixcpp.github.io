# Local UI

Vix Note runs as a local notebook workspace.

When you start a note, Vix loads the `.vixnote` document, starts a small local server, serves the notebook UI, and connects the browser to the note runtime. The UI is where the document becomes interactive: Markdown cells are rendered, HTML cells are displayed, and executable cells can be run with their output shown directly under the cell.

```bash id="flh32n"
vix note lessons/cpp-basics.vixnote
```

The local UI is not a hosted service. It is a local development tool for writing, learning, testing small examples, and preparing notes that can later be exported to HTML.

## Start the UI

Open an existing note:

```bash id="e48szj"
vix note lessons/cpp-basics.vixnote
```

Start an empty workspace from the current directory:

```bash id="kz2h3p"
vix note
```

Use another port when the default port is already busy:

```bash id="s4jitv"
vix note lessons/cpp-basics.vixnote --port 5180
```

When the command starts, the server builds a local URL from the configured host and port. By default, the note server uses a loopback address.

```txt id="cy58fm"
http://127.0.0.1:5179
```

The exact URL can change when another port is selected.

## What the UI does

The UI gives the note a browser workspace while keeping the source file as a readable `.vixnote` document.

It loads the current document, renders cells in order, lets executable cells run, and receives runtime output from the local server. This makes the notebook useful without changing the way the document is stored on disk.

```txt id="khl15q"
.vixnote file
  -> NoteStore loads the document
  -> NoteServer serves the UI
  -> NoteRoutes expose local API endpoints
  -> NoteKernel runs executable cells
  -> outputs are attached to the active session
```

The browser is only the interface. The document model, parser, storage, runtime, and exporter remain part of the C++ module.

## Cell behavior in the UI

The UI treats each cell according to its kind.

```txt id="c7pww2"
markdown   rendered as documentation
html       rendered as HTML
cpp        executed through vix run
reply      executed through the embedded Reply runtime
```

Markdown cells explain the note. HTML cells render small visual blocks. C++ and Reply cells can be executed from the UI, and their outputs appear under the cell that produced them.

A C++ cell remains normal C++:

````md id="uc7y11"
<!-- vixnote:cell id="hello-cpp" kind="cpp" title="Hello C++" -->

```cpp
#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
}
```
````

When this cell runs, Vix Note delegates execution to `vix run` and captures the result for the current notebook session.

## Local server routes

The local server exposes routes used by the browser UI.

```txt id="la57ou"
/                   notebook UI
/api/document       current document state
/api/cells/<i>/run  run one cell by index
/api/run-all        run executable cells in order
```

These routes are mainly internal to the local UI. A normal user starts the workspace with `vix note` and interacts through the browser. The routes matter because they show how the UI is connected: the browser does not compile or execute cells by itself; it asks the local note server, and the server uses the note runtime.

## Document loading

When the UI starts with a file path, Vix Note loads the file through the storage layer.

```bash id="fy5nkw"
vix note lessons/cpp-basics.vixnote
```

The storage layer reads the file, parses the `.vixnote` format, and gives the server a `NoteDocument`. The document path is kept so the UI and server know where the note came from.

Starting without a file opens an untitled workspace:

```bash id="l2y78w"
vix note
```

This is useful for quick experiments or drafting a note before saving it.

## Running one cell

The UI can run a single executable cell.

```txt id="xhb0uo"
/api/cells/<i>/run
```

The route receives the cell index, asks the runtime to execute it, then returns the result. If the cell is C++, the C++ runner writes the source to a temporary file and executes it through `vix run`. If the cell is Reply, the embedded Reply runtime evaluates it. Markdown and HTML cells are rendered only and are not executed.

## Running all executable cells

The UI can also run all executable cells in document order.

```txt id="zqff43"
/api/run-all
```

This is useful when a note has several examples and the reader wants to refresh the outputs in one action. The runtime visits the document, runs C++ and Reply cells, applies outputs to each cell, and records execution counts for the current session.

The run does not change Markdown or HTML cells. They remain part of the rendered document.

## Assets

The local UI is served with Vix Note assets.

```txt id="ass1ot"
index.html
css/note.css
js/note.js
```

Vix Note can serve embedded assets as a fallback, which means the UI can start without requiring a separate frontend build step. During development or installation, assets can also be loaded from a directory. This keeps the local UI practical for normal use while still allowing the interface to evolve as real files during development.

The asset resolver can check a custom directory, the `VIX_NOTE_ASSET_DIR` environment variable, and the installed asset directory. When disk assets are incomplete, embedded assets can remain available as fallback.

## Browser and desktop mode

The normal local UI opens in a browser.

```bash id="k1ptm2"
vix note lessons/cpp-basics.vixnote
```

When the build supports it, Vix Note can also open the workspace in a desktop shell:

```bash id="qmv4gx"
vix note lessons/cpp-basics.vixnote --desktop
```

The notebook model is the same. The difference is only the container used to display the local UI.

## Quiet and JSON usage

The CLI can be used in quieter workflows when the caller does not want normal terminal output.

```bash id="bf07ji"
vix note lessons/cpp-basics.vixnote --quiet
```

For tooling, JSON output can be useful:

```bash id="ts10hv"
vix note lessons/cpp-basics.vixnote --json
```

These options are mostly useful around automation or scripts. For normal writing, the plain command is enough.

## Local UI and export

The local UI is where a note is edited and executed. Export is a separate read-only rendering step.

```bash id="frz9ll"
vix note lessons/cpp-basics.vixnote
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Export does not start a live notebook workspace and does not execute cells. It renders the current document state to HTML. Run the cells in the local UI first when the exported page should include fresh output.

```bash id="yg3hbp"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html --no-outputs
```

Use `--no-outputs` when the exported page should show the note source without runtime results.

## Programmatic server usage

The public API exposes a local server facade for tests and integrations.

```cpp id="lu0arm"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Local UI");

  document.add_markdown("# Local UI");
  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
})");

  vix::note::NoteServer server(document);

  auto response = server.get("/api/document");

  return response.statusCode == 200 ? 0 : 1;
}
```

Most users do not need this API directly. It exists so the local server behavior can be tested and reused without always opening a network port.

## Common mistakes

### Treating the UI as the source of truth

The source of the note is the `.vixnote` file. The UI is the workspace for editing, rendering, and execution.

### Expecting the browser to run C++ code

C++ execution happens in the local runtime through the Vix CLI. The browser asks the local server to run a cell; it does not compile or run C++ itself.

### Expecting export to behave like the live UI

Export renders a static document. It does not provide the interactive notebook runtime.

```bash id="c1zv5d"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

### Editing generated assets instead of source assets

During development, edit the real UI asset files. Embedded assets are fallback content used so the note server can still start in installed or minimal environments.

### Using a busy port

Use `--port` when the default port is already in use.

```bash id="dc5bas"
vix note lessons/cpp-basics.vixnote --port 5180
```

## Next step

Continue with the export guide to understand how Vix Note turns a notebook document into a standalone HTML page.

[Open the export guide](/modules/note/export)
