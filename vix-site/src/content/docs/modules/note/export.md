# Export

Vix Note can export a note document to HTML.

Export is the read-only side of the notebook workflow. The local UI is used to write and run a note; export turns the document into a static HTML file that can be shared, archived, or published as documentation. It keeps the note readable outside the live notebook server while preserving the structure of the document: Markdown explanations, source cells, HTML cells, and optional outputs when they are present in the document state.

```bash id="bh2vfx"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Export does not execute cells. It renders the note as it is.

## Basic export

Export a `.vixnote` file to a standalone HTML page:

```bash id="clv89v"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

The output file is a static HTML document. It can be opened in a browser without starting the Vix Note local server.

```bash id="mttw2f"
xdg-open lessons/cpp-basics.html
```

On systems where `xdg-open` is not available, open the generated file from the file manager or browser.

## What gets exported

The exporter renders the note document into HTML.

```txt id="rx9vf0"
markdown cells  -> rendered as document text
cpp cells       -> rendered as source cells
reply cells     -> rendered as source cells
html cells      -> rendered as HTML content
outputs         -> rendered when included and present
```

Markdown cells become readable document content. C++ and Reply cells are shown as code cells. HTML cells are rendered as part of the page. Outputs can be included when the document state contains them and the export options allow them.

The exported page is not an interactive notebook. It is a static representation of the note.

## Export does not run cells

This is the most important rule.

```bash id="xllqk9"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

This command loads the note and renders it. It does not compile C++ cells, it does not evaluate Reply cells, and it does not refresh outputs before writing the HTML file.

Run the note first when the result matters:

```bash id="qv7vmu"
vix note lessons/cpp-basics.vixnote
```

Then export the document after the note has the state you want to share. In workflows where the exporter receives a document that already contains outputs, those outputs can be rendered. A saved `.vixnote` source file normally stays focused on cell source, so the export command should be treated as a rendering command, not as an execution command.

## Export without outputs

Use `--no-outputs` when the HTML page should show the explanation and source cells without runtime output.

```bash id="x3t85r"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html --no-outputs
```

This is useful for lessons where the reader should run the note locally, or for documentation where the code is more important than a captured run.

HTML cells are still rendered because they are part of the note source, not runtime output.

## A small note to export

Create a note:

````bash id="p7j75b"
mkdir -p lessons

cat > lessons/export-example.vixnote <<'NOTE'
<!-- vixnote:cell id="intro" kind="markdown" -->
# Export Example

This note can be opened locally and exported to HTML.

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
The exported file is static HTML.
NOTE
````

Open it in the local UI:

```bash id="qwhntz"
vix note lessons/export-example.vixnote
```

Export it:

```bash id="g2x2of"
vix note export lessons/export-example.vixnote --out lessons/export-example.html
```

The `.vixnote` file remains the editable source. The `.html` file is the generated artifact.

## Standalone HTML

The default export is a complete standalone HTML document.

That means the generated file has the normal document structure, page title, CSS, rendered body, source cells, and optional output sections. This is the right format for sharing a note as a single page.

```bash id="ipxfoe"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

A standalone export is useful for documentation, tutorials, course material, and internal notes that should be readable without running the local notebook UI.

## Exported C++ cells

C++ cells are rendered as source code in the exported page.

````md id="l8t6k7"
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

The exporter does not compile this cell. It presents the cell as part of the document. When outputs are available and included, they can appear under the cell; otherwise, the exported page shows the source and explanation.

## Exported Reply cells

Reply cells are also rendered as source cells.

````md id="xq6mq2"
<!-- vixnote:cell id="quick-math" kind="reply" title="Quick math" -->

```reply
x = 1 + 2 * 3
println("x =", x)
```
````

The exported page shows the Reply source. It does not start the embedded Reply runtime.

## Exported HTML cells

HTML cells are rendered as HTML content.

````md id="ovkpl0"
<!-- vixnote:cell id="visual-summary" kind="html" title="Visual summary" -->

```html
<section style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px;">
  <h2 style="margin-top: 0;">Vix Note</h2>
  <p>This block is rendered in the exported page.</p>
</section>
```
````

HTML cells are source cells, not runtime output. They remain visible even when runtime outputs are disabled.

```bash id="zz4fdu"
vix note export lessons/html-cells.vixnote --out lessons/html-cells.html --no-outputs
```

## File layout

Keep source notes and generated HTML separate.

```txt id="khurwi"
docs/
  notes/
    cpp-basics.vixnote
    runtime.vixnote
  generated/
    cpp-basics.html
    runtime.html
```

Export from the source file into the generated location:

```bash id="oirk6f"
vix note export docs/notes/cpp-basics.vixnote --out docs/generated/cpp-basics.html
```

This makes it clear which file should be edited and which file can be regenerated.

## Export inside a project

A note can live inside a Vix project.

```txt id="b56m98"
my-project/
  vix.app
  docs/
    notes/
      architecture.vixnote
    html/
      architecture.html
```

Export from the project root:

```bash id="n3f5hv"
cd my-project
vix note export docs/notes/architecture.vixnote --out docs/html/architecture.html
```

Project context matters during notebook execution, especially for C++ cells that need project headers or dependencies. Export itself is still a rendering step. It does not run the cells and does not rebuild the project.

## Programmatic export

The public API exposes the HTML exporter for tools that need to render notes directly.

```cpp id="krq8fs"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Export example");

  document.add_markdown("# Export example");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
})");

  auto result =
      vix::note::export_note_html_file(
          document,
          "export-example.html");

  return result.ok() ? 0 : 1;
}
```

This renders the document using the default export options. It is useful for tests, custom tooling, or future workflows that generate notes before exporting them.

## Export options in C++

Use `HtmlExporterOptions` when a tool needs more control over the generated page.

```cpp id="hk1vyz"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Export options");

  document.add_markdown("# Export options");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Exported from Vix Note" << std::endl;
  return 0;
})");

  vix::note::HtmlExporterOptions options;
  options.standalone = true;
  options.includeOutputs = false;
  options.includeCellTitles = true;
  options.includeExecutionCounts = true;
  options.includeDocumentMetadata = true;
  options.includeTableOfContents = true;
  options.printableLayout = true;

  vix::note::HtmlExporter exporter(options);

  auto result =
      exporter.export_to_file(
          document,
          "export-options.html");

  return result.ok() ? 0 : 1;
}
```

These options are for programmatic use. For most users, the CLI export command is the main workflow.

## Rendering to a string

A tool can render a note to an HTML string without writing it immediately to disk.

```cpp id="jtrnz8"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Render example");

  document.add_markdown("# Render example");
  document.add_markdown("This document was rendered to an HTML string.");

  std::string html =
      vix::note::export_note_html(document);

  return html.empty() ? 1 : 0;
}
```

This is useful when another tool wants to send the rendered document somewhere else, store it in a custom location, or inspect the generated HTML during tests.

## Export and table of contents

The exporter can include a simple table of contents when headings are found in Markdown cells.

```md id="zh88dv"
<!-- vixnote:cell id="intro" kind="markdown" -->

# C++ Basics

<!-- vixnote:cell id="variables" kind="markdown" -->

## Variables

<!-- vixnote:cell id="functions" kind="markdown" -->

## Functions
```

The table of contents is part of the standalone export. It helps longer lessons stay readable without requiring a separate documentation system.

## Print-friendly output

The default standalone export can include print-friendly CSS rules. This is useful for lessons or internal documents that may be printed, saved as PDF from the browser, or archived as static pages.

The exporter is intentionally small and dependency-free. It is not a full documentation site generator. It renders a note document into a clean HTML page.

## Common mistakes

### Expecting export to execute cells

Export renders the document. It does not run C++ or Reply cells.

```bash id="q4fqpn"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Run the note first when outputs matter.

### Editing the generated HTML instead of the note

The `.vixnote` file is the source. The `.html` file is generated.

Edit this:

```txt id="uu9e7u"
lessons/cpp-basics.vixnote
```

Regenerate this:

```txt id="dfxyab"
lessons/cpp-basics.html
```

### Assuming `--no-outputs` hides HTML cells

HTML cells are not runtime outputs. They are source cells rendered as HTML content. `--no-outputs` disables runtime output rendering, not source HTML cells.

### Exporting into the same path as the note

Do not write the HTML file over the `.vixnote` source.

```bash id="z642o2"
vix note export lessons/cpp-basics.vixnote --out lessons/cpp-basics.html
```

Keep a separate output path.

### Making the exported page depend on the local server

The exported page should be static. Use the local server for editing and execution, then export the note as a read-only artifact.

## Next step

Continue with the API reference for a compact overview of the public types exposed by the Vix Note module.

[Open the API reference](/modules/note/api-reference)
