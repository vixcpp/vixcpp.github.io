# API Reference

This page summarizes the public API of the FS module. It is meant for quick lookup while writing or reviewing code. For the workflow and design model, start with the overview, quick start, and topic pages in this section.

## Header

Use the public FS header in application and module code:

```cpp id="ctd5xi"
#include <vix/fs.hpp>
```

All public APIs are declared in the `vix::fs` namespace.

```cpp id="wzsl8f"
namespace vix::fs
{
}
```

## Core types

### FsPath

```cpp id="ozi9p0"
using FsPath = std::string;
```

`FsPath` is the public filesystem path type. The FS API keeps paths simple at the public layer and accepts `std::string_view` for most path arguments.

### Bytes

```cpp id="nmljg6"
using Bytes = std::vector<std::uint8_t>;
```

`Bytes` is the standard binary buffer type used by `read_file()`, `write_file()`, and the binary overload of `append_file()`.

## Result aliases

FS result types are aliases over `vix::error::Result<T>`.

```cpp id="fvfl47"
using FsBoolResult = vix::error::Result<bool>;
using FsPathResult = vix::error::Result<std::string>;
using FsStringResult = vix::error::Result<std::string>;
using FsBytesResult = vix::error::Result<Bytes>;
using FsPathListResult = vix::error::Result<std::vector<std::string>>;
using FsEntryListResult = vix::error::Result<std::vector<FsEntry>>;
using FsSizeResult = vix::error::Result<std::uintmax_t>;
```

A failed result contains a structured `vix::error::Error`. A successful result contains the operation’s value.

```cpp id="ls8yvj"
auto content = vix::fs::read_text("vix.app");

if (!content) {
  return content.error();
}

std::string text = content.value();
```

For `FsBoolResult`, `false` can be a valid successful value. The result state tells whether the operation failed; the stored boolean tells the successful filesystem answer.

## FsEntryType

```cpp id="htz0su"
enum class FsEntryType
{
  Unknown = 0,
  File,
  Directory,
  Symlink
};
```

`FsEntryType` is a high-level classification used by directory listing APIs.

## FsEntry

```cpp id="e2ivmk"
struct FsEntry
{
  std::string path;
  std::string name;
  FsEntryType type{FsEntryType::Unknown};
  std::uintmax_t size{0};
  bool hidden{false};
};
```

`FsEntry` is returned by `list_directory()`. `path` stores the full entry path, `name` stores only the filename, `type` stores the entry kind, `size` stores the file size when known, and `hidden` is true when the entry name starts with `.`.

## FsOptions

### WriteMode

```cpp id="fgm9l1"
enum class WriteMode
{
  Overwrite,
  Append
};
```

`WriteMode` describes intended write behavior in the shared options model. The current public write API exposes this behavior through separate functions: `write_text()`, `write_file()`, and `append_file()`.

### CopyMode

```cpp id="n2y045"
enum class CopyMode
{
  SkipExisting,
  OverwriteExisting
};
```

`CopyMode` describes intended copy behavior in the shared options model. The current `copy()` function does not take an options argument.

### DirectoryListMode

```cpp id="qu30ke"
enum class DirectoryListMode
{
  Shallow,
  Recursive
};
```

`DirectoryListMode` controls directory traversal when used with `list_directory()`.

### FsOptions structure

```cpp id="s507so"
struct FsOptions
{
  bool create_parents{false};
  bool overwrite_existing{true};
  bool recursive{false};
  bool include_hidden{true};
  bool follow_symlinks{false};

  WriteMode write_mode{WriteMode::Overwrite};
  CopyMode copy_mode{CopyMode::OverwriteExisting};
  DirectoryListMode list_mode{DirectoryListMode::Shallow};
};
```

`FsOptions` is currently used by `list_directory()`. The active listing fields are `recursive`, `include_hidden`, and `list_mode`.

```cpp id="jdb8ma"
vix::fs::FsOptions options;
options.recursive = true;
options.include_hidden = false;

auto entries = vix::fs::list_directory("modules", options);
```

## FsPermission

```cpp id="ae0i52"
enum class FsPermission : std::uint32_t
{
  None = 0,
  Read = 1u << 0,
  Write = 1u << 1,
  Execute = 1u << 2
};
```

`FsPermission` provides simple permission flags for filesystem entries.

### Permission operators

```cpp id="oq2dgf"
constexpr FsPermission operator|(FsPermission lhs, FsPermission rhs) noexcept;
constexpr FsPermission operator&(FsPermission lhs, FsPermission rhs) noexcept;

constexpr FsPermission& operator|=(FsPermission& lhs, FsPermission rhs) noexcept;
constexpr FsPermission& operator&=(FsPermission& lhs, FsPermission rhs) noexcept;
```

These operators allow permission flags to be combined and checked.

```cpp id="ohapxi"
auto permissions =
  vix::fs::FsPermission::Read |
  vix::fs::FsPermission::Write;
```

### has_permission

```cpp id="c8oy6d"
[[nodiscard]] constexpr bool has_permission(
  FsPermission value,
  FsPermission expected
) noexcept;
```

Returns `true` when all requested permission flags are present.

```cpp id="lx04sv"
auto permissions =
  vix::fs::FsPermission::Read |
  vix::fs::FsPermission::Write;

bool writable = vix::fs::has_permission(
  permissions,
  vix::fs::FsPermission::Write
);
```

## FsErrorCode

```cpp id="kuwb85"
enum class FsErrorCode
{
  None = 0,
  EmptyPath,
  InvalidPath,
  NotFound,
  AlreadyExists,
  NotAFile,
  NotADirectory,
  PermissionDenied,
  ReadFailed,
  WriteFailed,
  CreateFailed,
  RemoveFailed,
  CopyFailed,
  MoveFailed,
  ListFailed,
  OpenFailed,
  CloseFailed,
  InvalidOperation,
  Unknown
};
```

`FsErrorCode` describes filesystem-specific failure cases. These codes are converted into the shared Vix `ErrorCode` model when an FS operation returns an error.

### fs_error_category

```cpp id="ud1a2a"
[[nodiscard]] constexpr vix::error::ErrorCategory
fs_error_category() noexcept;
```

Returns the default FS error category.

```cpp id="imdzmo"
auto category = vix::fs::fs_error_category();
// category.name() == "fs"
```

### to_error_code

```cpp id="jqw1gu"
[[nodiscard]] constexpr vix::error::ErrorCode
to_error_code(FsErrorCode code) noexcept;
```

Converts an `FsErrorCode` into a shared `vix::error::ErrorCode`.

```cpp id="ouq9s8"
auto code = vix::fs::to_error_code(
  vix::fs::FsErrorCode::ReadFailed
);
```

### to_string

```cpp id="uwnxol"
[[nodiscard]] const char* to_string(FsErrorCode code) noexcept;
```

Returns a stable string name for an `FsErrorCode`.

```cpp id="ees1hp"
const char* name = vix::fs::to_string(
  vix::fs::FsErrorCode::NotFound
);
```

### make_fs_error

```cpp id="cjihsk"
[[nodiscard]] vix::error::Error make_fs_error(
  FsErrorCode code,
  std::string message
);
```

Builds a structured `vix::error::Error` using the converted shared error code, the `fs` category, and the provided message.

```cpp id="t035zd"
return vix::fs::make_fs_error(
  vix::fs::FsErrorCode::NotFound,
  "source path does not exist"
);
```

## File reading and writing

### read_text

```cpp id="m32bkp"
[[nodiscard]] FsStringResult read_text(std::string_view path);
```

Reads a file as text and returns its content as `std::string`.

```cpp id="x53ovh"
auto content = vix::fs::read_text("README.md");
```

Returns an error when the path is empty, the file cannot be opened, or the read operation fails.

### write_text

```cpp id="gm1evj"
[[nodiscard]] FsBoolResult write_text(
  std::string_view path,
  std::string_view content
);
```

Writes text content to a file. Existing content is overwritten.

```cpp id="d5fqpb"
auto written = vix::fs::write_text(
  "storage/app.txt",
  "name = demo\n"
);
```

The parent directory must already exist.

### read_file

```cpp id="vzc8zg"
[[nodiscard]] FsBytesResult read_file(std::string_view path);
```

Reads a file as raw binary bytes.

```cpp id="tbeclo"
auto bytes = vix::fs::read_file("data.bin");
```

Returns an error when the path is empty, the file cannot be opened, the file size cannot be determined, or the content cannot be read.

### write_file

```cpp id="x1zr7a"
[[nodiscard]] FsBoolResult write_file(
  std::string_view path,
  const Bytes& data
);
```

Writes raw binary bytes to a file. Existing content is overwritten.

```cpp id="c3y5mm"
vix::fs::Bytes data{0x10, 0x20, 0x30};

auto written = vix::fs::write_file("data.bin", data);
```

The parent directory must already exist.

### append_file

```cpp id="t78a8f"
[[nodiscard]] FsBoolResult append_file(
  std::string_view path,
  const Bytes& data
);

[[nodiscard]] FsBoolResult append_file(
  std::string_view path,
  std::string_view content
);
```

Appends binary bytes or text content to a file. The file is created if it does not exist.

```cpp id="txc59s"
auto appended = vix::fs::append_file(
  "storage/log.txt",
  "started\n"
);
```

The parent directory must already exist.

### touch

```cpp id="ubjy45"
[[nodiscard]] FsBoolResult touch(std::string_view path);
```

Creates an empty file when it does not exist. If the file already exists, the function opens it in append mode.

```cpp id="sj264l"
auto touched = vix::fs::touch("storage/ready.flag");
```

Returns an error when the path is empty, the path is a directory, the file cannot be created, or the existing file cannot be opened.

## Directory operations

### create_directory

```cpp id="zscxq2"
[[nodiscard]] FsBoolResult create_directory(std::string_view path);
```

Creates a single directory.

```cpp id="c7ox6p"
auto created = vix::fs::create_directory("build");
```

Returns `true` when the directory was created and `false` when it already existed. Returns an error when the path is empty, the path exists but is not a directory, or creation fails.

### create_directories

```cpp id="a8ai1s"
[[nodiscard]] FsBoolResult create_directories(std::string_view path);
```

Creates a directory hierarchy.

```cpp id="dfi8t1"
auto created = vix::fs::create_directories("build/generated/assets");
```

Returns `true` when at least one directory was created and `false` when the hierarchy already existed. Returns an error when the path is empty, the path exists but is not a directory, or creation fails.

### ensure_directory

```cpp id="zkgw3r"
[[nodiscard]] FsBoolResult ensure_directory(std::string_view path);
```

Ensures that a directory exists after the operation.

```cpp id="c9z5qk"
auto ready = vix::fs::ensure_directory("storage/cache");
```

Returns `true` when the directory exists after the operation, whether it already existed or had to be created. Returns an error when the path is empty, the path exists but is not a directory, or directory creation fails.

### list_directory

```cpp id="ujkroy"
[[nodiscard]] FsEntryListResult list_directory(
  std::string_view path,
  const FsOptions& options = {}
);
```

Lists filesystem entries inside a directory.

```cpp id="jfm80p"
auto listed = vix::fs::list_directory("modules");
```

The default listing is shallow and includes hidden entries. Use `FsOptions` for recursive traversal or to exclude hidden entries.

```cpp id="nlc66d"
vix::fs::FsOptions options;
options.recursive = true;
options.include_hidden = false;

auto listed = vix::fs::list_directory("modules", options);
```

Returns an error when the path is empty, the directory does not exist, the path is not a directory, or listing fails.

## Metadata and path checks

### exists

```cpp id="s27nq7"
[[nodiscard]] FsBoolResult exists(std::string_view path);
```

Returns whether a filesystem path exists.

```cpp id="gksx5r"
auto found = vix::fs::exists("vix.app");
```

A missing path returns a successful result with `false`. An empty path or filesystem failure returns an error.

### is_file

```cpp id="th5qs2"
[[nodiscard]] FsBoolResult is_file(std::string_view path);
```

Returns whether a path refers to a regular file.

```cpp id="m3esmi"
auto file = vix::fs::is_file("vix.app");
```

A missing path returns a successful result with `false`.

### is_directory

```cpp id="hoikde"
[[nodiscard]] FsBoolResult is_directory(std::string_view path);
```

Returns whether a path refers to a directory.

```cpp id="jba8uz"
auto dir = vix::fs::is_directory("modules");
```

A missing path returns a successful result with `false`.

### size

```cpp id="jnokif"
[[nodiscard]] FsSizeResult size(std::string_view path);
```

Returns the size of a regular file in bytes.

```cpp id="m1ognt"
auto bytes = vix::fs::size("vix.app");
```

Returns an error when the path is empty, missing, not a regular file, or when the size cannot be read.

### current_path

```cpp id="m6kwwp"
[[nodiscard]] FsPathResult current_path();
```

Returns the current working directory of the process.

```cpp id="jgm8bb"
auto cwd = vix::fs::current_path();
```

Returns an error when the current path cannot be resolved.

### temp_directory

```cpp id="prfg2t"
[[nodiscard]] FsPathResult temp_directory();
```

Returns the system temporary directory path.

```cpp id="b9o1ke"
auto tmp = vix::fs::temp_directory();
```

Returns an error when the temporary directory cannot be resolved.

## Copy, move, rename, and remove

### copy

```cpp id="yuiol7"
[[nodiscard]] FsBoolResult copy(
  std::string_view from,
  std::string_view to
);
```

Copies a file or directory from `from` to `to`.

```cpp id="bgoiy4"
auto copied = vix::fs::copy("assets/logo.png", "dist/logo.png");
```

Directories are copied recursively. Existing destination files are overwritten by the current implementation. Returns an error when either path is empty, the source does not exist, or the copy operation fails.

### move

```cpp id="lznwai"
[[nodiscard]] FsBoolResult move(
  std::string_view from,
  std::string_view to
);
```

Moves a file or directory from `from` to `to`.

```cpp id="dtvnj0"
auto moved = vix::fs::move("build/tmp", "build/cache");
```

Returns an error when either path is empty, the source does not exist, or the move operation fails.

### rename

```cpp id="b3qzvc"
[[nodiscard]] FsBoolResult rename(
  std::string_view from,
  std::string_view to
);
```

Renames a file or directory. This function delegates to `move()`.

```cpp id="tnrl36"
auto renamed = vix::fs::rename("old.txt", "new.txt");
```

Use `rename()` when the operation reads as changing an entry name, and `move()` when it reads as relocating a path.

### remove

```cpp id="viv9mf"
[[nodiscard]] FsBoolResult remove(std::string_view path);
```

Removes a file or an empty directory.

```cpp id="a3gbg9"
auto removed = vix::fs::remove("old.txt");
```

Returns `true` when something was removed and `false` when the path did not exist. Returns an error when the path is empty or the remove operation fails.

### remove_all

```cpp id="e4011n"
[[nodiscard]] FsSizeResult remove_all(std::string_view path);
```

Removes a file or directory tree recursively.

```cpp id="ezpqbm"
auto removed = vix::fs::remove_all("build/tmp");
```

Returns the number of removed filesystem entries. Returns an error when the path is empty or recursive removal fails.

## Minimal example

```cpp id="jbpzgw"
#include <iostream>

#include <vix/fs.hpp>

int main()
{
  auto ready = vix::fs::ensure_directory("tmp/example");
  if (!ready) {
    std::cerr << ready.error().message() << '\n';
    return 1;
  }

  auto written = vix::fs::write_text(
    "tmp/example/hello.txt",
    "hello from Vix FS\n"
  );

  if (!written) {
    std::cerr << written.error().message() << '\n';
    return 1;
  }

  auto content = vix::fs::read_text("tmp/example/hello.txt");
  if (!content) {
    std::cerr << content.error().message() << '\n';
    return 1;
  }

  std::cout << content.value();

  auto cleanup = vix::fs::remove_all("tmp/example");
  if (!cleanup) {
    std::cerr << cleanup.error().message() << '\n';
    return 1;
  }

  return 0;
}
```

This completes the FS module reference.
