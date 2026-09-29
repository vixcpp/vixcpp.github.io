# HTML Cells

HTML cells are renderable cells inside Vix Note.

They are used when a note needs a small visual block that Markdown alone does not express well. An HTML cell can show a styled explanation, a compact preview, a small diagram placeholder, or a focused UI fragment directly inside the local notebook workspace.

```bash id="m8d1jf"
vix note lessons/html-cells.vixnote
```

HTML cells are not executable. They are rendered by the UI and by the HTML exporter. They belong to the presentation side of a note, while C++ and Reply cells belong to the execution side.

## A first HTML cell

An HTML cell is written as a fenced `html` block with Vix Note metadata above it.

````md id="q4jrdx"
<!-- vixnote:cell id="html-preview" kind="html" title="HTML preview" -->

```html
<section style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="margin-top: 0;">Vix Note HTML Cell</h2>
  <p>This content is rendered inside the notebook workspace.</p>
</section>
```
````

Open the note:

```bash id="mbhfel"
vix note lessons/html-cells.vixnote
```

The local UI renders the HTML cell as visual content. The source still remains readable in the `.vixnote` file because it is stored as a normal fenced block.

## When to use HTML cells

Use an HTML cell when the note needs a small visual explanation that should appear directly in the notebook.

A good HTML cell usually has a narrow purpose. It can highlight a concept, show a small layout, render a simple card, or make a lesson easier to understand. It should not replace the note UI, and it should not become a large application embedded inside the document.

````md id="zaz1iu"
<!-- vixnote:cell id="concept-card" kind="html" title="Concept card" -->

```html
<div style="padding: 14px; border: 1px solid #ddd; border-radius: 10px;">
  <strong>Key idea</strong>
  <p style="margin-bottom: 0;">
    A Vix Note document keeps explanation, code, and output close together.
  </p>
</div>
```
````

Markdown should still carry the main explanation. HTML should support the explanation when a small visual block makes the idea clearer.

## Rendered, not executed

HTML cells are rendered only.

```txt id="i03pcc"
markdown   rendered as documentation
html       rendered as HTML
cpp        executed through vix run
reply      executed through the embedded Reply runtime
```

The runtime kernel skips HTML cells because they do not produce execution results. They can appear between executable cells, but running all executable cells does not run or transform HTML content.

This keeps the model simple: HTML explains or visualizes; it does not execute code.

## Keep the source readable

A `.vixnote` file is meant to remain readable as text. This is one of the main reasons the format stays close to Markdown.

For that reason, keep HTML cells short and focused.

````md id="wem5sb"
<!-- vixnote:cell id="small-note" kind="html" title="Small note" -->

```html
<aside style="padding: 12px; border-left: 4px solid #888;">
  Remember: export renders the current document state. It does not run cells.
</aside>
```
````

A large HTML block may work in the UI, but it can make the source file difficult to review in Git. When the visual part becomes too large, the note usually needs a simpler explanation or a separate asset.

## HTML cells and export

HTML cells are included when a note is exported to HTML.

```bash id="q10qnc"
vix note export lessons/html-cells.vixnote --out lessons/html-cells.html
```

The exporter renders the note as a read-only document. Markdown cells become HTML, C++ and Reply cells are shown as source cells with optional outputs, and HTML cells are rendered as HTML content.

Export does not execute cells. It only renders the current document state.

```bash id="tlkv3e"
vix note export lessons/html-cells.vixnote --out lessons/html-cells.html --no-outputs
```

The `--no-outputs` option affects runtime outputs from executable cells. HTML cells remain part of the rendered document because they are source content, not runtime output.

## A complete note with HTML

````md id="zfxqde"
<!-- vixnote:cell id="intro" kind="markdown" -->

# HTML Cells

HTML cells are useful when a lesson needs a small visual explanation.

<!-- vixnote:cell id="visual-summary" kind="html" title="Visual summary" -->

```html
<section style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="margin-top: 0;">Vix Note</h2>
  <p>
    Markdown explains the idea, executable cells produce results, and HTML cells
    add small visual blocks when needed.
  </p>
</section>
```

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

Use HTML cells sparingly. They should make the note easier to understand, not harder to read.
````

Open it:

```bash id="oahyc1"
vix note lessons/html-cells.vixnote
```

Export it:

```bash id="e8yr80"
vix note export lessons/html-cells.vixnote --out lessons/html-cells.html
```

## Working with HTML cells in C++

The public API treats an HTML cell as a normal note cell with the `Html` kind.

```cpp id="wa1c5c"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("HTML cell example");

  document.add_markdown("# HTML Cells");

  document.add_html(R"(<section style="padding: 16px; border: 1px solid #ddd;">
  <h2>Vix Note</h2>
  <p>This HTML block is part of the note document.</p>
</section>)");

  return document.cell_count() == 2 ? 0 : 1;
}
```

The cell is stored in the document and rendered by the UI or exporter. It is not executed by the kernel.

## Common mistakes

### Treating HTML cells as executable cells

HTML cells are rendered. They are not run by the runtime kernel.

Use C++ cells for C++ execution:

````md id="q74n0t"
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

Use HTML cells for visual content:

````md id="u5t0vb"
<!-- vixnote:cell id="visual-note" kind="html" title="Visual note" -->

```html
<p>This is rendered as HTML.</p>
```
````

### Putting too much UI into one cell

A large HTML cell can make the note difficult to maintain. Keep the visual block small and let Markdown carry the main explanation.

### Forgetting that export renders HTML cells

HTML cells are part of the note source. They appear in exported HTML documents even when runtime outputs are disabled.

```bash id="osvyg6"
vix note export lessons/html-cells.vixnote --out lessons/html-cells.html --no-outputs
```

### Using HTML where Markdown is enough

Markdown is easier to read and review. Use HTML only when it adds something that Markdown cannot express clearly.

## Next step

Continue with the runtime guide to understand how Vix Note runs executable cells, applies outputs, and tracks execution state during a notebook session.

[Open the runtime guide](/modules/note/runtime)
