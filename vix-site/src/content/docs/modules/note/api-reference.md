# API Reference

This page gives a compact reference for the public C++ API exposed by Vix Note.

Most users interact with Vix Note through the CLI and the local notebook UI. The C++ API is useful when a tool needs to create note documents, parse `.vixnote` files, run cells, inspect outputs, serve a local note UI, or export a document to HTML.

```cpp id="cgdw94"
#include <vix/note/note.hpp>
```

All public types are in the `vix::note` namespace.

## Public header

Use the umbrella header for normal integration:

```cpp id="k78njq"
#include <vix/note/note.hpp>
```

It includes the public document model, parser, storage helpers, project detector, runtime kernel, local server facade, and HTML exporter.

```cpp id="rb95qo"
#include <vix/note/core/NoteCell.hpp>
#include <vix/note/core/NoteDocument.hpp>
#include <vix/note/core/NoteError.hpp>
#include <vix/note/core/NoteResult.hpp>

#include <vix/note/parser/NoteParser.hpp>
#include <vix/note/project/ProjectContext.hpp>
#include <vix/note/project/ProjectDetector.hpp>
#include <vix/note/storage/NoteStore.hpp>

#include <vix/note/runtime/CppCellRunner.hpp>
#include <vix/note/runtime/NoteKernel.hpp>
#include <vix/note/runtime/NoteSession.hpp>
#include <vix/note/runtime/ReplyCellRunner.hpp>

#include <vix/note/web/NoteAssets.hpp>
#include <vix/note/web/NoteRoutes.hpp>
#include <vix/note/web/NoteServer.hpp>

#include <vix/note/export/HtmlExporter.hpp>
```

## Core model

The core model is the in-memory representation of a note document. It does not read files, run code, or serve the UI by itself. It gives the rest of the module a stable structure to work with.

```txt id="kxzc61"
NoteDocument
  -> ordered list of NoteCell

NoteCell
  -> kind
  -> source
  -> optional title
  -> execution count
  -> outputs
```

## NoteCellKind

`NoteCellKind` describes the type of content stored in a cell.

```cpp id="xpw2dh"
enum class NoteCellKind
{
  Unknown,
  Markdown,
  Reply,
  Cpp,
  Html
};
```

Helpers:

```cpp id="nk3rfe"
std::string_view to_string(NoteCellKind kind) noexcept;

NoteCellKind note_cell_kind_from_string(
    std::string_view value) noexcept;

bool is_executable(NoteCellKind kind) noexcept;
```

Only `Reply` and `Cpp` cells are executable.

## NoteCell

`NoteCell` represents one editable cell in a note document.

Common constructors and factories:

```cpp id="xw6qvb"
NoteCell();

NoteCell(NoteCellKind kind, std::string source);

NoteCell(
    std::string id,
    NoteCellKind kind,
    std::string source);

static NoteCell markdown(std::string source);
static NoteCell reply(std::string source);
static NoteCell cpp(std::string source);
static NoteCell html(std::string source);
```

Common accessors:

```cpp id="snpp33"
const std::string &id() const noexcept;
NoteCellKind kind() const noexcept;
const std::string &source() const noexcept;
const std::string &title() const noexcept;
int execution_count() const noexcept;
const std::vector<NoteOutput> &outputs() const noexcept;

bool empty() const noexcept;
bool executable() const noexcept;
bool has_outputs() const noexcept;
```

Common modifiers:

```cpp id="y6edol"
void set_id(std::string id);
void set_kind(NoteCellKind kind) noexcept;
void set_source(std::string source);
void set_title(std::string title);

void set_execution_count(int count) noexcept;
void mark_executed(int count) noexcept;
void reset_execution() noexcept;

NoteCell &add_output(NoteOutput output);
void set_outputs(std::vector<NoteOutput> outputs);
void clear_outputs();
```

Example:

```cpp id="gjrw7c"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteCell cell =
      vix::note::NoteCell::cpp(R"(#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
})");

  cell.set_id("hello-cpp");
  cell.set_title("Hello C++");

  return cell.executable() ? 0 : 1;
}
```

## NoteDocument

`NoteDocument` is the main document model. It stores metadata, an ordered list of cells, and the execution counter used by the runtime session.

Creation:

```cpp id="wm5do6"
NoteDocument();

explicit NoteDocument(std::string title);

static NoteDocument create(std::string title = {});
```

Common accessors:

```cpp id="d4dv52"
const std::string &id() const noexcept;
const std::string &title() const noexcept;
const std::string &path() const noexcept;

const std::vector<NoteCell> &cells() const noexcept;
std::vector<NoteCell> &cells() noexcept;

std::size_t cell_count() const noexcept;
int execution_count() const noexcept;

bool empty() const noexcept;
bool has_title() const noexcept;
bool has_executable_cells() const noexcept;
std::size_t executable_cell_count() const noexcept;
```

Adding cells:

```cpp id="zdk8sp"
NoteCell &add_cell(NoteCell cell);

NoteCell &add_markdown(std::string source);
NoteCell &add_reply(std::string source);
NoteCell &add_cpp(std::string source);
NoteCell &add_html(std::string source);
```

Finding and updating cells:

```cpp id="q1qj63"
NoteCell *cell_at(std::size_t index) noexcept;
const NoteCell *cell_at(std::size_t index) const noexcept;

NoteCell *find_cell(const std::string &id) noexcept;
const NoteCell *find_cell(const std::string &id) const noexcept;

std::optional<std::size_t> cell_index(
    const std::string &id) const noexcept;

bool update_cell(
    const std::string &id,
    NoteCellKind kind,
    std::string source);

bool update_cell_source(
    const std::string &id,
    std::string source);
```

Moving and removing cells:

```cpp id="qntm1t"
bool insert_cell(std::size_t index, NoteCell cell);
bool insert_cell_before(const std::string &id, NoteCell cell);
bool insert_cell_after(const std::string &id, NoteCell cell);

bool move_cell(std::size_t fromIndex, std::size_t toIndex);
bool move_cell(const std::string &id, std::size_t toIndex);

bool remove_cell(std::size_t index);
bool remove_cell_by_id(const std::string &id);

void clear_cells();
void clear_outputs();
```

Example:

```cpp id="mtpu36"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("C++ Basics");

  document.add_markdown("# C++ Basics");

  auto &cell = document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
})");

  cell.set_id("hello-cpp");
  cell.set_title("Hello C++");

  document.add_markdown("The output appears under the C++ cell.");

  return document.has_executable_cells() ? 0 : 1;
}
```

## NoteOutputKind

`NoteOutputKind` describes the type of output produced by a cell.

```cpp id="kzhb7y"
enum class NoteOutputKind
{
  Text,
  Stdout,
  Stderr,
  Html,
  Error,
  CompilerError,
  RuntimeError,
  Debug,
  Hint,
  RawLog
};
```

Helper:

```cpp id="xrym0n"
std::string_view to_string(NoteOutputKind kind) noexcept;
```

## NoteOutput

`NoteOutput` stores one output emitted by a note operation or cell execution.

```cpp id="ab1ybz"
struct NoteOutput
{
  NoteOutputKind kind{NoteOutputKind::Text};
  std::string content;

  static NoteOutput text(std::string content);
  static NoteOutput stdout_text(std::string content);
  static NoteOutput stderr_text(std::string content);
  static NoteOutput html(std::string content);
  static NoteOutput error(std::string content);
  static NoteOutput compiler_error(std::string content);
  static NoteOutput runtime_error(std::string content);
  static NoteOutput debug(std::string content);
  static NoteOutput hint(std::string content);
  static NoteOutput raw_log(std::string content);

  bool empty() const noexcept;
};
```

Example:

```cpp id="q92sdf"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteCell cell =
      vix::note::NoteCell::reply(R"(println("hello"))");

  cell.add_output(
      vix::note::NoteOutput::stdout_text("hello\n"));

  return cell.has_outputs() ? 0 : 1;
}
```

## NoteResultStatus

`NoteResultStatus` describes the result of a note operation or cell execution.

```cpp id="i8g46z"
enum class NoteResultStatus
{
  Success,
  Failure,
  Skipped
};
```

Helper:

```cpp id="ew4akh"
std::string_view to_string(NoteResultStatus status) noexcept;
```

## NoteResult

`NoteResult` represents the result of parsing, execution, storage, export, or another note operation.

Creation:

```cpp id="iqnrn2"
static NoteResult success(std::string message = {});
static NoteResult failure(std::string message, int exitCode = 1);
static NoteResult skipped(std::string message = {});

NoteResult(
    NoteResultStatus status = NoteResultStatus::Success,
    std::string message = {},
    int exitCode = 0);
```

Accessors:

```cpp id="qxaj1g"
NoteResultStatus status() const noexcept;
int exit_code() const noexcept;
const std::string &message() const noexcept;
const std::vector<NoteOutput> &outputs() const noexcept;

bool ok() const noexcept;
bool failed() const noexcept;
bool was_skipped() const noexcept;
bool has_outputs() const noexcept;
```

Output helpers:

```cpp id="rcwyab"
NoteResult &add_output(NoteOutput output);

NoteResult &add_text(std::string content);
NoteResult &add_stdout(std::string content);
NoteResult &add_stderr(std::string content);
NoteResult &add_html(std::string content);
NoteResult &add_error(std::string content);
NoteResult &add_compiler_error(std::string content);
NoteResult &add_runtime_error(std::string content);
NoteResult &add_debug(std::string content);
NoteResult &add_hint(std::string content);
NoteResult &add_raw_log(std::string content);
```

Example:

```cpp id="ge3x38"
#include <vix/note/note.hpp>

int main()
{
  auto result =
      vix::note::NoteResult::failure("compile failed", 1)
          .add_compiler_error("main.cpp:3:10: error: expected ';'")
          .add_hint("A C++ statement usually ends with a semicolon.");

  return result.failed() && result.has_outputs() ? 0 : 1;
}
```

## NoteErrorCode

`NoteErrorCode` gives a stable category to note exceptions.

```cpp id="bhevke"
enum class NoteErrorCode
{
  Unknown,
  Parse,
  Read,
  Write,
  Runtime,
  Unsupported,
  Invalid
};
```

Helper:

```cpp id="puxq4d"
std::string_view to_string(NoteErrorCode code) noexcept;
```

## NoteError

`NoteError` is the exception type used by Vix Note operations that throw.

```cpp id="oj2tle"
class NoteError : public std::runtime_error
{
public:
  explicit NoteError(std::string message);

  NoteError(NoteErrorCode code, std::string message);

  NoteErrorCode code() const noexcept;
};
```

Example:

```cpp id="l1qsd2"
#include <vix/note/note.hpp>

int main()
{
  try
  {
    auto document =
        vix::note::load_note_or_throw("missing.vixnote");

    return document.empty() ? 1 : 0;
  }
  catch (const vix::note::NoteError &error)
  {
    return error.code() == vix::note::NoteErrorCode::Read ? 0 : 1;
  }
}
```

## Parser

The parser reads `.vixnote` text and builds a `NoteDocument`.

## NoteParseOptions

```cpp id="t8fyv8"
struct NoteParseOptions
{
  bool assignCellIds = true;
  bool readCellMetadata = true;
  bool inferTitle = true;
};
```

## NoteParseDiagnostic

```cpp id="sjjkqj"
struct NoteParseDiagnostic
{
  std::size_t line = 0;
  std::string message;
};
```

## NoteParseResult

```cpp id="p715hh"
struct NoteParseResult
{
  bool ok = false;
  NoteDocument document;
  std::string error;
  std::vector<NoteParseDiagnostic> diagnostics;

  bool has_diagnostics() const noexcept;
};
```

## NoteParser

```cpp id="xz6xtj"
class NoteParser
{
public:
  NoteParser();

  explicit NoteParser(NoteParseOptions options);

  const NoteParseOptions &options() const noexcept;
  void set_options(NoteParseOptions options) noexcept;

  NoteParseResult parse(std::string_view source) const;

  NoteDocument parse_or_throw(std::string_view source) const;
};
```

Convenience helpers:

```cpp id="c10gfk"
NoteParseResult parse_note(std::string_view source);

NoteDocument parse_note_or_throw(std::string_view source);
```

Example:

````cpp id="bs97qd"
#include <vix/note/note.hpp>

int main()
{
  const std::string source = R"(<!-- vixnote:cell id="intro" kind="markdown" -->
# Parser example

<!-- vixnote:cell id="hello-cpp" kind="cpp" title="Hello C++" -->
```cpp
#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
}
```
)";

  auto parsed = vix::note::parse_note(source);

  return parsed.ok && parsed.document.has_executable_cells() ? 0 : 1;
}
````

## Storage

The storage layer loads and saves `.vixnote` files. It delegates parsing to `NoteParser` and serializes documents back into the Markdown-compatible note format.

## NoteStoreOptions

```cpp id="gd8wjw"
struct NoteStoreOptions
{
  NoteParseOptions parseOptions;

  bool createParentDirectories = true;
  bool atomicWrite = true;
};
```

## NoteLoadResult

```cpp id="ay2txe"
struct NoteLoadResult
{
  bool ok = false;
  NoteDocument document;
  std::string error;

  bool has_error() const noexcept;
};
```

## NoteStore

```cpp id="hj4v98"
class NoteStore
{
public:
  NoteStore();

  explicit NoteStore(NoteStoreOptions options);

  const NoteStoreOptions &options() const noexcept;
  void set_options(NoteStoreOptions options) noexcept;

  NoteLoadResult load(const std::filesystem::path &path) const;

  NoteDocument load_or_throw(
      const std::filesystem::path &path) const;

  NoteResult save(const NoteDocument &document) const;

  NoteResult save(
      const NoteDocument &document,
      const std::filesystem::path &path) const;

  void save_or_throw(const NoteDocument &document) const;

  void save_or_throw(
      const NoteDocument &document,
      const std::filesystem::path &path) const;

  std::string serialize(const NoteDocument &document) const;
};
```

Convenience helpers:

```cpp id="nfy8x3"
NoteLoadResult load_note(const std::filesystem::path &path);

NoteDocument load_note_or_throw(
    const std::filesystem::path &path);

NoteResult save_note(
    const NoteDocument &document,
    const std::filesystem::path &path);

std::string serialize_note(const NoteDocument &document);
```

Example:

```cpp id="sxchhu"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Save example");

  document.add_markdown("# Save example");
  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Saved from Vix Note" << std::endl;
  return 0;
})");

  auto result =
      vix::note::save_note(document, "lessons/save-example.vixnote");

  return result.ok() ? 0 : 1;
}
```

## Project context

Project context describes where a note lives when it is opened inside a Vix or C++ project. It is separate from the document itself.

## ProjectContext

```cpp id="g2qw4i"
struct ProjectContext
{
  bool enabled = false;

  std::string projectName;

  std::filesystem::path notePath;
  std::filesystem::path projectRoot;
  std::filesystem::path workingDirectory;
  std::filesystem::path manifestPath;
  std::filesystem::path depsDirectory;

  std::vector<std::filesystem::path> includePaths;
  std::vector<std::string> environment;

  bool has_project_root() const noexcept;
  bool has_manifest() const noexcept;
  bool has_deps() const noexcept;
  bool has_include_paths() const noexcept;

  std::filesystem::path effective_working_directory() const;
};
```

## ProjectDetectOptions

```cpp id="vpw6w8"
struct ProjectDetectOptions
{
  bool searchParents = true;
  bool detectDeps = true;
  bool includeProjectIncludeDirectory = true;
  bool includeProjectSourceDirectory = false;
};
```

## ProjectDetector

```cpp id="blvfki"
class ProjectDetector
{
public:
  ProjectDetector();

  explicit ProjectDetector(ProjectDetectOptions options);

  const ProjectDetectOptions &options() const noexcept;
  void set_options(ProjectDetectOptions options) noexcept;

  ProjectContext detect(
      const std::filesystem::path &notePath) const;

  ProjectContext detect_from(
      const std::filesystem::path &startPath,
      const std::filesystem::path &notePath) const;
};
```

Convenience helper:

```cpp id="pi7lyu"
ProjectContext detect_project_context(
    const std::filesystem::path &notePath);
```

Example:

```cpp id="ai2bdd"
#include <vix/note/note.hpp>

int main()
{
  auto context =
      vix::note::detect_project_context(
          "docs/notes/runtime.vixnote");

  return context.enabled && context.has_project_root() ? 0 : 1;
}
```

## Runtime

The runtime executes cells and applies results to the active document session.

```txt id="rxah8u"
NoteKernel
  -> NoteSession
  -> CppCellRunner
  -> ReplyCellRunner
```

## NoteSessionOptions

```cpp id="unbxal"
struct NoteSessionOptions
{
  bool clearOutputsBeforeRun = true;
  bool stopOnFirstFailure = false;
};
```

## NoteSessionRecord

```cpp id="dgoz0y"
struct NoteSessionRecord
{
  std::size_t cellIndex = 0;
  std::string cellId;
  int executionCount = 0;
  NoteResult result;
};
```

## NoteSession

`NoteSession` stores runtime state for one document. It does not execute code by itself.

```cpp id="oo1v3c"
class NoteSession
{
public:
  NoteSession();

  explicit NoteSession(NoteDocument document);

  NoteSession(
      NoteDocument document,
      NoteSessionOptions options);

  const NoteSessionOptions &options() const noexcept;
  void set_options(NoteSessionOptions options) noexcept;

  const NoteDocument &document() const noexcept;
  NoteDocument &document() noexcept;
  void set_document(NoteDocument document);

  bool empty() const noexcept;
  std::size_t cell_count() const noexcept;
  bool has_cell(std::size_t index) const noexcept;
  bool can_execute_cell(std::size_t index) const noexcept;

  NoteCell *cell_at(std::size_t index) noexcept;
  const NoteCell *cell_at(std::size_t index) const noexcept;

  NoteCell *find_cell(const std::string &id) noexcept;
  const NoteCell *find_cell(const std::string &id) const noexcept;

  std::optional<std::size_t> cell_index(
      const std::string &id) const noexcept;

  NoteResult apply_result(
      std::size_t index,
      const NoteResult &result);

  NoteResult apply_result(
      const std::string &id,
      const NoteResult &result);

  void clear_outputs();
  void reset_execution();
  void clear_records();

  const std::vector<NoteSessionRecord> &records() const noexcept;
  bool has_records() const noexcept;
};
```

Example:

```cpp id="fc0m5a"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Session example");

  auto &cell =
      document.add_reply(R"(println("hello"))");

  cell.set_id("hello-reply");

  vix::note::NoteSession session(document);

  auto result =
      vix::note::NoteResult::success("ok")
          .add_stdout("hello\n");

  auto applied =
      session.apply_result("hello-reply", result);

  return applied.ok() && session.has_records() ? 0 : 1;
}
```

## CppCellRunnerOptions

`CppCellRunnerOptions` controls how C++ cells are executed.

```cpp id="zz7h8r"
struct CppCellRunnerOptions
{
  std::string vixCommand = "vix";

  std::filesystem::path workingDirectory;
  ProjectContext projectContext;

  bool enableProjectContext = false;

  std::filesystem::path temporaryDirectory;

  std::vector<std::string> runArgs{};

  bool keepTemporaryFile = false;
  bool debugMode = false;
  bool separateStreams = true;
  bool includeRawLog = false;
  bool showEmptySuccessOutput = true;
  bool enableErrorHints = true;
};
```

## CppCellRunner

`CppCellRunner` executes C++ cells by delegating to `vix run`.

```cpp id="xbdv4w"
class CppCellRunner
{
public:
  CppCellRunner();

  explicit CppCellRunner(CppCellRunnerOptions options);

  const CppCellRunnerOptions &options() const noexcept;
  void set_options(CppCellRunnerOptions options) noexcept;

  NoteResult run_source(const std::string &source) const;

  NoteResult run_cell(const NoteCell &cell) const;
};
```

Convenience helpers:

```cpp id="vm34uu"
NoteResult run_cpp_source(const std::string &source);

NoteResult run_cpp_cell(const NoteCell &cell);
```

Example:

```cpp id="ay7um5"
#include <vix/note/note.hpp>

int main()
{
  auto result =
      vix::note::run_cpp_source(R"(#include <iostream>

int main()
{
  std::cout << "Hello from C++ runner" << std::endl;
  return 0;
})");

  return result.ok() ? 0 : 1;
}
```

## ReplyCellRunnerOptions

```cpp id="qdyjyi"
struct ReplyCellRunnerOptions
{
  vix::reply::ReplyRuntimeOptions runtimeOptions;

  std::vector<std::string> args;

  bool debugMode = false;
};
```

## ReplyCellRunner

`ReplyCellRunner` executes Reply cells through the embedded Reply runtime.

```cpp id="mrth12"
class ReplyCellRunner
{
public:
  ReplyCellRunner();

  explicit ReplyCellRunner(ReplyCellRunnerOptions options);

  const ReplyCellRunnerOptions &options() const noexcept;
  void set_options(ReplyCellRunnerOptions options);

  NoteResult run_source(const std::string &source);

  NoteResult run_cell(const NoteCell &cell);

  void clear();
};
```

Convenience helpers:

```cpp id="vkktme"
NoteResult run_reply_source(const std::string &source);

NoteResult run_reply_cell(const NoteCell &cell);
```

Example:

```cpp id="fdjy4g"
#include <vix/note/note.hpp>

int main()
{
  auto result =
      vix::note::run_reply_source(R"(x = 1 + 2 * 3
println("x =", x))");

  return result.ok() ? 0 : 1;
}
```

## NoteKernelOptions

```cpp id="nrxj2y"
struct NoteKernelOptions
{
  NoteSessionOptions sessionOptions;
  CppCellRunnerOptions cppOptions;
  ReplyCellRunnerOptions replyOptions;
  ProjectContext projectContext;

  bool stopOnFirstFailure = false;
  bool includeNonExecutableAsSkipped = false;
};
```

## NoteKernelRunResult

```cpp id="z8c85a"
struct NoteKernelRunResult
{
  bool ok = true;
  bool stopped = false;

  std::size_t visited = 0;
  std::size_t executed = 0;
  std::size_t skipped = 0;
  std::size_t failed = 0;

  std::vector<NoteResult> results;

  bool has_failures() const noexcept;
  bool has_skipped() const noexcept;
  bool has_results() const noexcept;
};
```

## NoteKernel

`NoteKernel` is the high-level runtime used to run cells in a document.

```cpp id="tuw8gz"
class NoteKernel
{
public:
  NoteKernel();

  explicit NoteKernel(NoteDocument document);

  explicit NoteKernel(NoteKernelOptions options);

  NoteKernel(
      NoteDocument document,
      NoteKernelOptions options);

  const NoteKernelOptions &options() const noexcept;
  void set_options(NoteKernelOptions options);

  const ProjectContext &project_context() const noexcept;
  void set_project_context(ProjectContext context);

  const NoteSession &session() const noexcept;
  NoteSession &session() noexcept;

  const NoteDocument &document() const noexcept;
  NoteDocument &document() noexcept;
  void set_document(NoteDocument document);

  std::size_t cell_count() const noexcept;
  bool has_cell(std::size_t index) const noexcept;

  bool can_execute_cell(std::size_t index) const noexcept;
  bool can_execute_cell(const std::string &id) const noexcept;

  std::optional<std::size_t> cell_index(
      const std::string &id) const noexcept;

  NoteResult run_cell(std::size_t index);
  NoteResult run_cell(const std::string &id);

  NoteKernelRunResult run_all();
  NoteKernelRunResult run_executable_cells();

  void clear_outputs();
  void reset_execution();
  void reset();
};
```

Convenience helpers:

```cpp id="l4yk8o"
NoteKernelRunResult run_note(NoteDocument document);

NoteResult run_note_cell(
    NoteDocument document,
    std::size_t index);

NoteResult run_note_cell(
    NoteDocument document,
    const std::string &id);
```

Example:

```cpp id="jn4lvm"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Kernel example");

  document.add_markdown("# Kernel example");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "C++ cell" << std::endl;
  return 0;
})");

  document.add_reply(R"(println("Reply cell"))");

  vix::note::NoteKernel kernel(document);

  auto run = kernel.run_executable_cells();

  return run.ok && run.executed == 2 ? 0 : 1;
}
```

## Web and local UI

The web API gives Vix Note its local browser workspace. Most applications should use the CLI, but the server facade is public so the behavior can be tested and embedded.

## NoteAsset

```cpp id="csqmy5"
struct NoteAsset
{
  std::string path;
  std::string contentType;
  std::string content;

  bool empty() const noexcept;
};
```

## NoteAssets

`NoteAssets` stores embedded or disk-loaded UI assets.

```cpp id="mhzmu5"
class NoteAssets
{
public:
  NoteAssets();

  explicit NoteAssets(std::vector<NoteAsset> assets);

  const std::vector<NoteAsset> &all() const noexcept;

  std::size_t size() const noexcept;
  bool empty() const noexcept;

  std::optional<NoteAsset> find(std::string_view path) const;
  bool contains(std::string_view path) const;

  void add_or_replace(NoteAsset asset);

  bool load_from_directory(
      const std::filesystem::path &directory,
      NoteAssetDirectoryOptions options,
      std::string &error);

  bool load_from_directory(
      const std::filesystem::path &directory,
      std::string &error);

  bool remove(std::string_view path);
  void clear();

  static std::vector<NoteAsset> defaults();

  static std::vector<NoteAsset> from_directory(
      const std::filesystem::path &directory,
      std::string &error);

  static std::string default_index_html();
  static std::string default_css();
  static std::string default_js();
};
```

Asset helpers:

```cpp id="f2f0ui"
std::filesystem::path note_installed_asset_directory();

std::vector<std::filesystem::path> note_asset_search_paths(
    const NoteAssetResolveOptions &options = {});

bool load_best_available_note_assets(
    NoteAssets &assets,
    const NoteAssetResolveOptions &options,
    std::string &error);

bool read_note_asset_file(
    const std::filesystem::path &path,
    std::string &out,
    std::string &err);

std::string note_asset_public_path(
    const std::filesystem::path &path);

std::string note_asset_content_type(
    std::string_view path);

std::string normalize_note_asset_path(
    std::string_view path);
```

## NoteServerState

```cpp id="d0p9n1"
enum class NoteServerState
{
  Stopped,
  Running
};
```

Helper:

```cpp id="s7d3kr"
std::string_view to_string(NoteServerState state) noexcept;
```

## NoteServerOptions

```cpp id="ggnmyc"
struct NoteServerOptions
{
  std::string host = "127.0.0.1";
  std::uint16_t port = 5179;

  bool openBrowser = false;
  bool logRequests = false;

  NoteRoutesOptions routeOptions;
};
```

## NoteServer

`NoteServer` owns the local route resolver and starts the local notebook server.

```cpp id="im4246"
class NoteServer
{
public:
  NoteServer();

  explicit NoteServer(NoteDocument document);

  explicit NoteServer(NoteServerOptions options);

  NoteServer(
      NoteDocument document,
      NoteServerOptions options);

  ~NoteServer();

  NoteServer(const NoteServer &) = delete;
  NoteServer &operator=(const NoteServer &) = delete;

  NoteServer(NoteServer &&other) noexcept;
  NoteServer &operator=(NoteServer &&other) noexcept;

  const NoteServerOptions &options() const noexcept;

  NoteResult set_options(NoteServerOptions options);

  NoteServerState state() const noexcept;

  bool running() const noexcept;
  bool stopped() const noexcept;

  NoteResult start();
  NoteResult wait();
  NoteResult stop();
  NoteResult restart();

  std::string url() const;

  const NoteRoutes &routes() const noexcept;
  NoteRoutes &routes() noexcept;

  const NoteDocument &document() const noexcept;
  void set_document(NoteDocument document);

  NoteRouteResponse handle(const NoteRouteRequest &request);

  NoteRouteResponse get(std::string_view path);

  NoteRouteResponse post(
      std::string_view path,
      std::string body = {});

  NoteRouteResponse put(
      std::string_view path,
      std::string body = {});

  NoteRouteResponse delete_request(std::string_view path);
};
```

Helper:

```cpp id="dtd16y"
std::string make_note_server_url(
    std::string_view host,
    std::uint16_t port);
```

Example:

```cpp id="ssbe2v"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("Local UI");

  document.add_markdown("# Local UI");

  vix::note::NoteServer server(document);

  auto response = server.get("/api/document");

  return response.statusCode == 200 ? 0 : 1;
}
```

For normal use, start the local UI from the CLI:

```bash id="lq1dig"
vix note lessons/cpp-basics.vixnote
```

## Export

The export API renders note documents to HTML.

## HtmlExporterOptions

```cpp id="jw4sj3"
struct HtmlExporterOptions
{
  bool standalone = true;
  bool includeOutputs = true;
  bool includeCellTitles = true;
  bool includeExecutionCounts = true;
  bool includeDocumentMetadata = true;
  bool includeTableOfContents = true;
  bool includeOutputLabels = true;
  bool printableLayout = true;

  std::string defaultTitle = "Vix Note";
  std::string customCss;
};
```

## HtmlExporter

```cpp id="pkz6li"
class HtmlExporter
{
public:
  HtmlExporter();

  explicit HtmlExporter(HtmlExporterOptions options);

  const HtmlExporterOptions &options() const noexcept;
  void set_options(HtmlExporterOptions options) noexcept;

  std::string render(const NoteDocument &document) const;

  NoteResult export_to_file(
      const NoteDocument &document,
      const std::filesystem::path &path) const;

  void export_to_file_or_throw(
      const NoteDocument &document,
      const std::filesystem::path &path) const;

  static std::string default_css();
};
```

Export helpers:

```cpp id="z4w6ap"
std::string html_escape(const std::string &value);

std::string render_note_markdown(
    const std::string &markdown);

std::string export_note_html(
    const NoteDocument &document);

NoteResult export_note_html_file(
    const NoteDocument &document,
    const std::filesystem::path &path);
```

Example:

```cpp id="lyyg8q"
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

## Minimal end-to-end example

This example creates a document, saves it, runs executable cells, and exports it.

```cpp id="xn47x4"
#include <vix/note/note.hpp>

int main()
{
  vix::note::NoteDocument document("End-to-end example");

  document.add_markdown("# End-to-end example");

  document.add_cpp(R"(#include <iostream>

int main()
{
  std::cout << "Hello from Vix Note" << std::endl;
  return 0;
})");

  document.add_reply(R"(println("Reply cell"))");

  auto saved =
      vix::note::save_note(
          document,
          "lessons/end-to-end.vixnote");

  if (!saved.ok())
  {
    return 1;
  }

  vix::note::NoteKernel kernel(document);

  auto run = kernel.run_executable_cells();

  if (!run.ok)
  {
    return 1;
  }

  auto exported =
      vix::note::export_note_html_file(
          kernel.document(),
          "lessons/end-to-end.html");

  return exported.ok() ? 0 : 1;
}
```

The CLI remains the normal workflow for users:

```bash id="fmm60y"
vix note lessons/end-to-end.vixnote
vix note export lessons/end-to-end.vixnote --out lessons/end-to-end.html
```

## Next step

Return to the export guide when you need the CLI workflow for static HTML output, or go back to the overview to continue from the main Vix Note entry point.

[Back to Vix Note overview](/modules/note/)
