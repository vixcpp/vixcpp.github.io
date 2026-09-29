# Document Format

A Vix Note document is stored as a `.vixnote` file.

The format is intentionally close to Markdown. A note can be opened in the Vix Note UI, executed by the local runtime, exported to HTML, and still remain readable in a normal editor. This is important because lessons, project notes, and technical documents should be easy to review in Git without depending on a binary notebook format.

## Basic structure

A `.vixnote` file is made of cells. Each cell starts with a small metadata comment, followed by the cell source.

````md id="ez22th"
<!-- vixnote:cell id="intro" kind="markdown" -->

# C++ Basics

This note explains a small C++ program.

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

The metadata comment tells Vix Note where a cell starts, what kind of cell it is, and which stable id belongs to it. The content after the comment is still normal Markdown or a normal fenced code block.

## Cell metadata

The metadata comment uses this form:

```md id="hp5whe"
<!-- vixnote:cell id="cell-id" kind="cpp" title="Optional title" -->
```

The `id` is used to keep the cell stable across save and load cycles. The `kind` tells the parser how the cell should behave. The optional `title` is used by the UI and exporters when a cell needs a visible label.

A simple Markdown cell looks like this:

```md id="eqf9j4"
<!-- vixnote:cell id="intro" kind="markdown" -->

# Introduction

This is a normal Markdown explanation.
```

A C++ cell looks like this:

````md id="p4kn0w"
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

## Supported cell kinds

Vix Note understands these cell kinds:

```txt id="y61x9k"
markdown
cpp
reply
html
```

Markdown cells are documentation cells. C++ cells are executed through the Vix runtime by delegating to `vix run`. Reply cells are evaluated by the embedded Reply runtime. HTML cells are rendered by the local UI and by the HTML exporter.

The parser also accepts a few language aliases inside fenced blocks:

```txt id="pt2o51"
markdown  md
reply     repl
cpp       c++
html      html
```

Unknown fenced languages are preserved as Markdown content instead of being treated as executable cells. This keeps the format forgiving when a note contains a code block that is only meant to be displayed.

## Markdown cells

Markdown cells are written as normal text. They explain the topic, introduce a code cell, or describe the result after execution.

```md id="kagnf7"
<!-- vixnote:cell id="intro" kind="markdown" -->

# Variables in C++

Variables store values that a program can reuse.
```

Markdown cells are not executed. They are rendered by the UI and by the exporter.

## C++ cells

C++ cells are written as fenced `cpp` blocks.

````md id="pcvlta"
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
````

In Vix Note lessons, `std::cout` is the natural default for C++ output. The notebook is often used to teach or explain C++ itself, so examples should stay close to the standard language and standard library that readers already know.

## Reply cells

Reply cells are written as fenced `reply` blocks.

````md id="m7k0pg"
<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```
````

Reply cells are useful for quick values, simple calculations, and small interactive examples. They are designed for short notebook interactions, while `vix repl` remains the full terminal workflow.

## HTML cells

HTML cells are written as fenced `html` blocks.

````md id="si7l03"
<!-- vixnote:cell id="html-preview" kind="html" title="HTML preview" -->

```html
<section style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="margin-top: 0;">Vix Note</h2>
  <p>This block is rendered inside the notebook workspace.</p>
</section>
```
````

HTML cells are rendered by the UI. They are useful for small visual explanations, but they should stay readable in the source file. A `.vixnote` document should not become difficult to review because one HTML cell is too large.

## Stable cell ids

Cell ids are part of the document format because the UI and runtime need a stable way to refer to a cell. A cell may move, its source may change, or its title may be edited, but its id can remain the same.

```md id="qls14i"
<!-- vixnote:cell id="vector-cpp" kind="cpp" title="vector example" -->
```

Use clear ids that describe the role of the cell:

```txt id="aa88ey"
intro
hello-cpp
vector-cpp
takeaway
quick-math
html-preview
```

The id does not need to be long. It only needs to be stable and understandable.

## Titles

The `title` attribute is optional.

```md id="wzlhat"
<!-- vixnote:cell id="loop-cpp" kind="cpp" title="for loop example" -->
```

Use titles when the UI or exported document benefits from a visible label above the cell. For short Markdown explanations, a title is often unnecessary because the Markdown content already has its own heading or paragraph.

## Document title

When parsing a note, Vix Note can infer the document title from the first Markdown heading.

```md id="xnlov1"
<!-- vixnote:cell id="intro" kind="markdown" -->

# C++ Basics
```

This keeps the file simple. The document does not need a separate front matter block just to have a title.

## Outputs and saved files

Runtime outputs are not persisted in the first `.vixnote` storage format.

This means the saved file keeps the source of the note: Markdown text, C++ cells, Reply cells, HTML cells, and metadata. Outputs are part of the current runtime session and can be rendered in the UI or included during export when they are present, but the main source file stays clean and readable.

This design avoids turning the note file into a large generated artifact. The source remains the thing developers edit and review.

## Save and load behavior

When a note is loaded, the parser reads the metadata comments and reconstructs the document as an ordered list of cells. When a note is saved, the storage layer writes the document back into the same Markdown-compatible format.

A saved C++ cell is written like this:

````md id="eyxw0d"
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

The storage layer writes source cells. It does not write runtime output into the file.

## A complete example

````md id="gk7j2m"
<!-- vixnote:cell id="intro" kind="markdown" -->

# C++ Basics

This note keeps the explanation, code, and output close together.

<!-- vixnote:cell id="hello-cpp" kind="cpp" title="Hello C++" -->

```cpp
#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
}
```

<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```

<!-- vixnote:cell id="html-preview" kind="html" title="HTML preview" -->

```html
<section style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="margin-top: 0;">Vix Note</h2>
  <p>This content is rendered inside the notebook workspace.</p>
</section>
```

<!-- vixnote:cell id="takeaway" kind="markdown" -->

The note remains readable as text and executable through the Vix Note UI.
````

Open it with:

```bash id="iy5656"
vix note lessons/cpp-basics.vixnote
```

Export it with:

```bash id="moa0yq"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

## Common mistakes

### Removing metadata comments

The note may still be readable as Markdown, but the UI loses the stable cell information.

```md id="zfj9zi"
<!-- vixnote:cell id="hello-cpp" kind="cpp" title="Hello C++" -->
```

Keep metadata comments when editing `.vixnote` files by hand.

### Using generated ids everywhere

A generated id works, but readable ids make the document easier to maintain.

```txt id="antq2y"
cell-1
cell-2
cell-3
```

A lesson is easier to review with ids that describe the content.

```txt id="skpq7n"
intro
variables-cpp
takeaway
```

### Saving outputs into the source file

The `.vixnote` file should stay focused on source content. Runtime outputs belong to the live session or to exported HTML, not to the editable note source.

### Making HTML cells too large

HTML cells are useful, but a large HTML block can make the note hard to review. Keep visual cells small and focused.

## Next step

Continue with the cells guide to understand how Markdown, C++, Reply, and HTML cells behave inside the notebook.

[Open the cells guide](/modules/note/cells)
