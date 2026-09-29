# C++ Cells

C++ cells are executable notebook cells inside Vix Note.

They are used when a note needs to explain C++ code and show the result next to the source that produced it. A C++ cell contains a normal C++ program, usually with its own `main()` function, includes, local variables, and output written with `std::cout`.

```bash id="m4bq61"
vix note lessons/cpp-basics.vixnote
```

The important point is that Vix Note does not create a separate C++ execution model. When a C++ cell runs, Vix Note writes the cell source to a temporary `.cpp` file and runs it through the normal Vix CLI with `vix run`. This keeps notebook execution close to the way a developer already runs small C++ files from the terminal.

## A first C++ cell

A C++ cell is written as a fenced `cpp` block with Vix Note metadata above it.

````md id="ajk91f"
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

Open the note:

```bash id="d5jvty"
vix note lessons/cpp-basics.vixnote
```

Run the cell from the local UI. The expected output is:

```txt id="s8m4lg"
Hello from Vix Note
```

For Vix Note lessons, `std::cout` is the right default. The notebook is often used to teach C++ itself, and `std::cout` is more familiar to C++ readers than Vix-specific helpers.

## How execution works

When the user runs a C++ cell, the runtime follows a simple flow.

```txt id="cy0u68"
cell source
  -> temporary .cpp file
  -> vix run <file>
  -> captured output
  -> cell outputs in the note session
```

This design keeps the notebook small and predictable. The C++ cell runner does not implement a new compiler pipeline. It delegates execution to the same CLI path used outside the notebook, then classifies the result so the UI can show stdout, stderr, compiler errors, runtime errors, hints, debug output, or raw logs under the cell.

## Write complete examples

A C++ cell should usually be a complete small program.

````md id="r5z3gg"
<!-- vixnote:cell id="variables-cpp" kind="cpp" title="Variables example" -->

```cpp
#include <iostream>
#include <string>

int main()
{
  int age = 20;
  double price = 12.5;
  std::string language = "C++";

  std::cout << "Language: " << language << std::endl;
  std::cout << "Age: " << age << std::endl;
  std::cout << "Price: " << price << std::endl;

  return 0;
}
```
````

This makes the note easier to understand because the cell can be read and copied as a normal C++ program. It also keeps the execution model clear: each cell is compiled and run as its own source file.

## Use C++ cells for real C++ concepts

C++ cells are best when the code itself is the lesson.

````md id="gmsx8e"
<!-- vixnote:cell id="vector-cpp" kind="cpp" title="vector example" -->

```cpp
#include <iostream>
#include <vector>

int main()
{
  std::vector<int> numbers{2, 4, 6};

  numbers.push_back(8);

  for (int value : numbers)
  {
    std::cout << value << std::endl;
  }

  return 0;
}
```
````

Use a Reply cell instead when the note only needs a quick calculation or a small value. A full C++ program is useful when the syntax, type system, standard library, or program structure matters.

## Output

Normal program output is captured and shown under the cell.

```txt id="mqc089"
2
4
6
8
```

The runtime can store different output kinds for the same cell. This matters because a successful program output, a compiler diagnostic, and a runtime failure should not be presented as the same kind of text.

```txt id="k39fcd"
stdout
stderr
compiler_error
runtime_error
hint
debug
raw_log
```

Most successful C++ cells only produce stdout. Failed cells may produce compiler diagnostics and hints.

## Compiler errors

A C++ cell can fail before the program runs. In that case, Vix Note captures the compiler output and attaches it to the cell result.

````md id="j47rrz"
<!-- vixnote:cell id="missing-semicolon" kind="cpp" title="compiler error" -->

```cpp
#include <iostream>

int main()
{
  std::cout << "Missing semicolon" << std::endl
  return 0;
}
```
````

The UI can show the compiler diagnostic near the cell that failed. When enabled, the runner can also add simple hints for common beginner mistakes. These hints are not a replacement for the compiler output; they only make the error easier to approach in a learning note.

## Runtime errors

A program can compile and still fail while running. Vix Note treats that as a runtime failure and attaches the result to the cell.

````md id="owuxc6"
<!-- vixnote:cell id="runtime-error" kind="cpp" title="runtime failure" -->

```cpp
#include <iostream>
#include <vector>

int main()
{
  std::vector<int> values{1, 2, 3};

  std::cout << values.at(10) << std::endl;

  return 0;
}
```
````

The runtime result can include stderr, a runtime error output, a process exit code, and optional debug metadata. This gives the note enough information to explain what happened without hiding the original failure.

## Project-aware C++ cells

By default, C++ notebook cells can run in an isolated temporary location. This is fast and works well for simple lessons.

When a note is used inside a real project, Vix Note can also use project context. The project detector looks for markers such as `vix.app`, `vix.json`, `.vix`, `CMakeLists.txt`, or `.git`, then builds a context with the project root, working directory, dependency directory, manifest path, and include paths.

```bash id="ousqfo"
cd my-project
vix note docs/notes/architecture.vixnote
```

Project-aware execution matters when a cell needs project headers or registry dependencies. In that mode, the C++ runner can execute from the detected project root instead of treating the cell as a completely isolated file.

## Use includes normally

A C++ cell should include what it uses.

````md id="s6tj7a"
<!-- vixnote:cell id="algorithm-cpp" kind="cpp" title="algorithm example" -->

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main()
{
  std::vector<int> values{5, 1, 4, 2, 3};

  std::sort(values.begin(), values.end());

  for (int value : values)
  {
    std::cout << value << " ";
  }

  std::cout << std::endl;

  return 0;
}
```
````

This keeps each cell self-contained. A reader should not need to guess which earlier cell introduced an include or a type unless the note is intentionally teaching session behavior through another runtime.

## Keep examples focused

A good C++ cell should be long enough to show the idea, but not so long that the explanation disappears inside the code.

For a lesson, this is usually better:

````md id="v07gpa"
<!-- vixnote:cell id="function-cpp" kind="cpp" title="Function example" -->

```cpp
#include <iostream>

int add(int a, int b)
{
  return a + b;
}

int main()
{
  int result = add(3, 4);

  std::cout << "3 + 4 = " << result << std::endl;

  return 0;
}
```
````

A larger program should usually be moved into a project source file, then the note can explain the important part or show a smaller reproduction.

## Run all executable cells

The UI can run one C++ cell or all executable cells in document order. At the runtime level, `cpp` and `reply` cells are executable, while Markdown and HTML cells are rendered only.

```txt id="bgy0fc"
markdown   rendered
cpp        executed
reply      executed
html       rendered
```

When all executable cells run, the kernel visits the document in order, applies outputs to each executed cell, and records execution counts for the current session.

## Exporting C++ cell output

Export renders the current document state. It does not run C++ cells during export.

```bash id="diuxsl"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Run the cells first when the exported HTML should contain current output. Export without outputs when the page should show only the explanation and source cells:

```bash id="oasock"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html --no-outputs
```

## Programmatic execution

The C++ API can execute C++ cells through the note runtime.

```cpp id="gsui0z"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("C++ cell example");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Hello from a C++ cell" << std::endl;
  return 0;
})");

  vix::note::NoteKernel kernel(document);
  auto result = kernel.run_executable_cells();

  return result.ok ? 0 : 1;
}
```

Most documentation should start from the CLI and the local UI. The API is useful when another tool needs to build or run note documents directly.

## Common mistakes

### Using `vix::print` in learning notebooks

For Vix Note C++ lessons, use `std::cout`.

```cpp id="ikm59d"
#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
}
```

This keeps the note close to standard C++ and makes it easier for readers who are learning the language.

### Writing a fragment instead of a program

A C++ cell should usually be complete.

```cpp id="gkpjmp"
std::cout << "Hello" << std::endl;
```

Use a full program instead:

```cpp id="eoa3e1"
#include <iostream>

int main()
{
  std::cout << "Hello" << std::endl;
  return 0;
}
```

### Expecting export to execute the cell

Export only renders the current note state.

```bash id="shj4gx"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Run the cell in the notebook before exporting when the HTML should include its output.

### Making one cell too large

A notebook cell should explain one idea clearly. Split large examples into smaller cells with Markdown between them when the reader needs guidance.

## Next step

Continue with the Reply cells guide to see how small interactive cells fit beside C++ programs inside a Vix Note document.

[Open the Reply cells guide](/modules/note/reply-cells)
