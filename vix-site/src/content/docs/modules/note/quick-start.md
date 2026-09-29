# Quick Start

This guide creates a small Vix Note document, opens it in the local notebook UI, runs a C++ cell, and exports the note as a static HTML page.

A Vix Note document is a `.vixnote` file. The file remains readable as Markdown, but it can also contain executable C++ cells, Reply cells, and small HTML cells. The local UI gives the document a notebook workspace without moving the project away from the normal Vix workflow.

## Create a note file

Create a directory for the note:

```bash id="tenjqc"
mkdir -p lessons
```

Create a first `.vixnote` file:

````bash id="l2p8kg"
cat > lessons/cpp-basics.vixnote <<'NOTE'
<!-- vixnote:cell id="intro" kind="markdown" -->
# C++ Basics

This note keeps a short explanation, a C++ program, and its output in the same place.

<!-- vixnote:cell id="hello-cpp" kind="cpp" title="Hello C++" -->
```cpp
#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
}
```

<!-- vixnote:cell id="takeaway" kind="markdown" -->
The output appears under the cell after the program runs.
NOTE
````

The file is still readable as text. Markdown cells are written as normal Markdown. C++ cells are written as fenced `cpp` blocks with Vix Note metadata above them.

## Open the notebook

Open the note in the local UI:

```bash id="ovcgal"
vix note lessons/cpp-basics.vixnote
```

Vix starts a local notebook server and opens the workspace in the browser when supported. The note file is loaded into the UI, where each cell can be edited and executable cells can be run.

Use another port when the default one is already busy:

```bash id="x7roui"
vix note lessons/cpp-basics.vixnote --port 5180
```

## Run the C++ cell

In the UI, run the `Hello C++` cell. Vix Note writes the cell source to a temporary C++ file and delegates execution to the normal Vix CLI through `vix run`.

That detail matters because the notebook does not create a separate C++ execution model. A C++ cell is still normal C++ code, and in learning notes it is natural to use `std::cout` because most readers already know it.

The expected output is:

```txt id="sjdqtx"
Hello from Vix Note
```

## Start an empty workspace

A note file is not required when starting the workspace.

```bash id="fkzzwe"
vix note
```

This starts a local note workspace from the current directory. It is useful for quick experiments or for drafting a new notebook before saving it as a `.vixnote` file.

## Add a Reply cell

Reply cells are useful for small expressions and short interactive examples. Add another cell to the file:

````md id="n735pg"
<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```
````

Open the note again or refresh the UI after saving the file:

```bash id="q3czkx"
vix note lessons/cpp-basics.vixnote
```

Reply cells are meant for small notebook interactions. For a full terminal session, use `vix repl`.

## Add an HTML cell

HTML cells are rendered by the note UI. They are useful for small visual explanations inside a lesson.

````md id="d7gpsx"
<!-- vixnote:cell id="html-preview" kind="html" title="HTML preview" -->

```html
<section style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="margin-top: 0;">Vix Note</h2>
  <p>This content is rendered inside the notebook workspace.</p>
</section>
```
````

Keep HTML cells small. They should support the explanation without making the source file difficult to read.

## Export the note

Export the note to a standalone HTML file:

```bash id="gp6evp"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

The exporter renders the note as a static page. It does not run the cells during export. Run the cells first when the exported document should contain fresh outputs.

Export without outputs:

```bash id="vhrmqq"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html --no-outputs
```

This is useful when the HTML page should show the explanation and source cells without showing the current runtime results.

## Use a note inside a project

Vix Note can detect project context when a note is opened from inside a Vix or C++ project. It looks for project markers such as `vix.app`, `vix.json`, `.vix`, `CMakeLists.txt`, or `.git`.

```bash id="f46fgr"
cd my-project
vix note docs/notes/architecture.vixnote
```

This allows project-aware execution to use the project root, working directory, manifest, dependency directory, and include paths when the runtime is configured to use the detected context.

## Common mistakes

### Expecting export to run cells

Export renders the document state. It does not execute cells.

```bash id="k6f7gr"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Run the notebook cells before exporting when the HTML page should contain fresh output.

### Treating a `.vixnote` file as a binary notebook

A `.vixnote` file is a text document. Keep it readable. Markdown text, fenced code blocks, and Vix Note metadata should remain simple enough to review in Git.

### Using `vix::print` for beginner C++ notebook examples

In Vix Note lessons, prefer normal C++ output with `std::cout`.

```cpp id="mqlx7z"
#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
}
```

`vix::print` is useful in other Vix examples, but a notebook used to teach C++ should stay close to the language and standard library that readers already recognize.

## Command summary

```bash id="lnnsqq"
vix note
vix note lessons/cpp-basics.vixnote
vix note lessons/cpp-basics.vixnote --port 5180
vix note lessons/cpp-basics.vixnote --desktop

vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html --no-outputs
```

## Next step

Continue with the document format guide to understand how `.vixnote` files are structured and how Vix Note preserves cells across save and load cycles.

[Open the document format guide](/modules/note/document-format)
