# FS

The FS module provides Vix with a small, explicit filesystem API for working with files, directories, paths, and filesystem metadata. It is used for the kind of work that appears constantly inside a C++ developer tool: reading project files, writing generated output, creating build directories, listing module folders, copying assets, cleaning temporary files, and checking whether expected paths exist.

The module works on the real filesystem. Its public API keeps paths simple, returns structured `Result<T>` values, and reports failures through the shared Vix error model. This gives Vix code a consistent way to handle filesystem operations without scattering raw `std::filesystem` exceptions or ad-hoc boolean conventions across modules.

## Include the module

For most code, include the umbrella header:

```cpp
#include <vix/fs.hpp>
```

You can also include only the operation you need:

```cpp
#include <vix/fs/ReadText.hpp>
#include <vix/fs/WriteText.hpp>
#include <vix/fs/CreateDirectories.hpp>
```

All public APIs live in the `vix::fs` namespace.

## The basic model

FS functions return result aliases built on top of `vix::error::Result<T>`. A function either succeeds with a value or fails with a structured error.

```cpp
auto result = vix::fs::read_text("vix.app");

if (!result) {
  const auto& err = result.error();
  // err.code()
  // err.category().name()
  // err.message()
  return;
}

std::string content = result.value();
```

The result type depends on the operation. Functions such as `exists()`, `write_text()`, `copy()`, and `remove()` return `FsBoolResult`. Functions such as `read_text()` return `FsStringResult`, `read_file()` returns `FsBytesResult`, `list_directory()` returns `FsEntryListResult`, and `size()` or `remove_all()` return `FsSizeResult`.

This keeps the call site clear. The caller does not need to guess whether `false` means failure, absence, or a valid result. A failed operation is represented by a failed `Result<T>`. A successful operation may still return `false` when that is the meaningful filesystem answer, such as `exists()` returning `false` for a missing path.

## Reading and writing files

Text and binary operations are separated. Use `read_text()` and `write_text()` for text content, and use `read_file()` and `write_file()` for raw bytes.

```cpp
auto created = vix::fs::create_directories("build/generated");
if (!created) {
  return created.error();
}

auto written = vix::fs::write_text(
  "build/generated/config.txt",
  "name = app\n"
);

if (!written) {
  return written.error();
}

auto read = vix::fs::read_text("build/generated/config.txt");
if (!read) {
  return read.error();
}

std::string content = read.value();
```

`write_text()` and `write_file()` overwrite existing content. `append_file()` adds content to the end of a file and creates the file if it does not already exist. Parent directories should be created explicitly before writing when they may not exist.

## Working with directories

The module provides separate functions for creating one directory, creating a hierarchy, and ensuring that a directory exists.

```cpp
auto result = vix::fs::ensure_directory("storage/cache");

if (!result) {
  return result.error();
}
```

`create_directory()` creates a single directory and returns `false` when the directory already exists. `create_directories()` creates a full hierarchy and also returns `false` when the hierarchy already exists. `ensure_directory()` is the most direct choice when the caller only cares that the directory exists after the operation.

Directory listing returns `FsEntry` values. Each entry contains the full path, the entry name, a high-level type, the size when known, and whether the entry is hidden.

```cpp
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

By default, listing is shallow. Recursive listing and hidden-file behavior can be controlled through `FsOptions`.

## Copying, moving, and removing

The module includes direct operations for common filesystem changes.

```cpp
auto copied = vix::fs::copy("public", "dist/public");
auto moved = vix::fs::move("build/tmp", "build/cache");
auto removed = vix::fs::remove("old.txt");
```

`rename()` is provided as a filesystem-friendly alias around the move operation. `remove()` deletes a file or an empty directory and returns `false` when the path does not exist. `remove_all()` removes a file or directory tree recursively and returns the number of removed entries.

```cpp
auto removed = vix::fs::remove_all("build/tmp");

if (removed) {
  auto count = removed.value();
}
```

Use `remove_all()` carefully because it is recursive by design.

## Metadata and process paths

FS also exposes small helpers for common checks and filesystem metadata.

```cpp
auto found = vix::fs::exists("vix.app");
auto is_file = vix::fs::is_file("vix.app");
auto is_dir = vix::fs::is_directory("modules");
auto bytes = vix::fs::size("vix.app");
```

`current_path()` returns the current working directory of the process, and `temp_directory()` returns the system temporary directory path.

```cpp
auto cwd = vix::fs::current_path();
auto tmp = vix::fs::temp_directory();
```

These helpers are useful in CLI and runtime code where paths are often resolved relative to the process environment.

## Error behavior

Filesystem errors are converted into the shared Vix error model. Internally, the module uses filesystem-specific codes such as `EmptyPath`, `NotFound`, `NotAFile`, `NotADirectory`, `ReadFailed`, `WriteFailed`, `CreateFailed`, and `RemoveFailed`. Publicly, these failures are returned as `vix::error::Error` values with the `fs` category.

```cpp
auto result = vix::fs::read_text("");

if (!result) {
  const auto& err = result.error();

  // err.category().name() == "fs"
  // err.message() explains the concrete filesystem failure
}
```

This means FS errors can move through the same `Result<T>` workflow used by the rest of Vix. A module that reads a file, parses its content, and validates its structure can return one clear error path instead of mixing exceptions, booleans, and string messages.

## Pages in this section

- [Quick Start](./quick-start.md)
- [Paths and Results](./paths-and-results.md)
- [Read and Write](./read-and-write.md)
- [Directories](./directories.md)
- [Listing](./listing.md)
- [Copy, Move, and Remove](./copy-move-remove.md)
- [Metadata](./metadata.md)
- [Options](./options.md)
- [Errors](./errors.md)
- [API Reference](./api-reference.md)

Start with the quick start page if you want to see the main filesystem workflow in a compact example.
