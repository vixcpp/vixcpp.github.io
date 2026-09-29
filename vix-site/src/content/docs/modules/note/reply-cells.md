# Reply Cells

Reply cells are small executable cells inside Vix Note.

They are used for quick expressions, simple values, small calculations, JSON-like data, and runtime helpers. A Reply cell is lighter than a full C++ cell because it does not need a complete C++ program with includes and `main()`. This makes it useful when a note needs to explain an idea quickly before moving back to normal C++ code.

```bash id="s2m0ch"
vix note lessons/reply-basics.vixnote
```

Reply cells run through the embedded Vix Reply runtime. They do not start the full terminal REPL. The notebook evaluates the cell source, captures the result, and renders the output under the cell.

## A first Reply cell

A Reply cell is written as a fenced `reply` block with Vix Note metadata above it.

````md id="o1m66n"
<!-- vixnote:cell id="hello-reply" kind="reply" title="println" -->

```reply
println("Hello from Reply inside Vix Note")
```
````

When the cell runs, the output appears under the cell:

```txt id="w8frtb"
Hello from Reply inside Vix Note
```

Reply cells are good for notebook explanations because they keep small interactive checks close to the text. The reader does not need to leave the note just to see a value, test a short expression, or inspect a helper.

## When to use Reply cells

Use Reply cells when the note needs a small executable idea, not a full C++ example.

````md id="s9fc4z"
<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```
````

Use C++ cells when the lesson is about C++ syntax, program structure, the standard library, headers, classes, templates, or any example that should be read as a normal C++ program. Reply cells are better for quick values, small calculations, and lightweight notebook interaction.

## Calculator-style cells

Reply supports small calculator-style expressions.

````md id="fwc6hy"
<!-- vixnote:cell id="basic-math" kind="reply" title="Basic math" -->

```reply
calc 1 + 2 * 3
```
````

The short equals form is also useful inside a note:

````md id="dz3wqa"
<!-- vixnote:cell id="equals-shortcut" kind="reply" title="Equals shortcut" -->

```reply
= (10 + 5) * 2
```
````

These cells work well in lessons because they show the result without forcing the reader into a larger program.

## Variables

Reply cells can store simple values during the current note session.

````md id="mja0n8"
<!-- vixnote:cell id="simple-values" kind="reply" title="Simple values" -->

```reply
name = "Vix Note"
version = 1
ready = true

println("name =", name)
println("version =", version)
println("ready =", ready)
```
````

This is useful when a note needs to build a small idea step by step. Keep the state simple. A notebook should remain readable when reopened later, so a cell should not depend on a long hidden chain of previous evaluations unless the note clearly explains that flow.

## Inspecting values

Reply cells can be used to inspect values while teaching a concept.

````md id="rh1egx"
<!-- vixnote:cell id="types" kind="reply" title="Inspect types" -->

```reply
type(name)
type(version)
type(ready)
```
````

They can also be used for small conversions:

````md id="kwrt5k"
<!-- vixnote:cell id="convert-values" kind="reply" title="Convert values" -->

```reply
value = "42"
int(value)
str(42)
double(10)
```
````

This kind of cell is useful before a C++ section that introduces types, conversions, structs, or data validation.

## JSON-like values

Reply can work with simple structured values.

````md id="hni6zr"
<!-- vixnote:cell id="array-values" kind="reply" title="Arrays" -->

```reply
scores = [10, 20, 30]

println("first score =", scores[0])
println("scores count =", len(scores))
```
````

Object-style values are also useful in short examples:

````md id="qk3m9j"
<!-- vixnote:cell id="object-values" kind="reply" title="Objects" -->

```reply
user = {"name":"Gaspard","language":"C++","active":true}

println("name =", user.name)
println("language =", user.language)
println("active =", user.active)
```
````

This gives a note a simple way to introduce structured data before moving to C++ structs, classes, maps, or JSON handling.

## Runtime helpers

Reply exposes small runtime helpers that are safe to use inside Vix Note.

````md id="hmqi7k"
<!-- vixnote:cell id="cwd-helper" kind="reply" title="Current directory" -->

```reply
cwd()
```
````

````md id="cih1sc"
<!-- vixnote:cell id="pid-helper" kind="reply" title="Process id" -->

```reply
pid()
```
````

The `Vix` helper object can also expose runtime information:

````md id="t0v2la"
<!-- vixnote:cell id="vix-object" kind="reply" title="Vix helper object" -->

```reply
Vix.cwd()
Vix.pid()
Vix.args()
```
````

These helpers make it easier to understand where the note is running, especially when the note is opened inside a project.

## Output

Reply cell output is captured by the notebook runtime and attached to the cell.

```txt id="wsmvso"
stdout
stderr
error
debug
```

Normal output from `print()` or `println()` is shown as standard output. Errors are attached as error outputs. When debug mode is enabled by the runtime options, Vix Note can also attach metadata such as execution duration and exit code.

Most notes should not expose debug output by default. It is useful when developing the note module or diagnosing runtime behavior, but normal learning material should stay focused on the result the reader needs to understand.

## Reply cells and the terminal REPL

Reply cells are not a replacement for the full terminal REPL.

A Reply cell is part of a document. It should be short, repeatable, and connected to the explanation around it. The full REPL is better when the user wants an open-ended terminal session.

```bash id="c4qap4"
vix repl
```

Use Reply cells inside Vix Note when the result belongs to the lesson. Use `vix repl` when the work is exploratory and does not need to become part of a notebook document.

## A complete Reply note

````md id="wq0qfg"
<!-- vixnote:cell id="intro" kind="markdown" -->

# Reply Basics

Reply cells are small executable cells inside Vix Note.

They are useful for quick values, calculations, and simple structured data.

<!-- vixnote:cell id="hello-reply" kind="reply" title="println" -->

```reply
println("Hello from Reply inside Vix Note")
```

<!-- vixnote:cell id="math-reply" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```

<!-- vixnote:cell id="object-values" kind="reply" title="Object values" -->

```reply
user = {"name":"Gaspard","language":"C++","active":true}

println("name =", user.name)
println("language =", user.language)
println("active =", user.active)
```

<!-- vixnote:cell id="takeaway" kind="markdown" -->

Reply cells should stay small. Use C++ cells when the lesson needs a normal C++ program.
````

Open it with:

```bash id="l282rj"
vix note lessons/reply-basics.vixnote
```

## Programmatic execution

The public API can run Reply cells through the note runtime.

```cpp id="y0h0aj"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Reply cell example");

  document.add_reply(R"(x = 1 + 2 * 3
println("x =", x))");

  vix::note::NoteKernel kernel(document);
  auto result = kernel.run_executable_cells();

  return result.ok ? 0 : 1;
}
```

The API is useful for tests and tools that need to build or execute note documents directly. The normal user workflow remains the local UI started by `vix note`.

## Common mistakes

### Using Reply for full C++ examples

Reply is useful for small interactive values. Use a C++ cell when the example should teach C++ syntax, headers, `main()`, classes, vectors, or the standard library.

### Making a Reply cell too large

A Reply cell should usually explain one small idea. Long scripts become hard to read inside a notebook and should be split into smaller cells with Markdown between them.

### Depending on hidden state

Reply variables can be useful during a session, but a note should still be understandable when read from top to bottom. When a cell depends on a previous cell, make that relationship clear in the surrounding Markdown.

### Using Reply cells instead of `vix repl`

Use `vix repl` for open-ended terminal interaction.

```bash id="dixf0k"
vix repl
```

Use Reply cells when the interaction belongs inside a `.vixnote` document.

## Next step

Continue with the HTML cells guide to see how Vix Note renders small visual blocks inside a local notebook document.

[Open the HTML cells guide](/modules/note/html-cells)
