# Runtime

The Vix Note runtime is the part of the module that executes notebook cells and attaches the result back to the document session.

A `.vixnote` file stores the source of the note. The runtime handles what happens while the note is open: which cells have run, which outputs they produced, which execution count belongs to each cell, and whether a run failed or stopped early. This separation keeps the source file readable while still giving the local UI a real notebook execution model.

```bash id="q0b8xw"
vix note lessons/cpp-basics.vixnote
```

The runtime is built around a small set of types: `NoteKernel`, `NoteSession`, `CppCellRunner`, and `ReplyCellRunner`.

## Runtime model

A Vix Note document contains cells. The runtime only executes cells that are meant to run.

```txt id="x1q8wf"
markdown   rendered only
html       rendered only
cpp        executable
reply      executable
```

Markdown and HTML cells belong to the rendering side of the notebook. C++ and Reply cells belong to the execution side. When the user runs a cell, the runtime produces a `NoteResult`, then applies that result to the cell inside the current session.

The source file does not become a log file. Outputs are part of the active runtime state and can be shown in the UI or included in an export, but the `.vixnote` document stays focused on the source cells.

## NoteKernel

`NoteKernel` is the high-level execution coordinator.

It owns a `NoteSession`, delegates C++ cells to `CppCellRunner`, delegates Reply cells to `ReplyCellRunner`, and updates the document after each execution. The local UI and route layer use this kind of runtime behavior when a user runs one cell or all executable cells.

At the API level, a minimal kernel workflow looks like this:

```cpp id="gci4aw"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Runtime example");

  document.add_markdown("# Runtime example");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
})");

  vix::note::NoteKernel kernel(document);

  auto run = kernel.run_executable_cells();

  return run.ok ? 0 : 1;
}
```

Most users do not create a `NoteKernel` directly. They use `vix note`, and the local UI calls the runtime behind the scenes. The API matters when tests, tools, or future integrations need to execute note documents directly.

## NoteSession

`NoteSession` owns the mutable runtime state of one document.

The session stores the current `NoteDocument`, applies results to cells, tracks execution records, and manages output clearing. It does not compile or run code by itself. It only receives execution results from a higher-level runner and records them in the document.

When a result is applied to an executable cell, the session can clear the old outputs, attach the new outputs, increment the document execution counter, mark the cell as executed, and store a record of the run.

```txt id="trxokj"
run cell
  -> produce NoteResult
  -> apply result to NoteSession
  -> update cell outputs
  -> assign execution count
  -> store execution record
```

This gives the UI enough information to show which cells have run during the current notebook session.

## C++ cell execution

C++ cells are executed by `CppCellRunner`.

The runner does not implement a new C++ compiler pipeline. It writes the cell source to a temporary `.cpp` file and delegates execution to the Vix CLI with `vix run`.

```txt id="hr9zdy"
C++ cell source
  -> temporary .cpp file
  -> vix run <file>
  -> captured process result
  -> NoteResult outputs
```

This is an important design choice. Vix Note stays aligned with the normal Vix workflow instead of creating a second execution path for notebook code.

A C++ cell should usually be a complete small program:

````md id="y44ldy"
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

The output appears under the cell after execution.

```txt id="j0zeb3"
Hello from Vix Note
```

In Vix Note lessons, `std::cout` is the preferred output style because the notebook often teaches normal C++ concepts.

## Reply cell execution

Reply cells are executed by `ReplyCellRunner`.

The runner uses the embedded Vix Reply runtime. It does not start the full terminal REPL. This makes Reply cells suitable for short expressions, small values, calculator-style examples, and runtime helpers inside the notebook.

````md id="tzlhi8"
<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```
````

The result is captured and attached to the cell as notebook output.

```txt id="h1mg4t"
x = 7
```

Use `vix repl` when the user needs an open-ended terminal session. Use Reply cells when the interaction belongs inside a note.

## Outputs

A cell execution can produce several kinds of output.

```txt id="zlnrp9"
text
stdout
stderr
html
error
compiler_error
runtime_error
debug
hint
raw_log
```

The runtime keeps these categories because the UI should not treat every output as the same kind of text. Normal program output, compiler diagnostics, runtime errors, beginner hints, and raw logs have different meanings.

For example, a successful C++ cell may only produce `stdout`. A failed C++ cell may produce `compiler_error`, `hint`, and `raw_log`. A Reply cell may produce `stdout`, `stderr`, `error`, and optional debug metadata.

## Execution counts

Each executable cell starts with an execution count of `0`.

When a result is applied to a cell, the document-level counter increments and the cell receives the next count. This is session state. It tells the local UI that the cell has run during the current session.

```txt id="zvvdjl"
before run: execution_count = 0
after run:  execution_count = 1
next run:   execution_count = 2
```

Markdown and HTML cells do not receive execution counts because they are rendered, not executed.

## Run one cell

The runtime can run a single cell by index or by id.

```cpp id="rx5nyt"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Single cell");

  auto &cell = document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "single cell" << std::endl;
  return 0;
})");

  cell.set_id("single-cpp");

  vix::note::NoteKernel kernel(document);

  auto result = kernel.run_cell("single-cpp");

  return result.ok() ? 0 : 1;
}
```

If the cell does not exist, the runtime returns a failure result. If the cell exists but is Markdown or HTML, the runtime returns a skipped result because the cell is not executable.

## Run all executable cells

The runtime can also run executable cells in document order.

```cpp id="iiwrug"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Run all");

  document.add_markdown("# Run all");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "C++ cell" << std::endl;
  return 0;
})");

  document.add_reply(R"(println("Reply cell"))");

  vix::note::NoteKernel kernel(document);

  auto run = kernel.run_executable_cells();

  return run.ok ? 0 : 1;
}
```

`run_executable_cells()` runs only C++ and Reply cells. `run_all()` visits every cell and can optionally include Markdown and HTML cells as skipped results when the kernel options ask for that behavior.

The multi-cell result tracks how the run ended.

```txt id="pce610"
ok
stopped
visited
executed
skipped
failed
results
```

This gives the UI and tests a clear summary without requiring them to inspect every cell manually.

## Stop on first failure

The kernel can stop a multi-cell run after the first failed executable cell.

```cpp id="r3whd0"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Stop on failure");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "before failure" << std::endl;
  return 0;
})");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "missing semicolon" << std::endl
  return 0;
})");

  vix::note::NoteKernelOptions options;
  options.stopOnFirstFailure = true;

  vix::note::NoteKernel kernel(document, options);

  auto run = kernel.run_executable_cells();

  return run.has_failures() ? 0 : 1;
}
```

This behavior is useful for lessons or validation workflows where later cells depend on earlier cells being correct.

## Clearing outputs

The runtime can clear outputs without changing the source cells.

```cpp id="p0lvts"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Clear outputs");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "output" << std::endl;
  return 0;
})");

  vix::note::NoteKernel kernel(document);

  auto run = kernel.run_executable_cells();

  kernel.clear_outputs();

  return run.ok ? 0 : 1;
}
```

`clear_outputs()` removes the visible cell outputs. `reset_execution()` resets execution counts and execution records. `reset()` clears outputs, execution counts, and execution records together.

## Runtime records

`NoteSession` stores execution records for the current session.

A record contains the cell index, cell id, execution count, and the result produced by that execution. This is useful for tests, local UI behavior, and future tooling that needs to inspect what happened during a notebook run.

```cpp id="u5p0ds"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Records");

  document.add_reply(R"(println("recorded"))");

  vix::note::NoteKernel kernel(document);

  auto run = kernel.run_executable_cells();

  const auto &records = kernel.session().records();

  return run.ok && !records.empty() ? 0 : 1;
}
```

Execution records are runtime state. They are not written into the `.vixnote` source file by the first storage format.

## Project context

The runtime can use project context when C++ cells need to run inside a real Vix or C++ project.

The project detector can find a project root from markers such as `vix.app`, `vix.json`, `.vix`, `CMakeLists.txt`, or `.git`. The resulting context can provide a working directory, manifest path, dependency directory, and include paths.

```bash id="qgy7fr"
cd my-project
vix note docs/notes/runtime.vixnote
```

Project-aware execution is useful when a notebook cell needs project headers or registry dependencies. For simple lessons, isolated temporary execution is usually enough.

## Local UI routes

When `vix note` starts the local UI, the browser interacts with the runtime through local routes.

```txt id="fp7bn4"
/api/document
/api/cells/<i>/run
/api/run-all
```

The UI uses these routes to get the current document, run one cell, and run executable cells in order. Most users do not need to call these routes directly. They are part of the local server layer that connects the browser workspace to the runtime.

## Export and runtime state

Export renders the current document state. It does not execute cells.

```bash id="irlb6c"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Run the cells before exporting when the HTML page should include outputs. Use `--no-outputs` when the exported page should show the source cells without runtime results.

```bash id="bztfd4"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html --no-outputs
```

This keeps export predictable. It is a rendering step, not an execution step.

## Common mistakes

### Expecting Markdown and HTML cells to run

Markdown and HTML cells are rendered only. The runtime skips them because they do not produce execution results.

### Treating outputs as saved source

Outputs belong to the active notebook session. The `.vixnote` source file stays focused on Markdown, cell metadata, and fenced cell source.

### Expecting export to refresh results

Export does not run cells. Run the notebook first when the exported HTML should include current output.

### Making C++ cells depend on hidden state

C++ cells are best when they are complete small programs. Include what the cell uses and write a clear `main()` unless the note is intentionally explaining a different execution style.

### Using Reply for long scripts

Reply cells should stay small. Use C++ cells for real C++ examples and `vix repl` for open-ended interactive work.

## Next step

Continue with the project context guide to understand how Vix Note detects a project and how that context can affect C++ cell execution.

[Open the project context guide](/modules/note/project-context)
