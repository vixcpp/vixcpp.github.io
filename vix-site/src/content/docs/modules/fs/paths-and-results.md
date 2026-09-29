# Paths and Results

The FS module keeps its public path and result types simple on purpose. Filesystem code already has enough platform details to manage: separators, working directories, relative paths, permissions, missing files, and failed operations. The public API gives Vix modules a predictable surface while still allowing the implementation to rely on `std::filesystem` internally.

For normal use, include the public header:

```cpp id="xm5x2d"
#include <vix/fs.hpp>
```

All FS APIs live in the `vix::fs` namespace.

## Paths

The public path type is `FsPath`.

```cpp id="fgbr0b"
using FsPath = std::string;
```

Vix uses `std::string` for the developer-facing path type because it keeps common filesystem operations easy to call from CLI code, runtime code, generated project logic, and module tooling. Most public functions also accept `std::string_view`, so callers can pass string literals, `std::string`, or other string-like values without unnecessary ceremony.

```cpp id="z4rz60"
auto found = vix::fs::exists("vix.app");

std::string path = "modules/fs";
auto listed = vix::fs::list_directory(path);
```

Internally, the module converts these values to `std::filesystem::path` when the operation needs to touch the real filesystem. The public API does not expose that detail at every call site because most Vix code does not need to reason about `std::filesystem::path` directly.

## Empty paths

An empty path is treated as an error. Functions such as `exists()`, `read_text()`, `write_text()`, `remove()`, and `list_directory()` return a failed result when the path is empty.

```cpp id="c7ub37"
auto result = vix::fs::exists("");

if (!result) {
  const auto& err = result.error();
  // err.category().name() == "fs"
}
```

This is different from a missing path. A missing path can be a valid filesystem answer, depending on the operation. For example, `exists("missing.txt")` succeeds with the value `false`, while `read_text("missing.txt")` fails because the file cannot be opened for reading.

```cpp id="a78jmp"
auto found = vix::fs::exists("missing.txt");

if (found && !found.value()) {
  // the check succeeded, and the path does not exist
}
```

That distinction is important in Vix code. A failed result means the operation could not be completed. A successful result with `false` means the operation completed and the answer was negative.

## Result aliases

FS result types are aliases over `vix::error::Result<T>`. They keep function signatures readable while preserving the same explicit error workflow used by the rest of Vix.

```cpp id="d85gjs"
using FsBoolResult = vix::error::Result<bool>;
using FsPathResult = vix::error::Result<std::string>;
using FsStringResult = vix::error::Result<std::string>;
using FsBytesResult = vix::error::Result<Bytes>;
using FsEntryListResult = vix::error::Result<std::vector<FsEntry>>;
using FsSizeResult = vix::error::Result<std::uintmax_t>;
```

A result contains either a value or an error. The caller should check the result before reading the value.

```cpp id="nmmidx"
auto content = vix::fs::read_text("vix.app");

if (!content) {
  return content.error();
}

std::string text = content.value();
```

The boolean conversion of a result means success. When `if (result)` is true, the value is available. When it is false, the error is available.

## Boolean results

Many filesystem operations return `FsBoolResult`. This does not mean failure is represented by `false`. Failure is represented by a failed result. The boolean value is the successful answer returned by the filesystem operation.

```cpp id="jv9yd2"
auto created = vix::fs::create_directory("build");

if (!created) {
  return created.error();
}

if (created.value()) {
  // the directory was created
} else {
  // the directory already existed
}
```

This pattern appears in several APIs. `create_directory()` and `create_directories()` return `false` when the directory or hierarchy already exists. `exists()` returns `false` when the path does not exist. `remove()` returns `false` when there was nothing to remove.

The result itself tells you whether the operation succeeded. The value tells you what the successful filesystem answer was.

## Text and binary results

Text files use `FsStringResult`.

```cpp id="aeq0p8"
auto text = vix::fs::read_text("README.md");

if (!text) {
  return text.error();
}

std::string content = text.value();
```

Binary files use `FsBytesResult`. The `Bytes` type is a `std::vector<std::uint8_t>`.

```cpp id="vgrgbu"
vix::fs::Bytes data{0x10, 0x20, 0x30};

auto written = vix::fs::write_file("data.bin", data);
if (!written) {
  return written.error();
}

auto read = vix::fs::read_file("data.bin");
if (!read) {
  return read.error();
}

const vix::fs::Bytes& bytes = read.value();
```

Keeping text and binary APIs separate makes the call site easier to read. A function name such as `read_text()` says that the file is being interpreted as text, while `read_file()` says the caller wants raw bytes.

## Path results

Some functions return paths. `current_path()` returns the current working directory of the process, and `temp_directory()` returns the system temporary directory.

```cpp id="nw7krh"
auto cwd = vix::fs::current_path();

if (!cwd) {
  return cwd.error();
}

std::string root = cwd.value();
```

These functions still return `Result<T>` because the process environment can fail. The current working directory may not be readable, and the system temporary directory may not be available on a given platform or runtime environment.

## Entry list results

`list_directory()` returns `FsEntryListResult`, which contains a `std::vector<FsEntry>` on success.

```cpp id="ndkwr5"
auto listed = vix::fs::list_directory("modules");

if (!listed) {
  return listed.error();
}

for (const auto& entry : listed.value()) {
  // entry.path
  // entry.name
  // entry.type
  // entry.size
  // entry.hidden
}
```

`FsEntry` is intentionally small. It gives the caller the information needed for common directory listing workflows without exposing every filesystem metadata detail in the first API layer.

```cpp id="ptqrrg"
struct FsEntry
{
  std::string path;
  std::string name;
  FsEntryType type;
  std::uintmax_t size;
  bool hidden;
};
```

The entry type is represented by `FsEntryType`.

```cpp id="rdh4ik"
enum class FsEntryType
{
  Unknown = 0,
  File,
  Directory,
  Symlink
};
```

For regular files, `size` contains the file size when it can be read. For directories and entries where the size is not available, the value is usually `0`.

## Size results

`size()` and `remove_all()` return `FsSizeResult`, but the meaning of the value depends on the operation.

```cpp id="ibc7by"
auto bytes = vix::fs::size("vix.app");

if (!bytes) {
  return bytes.error();
}

std::uintmax_t file_size = bytes.value();
```

For `size()`, the value is the size of a regular file in bytes. For `remove_all()`, the value is the number of filesystem entries removed.

```cpp id="vwak0w"
auto removed = vix::fs::remove_all("build/tmp");

if (!removed) {
  return removed.error();
}

std::uintmax_t count = removed.value();
```

This follows the behavior of the underlying filesystem operation while keeping error handling consistent.

## Practical rule

Check the result first, then read the value. Treat a failed result as an operation failure, and treat the stored value as the successful filesystem answer. This rule keeps FS code clear even when an operation can validly return `false`, an empty string, an empty vector, or zero.

The next page explains text and binary reading and writing in more detail.
