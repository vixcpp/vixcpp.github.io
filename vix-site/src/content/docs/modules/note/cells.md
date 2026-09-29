# Cells

A Vix Note document is built from cells.

Each cell owns a small piece of the note: an explanation, a C++ program, a Reply expression, or an HTML preview. The notebook UI renders every cell in order and gives executable cells a place to show their output. This is the main idea behind Vix Note: the explanation and the code stay close to the result, while the source file remains readable as a `.vixnote` document.

```bash id="tg4a30"
vix note lessons/cpp-basics.vixnote
```

Cells are not only a UI detail. They are the structure that connects the document format, the parser, the runtime, the local server, and the exporter.

## Cell types

Vix Note ships with four built-in cell types.

```txt id="jv1bva"
markdown
cpp
reply
html
```

Markdown cells are used for explanation. C++ cells are executed through the normal Vix runtime by delegating to `vix run`. Reply cells are evaluated through the embedded Reply runtime. HTML cells are rendered by the UI and the exporter.

The document model now treats the cell type as text. Extension packages can contribute additional ids such as `python` through `extensions.note`. Vix Note preserves unknown type ids instead of converting them to C++ or Markdown.

Only executable descriptors are run by the execution kernel. The built-in executable types are `cpp` and `reply`; extension types are executable only when their descriptor declares `executable: true` and a runtime is available.

## Markdown cells

Markdown cells are the writing layer of a note. They introduce a topic, explain a concept, describe what a code cell is doing, or give a short conclusion after an example.

```md id="lgeq97"
<!-- vixnote:cell id="intro" kind="markdown" -->

# Variables in C++

Variables store values that a program can reuse.
```

A Markdown cell should usually carry the reasoning of the note. The code cell that follows it should not be left to explain everything alone. Good notes are readable because the text and code support each other.

## C++ cells

C++ cells contain normal C++ programs.

````md id="c7gdx1"
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

When a C++ cell runs, Vix Note writes the cell source to a temporary `.cpp` file and executes it through `vix run`. The notebook does not create a separate compiler pipeline. It reuses the Vix CLI so notebook execution stays close to the normal way a developer runs small Vix or C++ programs.

In Vix Note lessons, `std::cout` is the right default for output because the notebook is often used to explain C++ itself. Readers already recognize it, and it keeps examples close to standard C++.

## Reply cells

Reply cells are for short interactive expressions.

````md id="vtc5fg"
<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```
````

A Reply cell is useful when the note needs a quick value, a small calculation, a simple object, or a short runtime helper. It should stay small. For longer interactive work, `vix repl` is still the better terminal workflow.

## HTML cells

HTML cells are rendered as HTML inside the local note UI.

````md id="qqtf39"
<!-- vixnote:cell id="html-preview" kind="html" title="HTML preview" -->

```html
<section style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="margin-top: 0;">Vix Note HTML Cell</h2>
  <p>This content is rendered inside the notebook workspace.</p>
</section>
```
````

HTML cells are useful for small visual explanations. They should remain focused and readable because the `.vixnote` file is still meant to be reviewed as text.

## Execution

The runtime only executes cells that can produce runtime output.

```txt id="j3jott"
cpp          executable
reply        executable
markdown     rendered only
html         rendered only
extension    executable when its descriptor and runtime allow it
```

When an executable cell runs, the result is attached to that cell in the active notebook session. The cell receives an execution count and a list of outputs. The UI can then render the output directly under the cell that produced it.

This is why a notebook can show a C++ program, its stdout, compiler errors, runtime errors, hints, or debug output in the same local workspace.

## Outputs

A cell can hold more than one output.

```txt id="nw6h90"
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

The runtime uses output kinds so the UI can present different results differently. Normal program output should not look the same as a compiler diagnostic. A beginner-friendly hint should not hide the raw log when the raw log is needed for debugging.

For example, a failed C++ cell can produce a compiler diagnostic, a hint, and the raw process output. A successful cell may only produce stdout.

## Execution counts

Executable cells receive an execution count when their result is applied to the document session.

The count starts at zero for cells that have not been executed. Each successful application of a result increments the document-level counter and assigns the new value to the cell. This gives the UI a simple way to show which cells have run during the current session.

Markdown and HTML cells do not receive execution counts because they are rendered, not executed.

## Cell ids

Each cell can have a stable id.

```md id="d1zlcr"
<!-- vixnote:cell id="vector-cpp" kind="cpp" title="vector example" -->
```

The id lets the parser, storage layer, UI routes, and runtime refer to the same cell across save and load cycles. A cell can move in the document, but its id can remain stable.

Use readable ids when writing `.vixnote` files by hand.

```txt id="kp5pnj"
intro
hello-cpp
quick-math
vector-cpp
takeaway
```

Readable ids make the document easier to maintain than generated names that do not describe the cell.

## Cell titles

The `title` attribute is optional.

```md id="k7gs3a"
<!-- vixnote:cell id="loop-cpp" kind="cpp" title="for loop example" -->
```

Use a title when the UI or exported document benefits from a visible label above the cell. C++ and Reply cells often benefit from titles because a short label helps the reader understand the purpose of the example before reading the code.

Markdown cells often do not need a title because their content already contains headings and paragraphs.

## A small complete note

````md id="mn5uay"
<!-- vixnote:cell id="intro" kind="markdown" -->

# C++ Variables

This note introduces a few simple variables.

<!-- vixnote:cell id="variables-cpp" kind="cpp" title="Variables example" -->

```cpp
#include <iostream>
#include <string>

int main()
{
  int age = 20;
  std::string language = "C++";

  std::cout << "Language: " << language << std::endl;
  std::cout << "Age: " << age << std::endl;

  return 0;
}
```

<!-- vixnote:cell id="quick-check" kind="reply" title="Quick check" -->

```reply
language = "C++"
println("Learning", language)
```

<!-- vixnote:cell id="takeaway" kind="markdown" -->

A variable has a type, a name, and a value.
````

Open the note:

```bash id="d5zlde"
vix note lessons/variables.vixnote
```

The UI renders the Markdown cells, lets the C++ and Reply cells run, and keeps the outputs next to the cells that produced them.

## Working with cells in C++

The public API exposes the same model used by the parser and runtime.

```cpp id="trmomc"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Variables");

  document.add_markdown("# Variables in C++");

  document.add_cpp(R"(#include <iostream>
#include <string>

int main()
{
  std::string language = "C++";

  std::cout << "Language: " << language << std::endl;
  return 0;
})");

  document.add_markdown("The output appears under the C++ cell.");

  return document.has_executable_cells() ? 0 : 1;
}
```

Most users work with cells through the local UI and `.vixnote` files. The C++ API is useful when a tool needs to create, inspect, execute, or export note documents programmatically.

## Common mistakes

### Making every section executable

A good note should not be only code cells. Markdown cells carry the explanation and give the reader context.

Use Markdown before or after code when the reason for the example is not obvious.

### Using C++ cells for tiny calculations

A full C++ program is useful when the note is explaining C++. For quick values or small calculations, a Reply cell is usually clearer.

````md id="y6tbds"
<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
= (10 + 5) * 2
```
````

### Writing large HTML blocks

HTML cells should support the lesson. If a visual block becomes too large, the source file becomes hard to review.

### Removing cell metadata

The metadata comment is what keeps the cell stable for the parser and UI.

```md id="ll3kqo"
<!-- vixnote:cell id="hello-cpp" kind="cpp" title="Hello C++" -->
```

Keep it when editing a `.vixnote` file by hand.

## Next step

Continue with the C++ cells guide to understand how Vix Note executes C++ code, captures output, and keeps notebook execution aligned with `vix run`.

[Open the C++ cells guide](/modules/note/cpp-cells)
