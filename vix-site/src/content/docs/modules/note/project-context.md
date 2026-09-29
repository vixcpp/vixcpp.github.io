# Project Context

Project context is the part of Vix Note that connects a notebook to the project around it.

A note can be opened as a simple standalone document, but it can also live inside a real Vix or C++ project. In that case, the notebook may need more than the `.vixnote` file itself. A C++ cell may need the project root, the current working directory, local headers, registry dependencies, or a manifest path. Project context gives the runtime a structured way to know where the note belongs.

```bash id="o6zc14"
cd my-project
vix note docs/notes/cpp-basics.vixnote
```

This keeps Vix Note useful for learning material, but also practical for project documentation and technical notes that need to run near real source code.

## Why project context matters

A simple C++ cell can run in an isolated temporary directory.

````md id="cy6mh9"
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

That is enough for many lessons. The cell includes what it uses, has its own `main()`, and can be executed through `vix run`.

Project notes are different. A note inside a project may need to include project headers, explain a real module, or run a small example against code that already exists in the project. In that case, running from a random temporary directory is not always enough. Vix Note needs to know where the project starts and which include paths are available.

## Detection

Vix Note can detect the project context from the note path.

```bash id="ydk9fe"
vix note docs/notes/architecture.vixnote
```

The detector starts from the note location and can walk through parent directories until it finds a project root. It recognizes common project markers used by Vix and normal source repositories.

```txt id="cv3sl2"
vix.app
vix.json
.vix
.git
CMakeLists.txt
```

The main Vix workflow is still driven by the CLI. These markers are used only so the note runtime can understand where the document is located and how to prepare execution context.

## What the context stores

A detected project context can include:

```txt id="ndp91g"
project name
note path
project root
working directory
manifest path
dependency directory
include paths
environment entries
```

The document itself still stores the note content. Project context is separate from the document because it describes the execution environment, not the note source. This separation keeps `.vixnote` files portable and readable while giving the runtime enough information to run cells in the right place.

## Working directory

When a project root is found, the project root becomes the natural working directory for project-aware execution.

```txt id="c1g38t"
my-project/
  vix.app
  include/
  src/
  docs/
    notes/
      architecture.vixnote
```

Opening the note from inside the project lets Vix Note understand that the note belongs to `my-project`.

```bash id="ai4b71"
cd my-project
vix note docs/notes/architecture.vixnote
```

This is useful when a C++ cell needs to run with paths relative to the project root instead of relative to the note file or a temporary directory.

## Include paths

Project context can add include paths that are useful for C++ cells.

By default, Vix Note can add the project `include/` directory when it exists. It can also detect the local dependency directory under `.vix/deps` and add include paths from installed dependencies.

```txt id="y93d2n"
my-project/
  include/
  .vix/
    deps/
```

This allows a project note to contain a small C++ cell that uses project-local headers.

````md id="j0mpyl"
<!-- vixnote:cell id="project-header" kind="cpp" title="Project header" -->

```cpp
#include <iostream>
#include "my_project/Greeter.hpp"

int main()
{
  Greeter greeter("Vix Note");

  std::cout << greeter.message() << std::endl;

  return 0;
}
```
````

The cell is still normal C++ code. Project context only helps the runner know where it should run and which include paths are relevant.

## Isolated and project-aware execution

C++ cells can run in a simple isolated mode or in a project-aware mode.

Isolated execution is good for lessons and small examples. The cell is written to a temporary file and executed through `vix run`. This keeps examples fast and independent.

Project-aware execution is useful when the cell belongs to a project and needs project-local headers or dependencies. In that mode, the runner uses the detected project context so the cell can run from the project root with the include paths that belong to the project.

The important rule is simple: use isolated execution for standalone learning notes, and use project-aware execution when the note is explaining or testing something that lives inside the project.

## Notes inside documentation folders

A common layout is to keep notes under a documentation directory inside the project.

```txt id="w1us8h"
my-project/
  vix.app
  include/
  src/
  docs/
    notes/
      overview.vixnote
      runtime.vixnote
      architecture.vixnote
```

From the project root, open a note with:

```bash id="cmoch5"
vix note docs/notes/runtime.vixnote
```

This keeps the notebook close to the code it explains. The note can be reviewed as a text file, run locally through the Vix Note UI, and exported later as static HTML.

## Export and project context

Export renders the current document state.

```bash id="u9c2o9"
vix note export docs/notes/runtime.vixnote --out docs/runtime.html
```

Export does not run cells. If the exported document should include fresh output from project-aware C++ cells, run the cells in the local UI first, then export the note.

```bash id="gwubfj"
vix note docs/notes/runtime.vixnote
vix note export docs/notes/runtime.vixnote --out docs/runtime.html
```

Use `--no-outputs` when the exported page should show the note source without runtime output.

```bash id="cg6zv3"
vix note export docs/notes/runtime.vixnote --out docs/runtime.html --no-outputs
```

## Programmatic detection

The public API exposes project detection for tools that need to inspect or prepare note execution manually.

```cpp id="kxc93z"
#include <vix/note/note.hpp>

int main()
{
  auto context =
      vix::note::detect_project_context("docs/notes/runtime.vixnote");

  if (!context.enabled)
  {
    return 1;
  }

  return context.has_project_root() ? 0 : 1;
}
```

For more control, use `ProjectDetector` and detection options.

```cpp id="fhe0cf"
#include <vix/note/note.hpp>

int main()
{
  vix::note::ProjectDetectOptions options;
  options.searchParents = true;
  options.detectDeps = true;
  options.includeProjectIncludeDirectory = true;

  vix::note::ProjectDetector detector(options);

  auto context =
      detector.detect("docs/notes/runtime.vixnote");

  return context.enabled ? 0 : 1;
}
```

This API is useful for tests and tools that build workflows around `.vixnote` documents. The normal user workflow remains the CLI.

## Using context with the kernel

Project context can be passed to the runtime options when a tool wants to execute a document with project-aware behavior.

```cpp id="t8fe49"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Project note");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Project-aware note" << std::endl;
  return 0;
})");

  auto context =
      vix::note::detect_project_context("docs/notes/project.vixnote");

  vix::note::NoteKernelOptions options;
  options.projectContext = context;
  options.cppOptions.enableProjectContext = true;

  vix::note::NoteKernel kernel(document, options);

  auto run = kernel.run_executable_cells();

  return run.ok ? 0 : 1;
}
```

The kernel still delegates C++ execution to the C++ cell runner. The context only changes the environment used by that runner.

## Common mistakes

### Expecting every note to need project context

A simple learning note does not need project-aware execution.

````md id="dqsc64"
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

Use project context when the note actually depends on project files, headers, or dependencies.

### Opening the note from the wrong place

When a note belongs to a project, open it from the project tree.

```bash id="azblyg"
cd my-project
vix note docs/notes/architecture.vixnote
```

This gives the detector the best chance to find the correct root.

### Writing cells that depend on unclear paths

A project-aware cell should still be readable. Include headers normally and keep paths understandable. The note should not require the reader to guess why a file can be found.

### Expecting export to run project-aware cells

Export renders the current state. It does not execute cells, project-aware or not.

```bash id="dkbo7x"
vix note export docs/notes/runtime.vixnote --out docs/runtime.html
```

Run the note before exporting when outputs matter.

## Next step

Continue with the local UI guide to understand how Vix Note serves the browser workspace and connects it to the document runtime.

[Open the local UI guide](/modules/note/local-ui)
