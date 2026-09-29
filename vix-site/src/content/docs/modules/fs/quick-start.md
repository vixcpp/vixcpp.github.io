# Quick Start

The FS module is designed for direct filesystem work in Vix projects: create a directory, write a file, read it back, inspect paths, and clean temporary output when the work is done. The API keeps these operations explicit and returns `Result<T>` values, so each filesystem failure can be handled through the same error model used by the rest of Vix.

For normal use, include the public header:

```cpp id="c7z5sp"
#include <vix/fs.hpp>
```

## Write and read a text file

A common workflow starts by creating the directory where a file should live, then writing the file, then reading it back.

```cpp id="p252gn"
#include <iostream>
#include <string>

#include <vix/fs.hpp>

int main()
{
  auto created = vix::fs::create_directories("storage/config");
  if (!created) {
    std::cerr << created.error().message() << '\n';
    return 1;
  }

  auto written = vix::fs::write_text(
    "storage/config/app.txt",
    "name = demo\n"
  );

  if (!written) {
    std::cerr << written.error().message() << '\n';
    return 1;
  }

  auto content = vix::fs::read_text("storage/config/app.txt");
  if (!content) {
    std::cerr << content.error().message() << '\n';
    return 1;
  }

  std::cout << content.value();
  return 0;
}
```

`create_directories()` creates the full directory hierarchy if it does not already exist. `write_text()` writes text content and overwrites existing content. `read_text()` returns the file content as a `std::string`.

Each operation returns a result. When the result is false, the operation failed and the error is available through `error()`. When the result is true, the value is available through `value()`.

## Check whether a path exists

Use `exists()` when absence is a valid answer. A missing path is not treated as an error; the function succeeds and returns `false`.

```cpp id="bdbzsp"
auto found = vix::fs::exists("storage/config/app.txt");

if (!found) {
  std::cerr << found.error().message() << '\n';
  return;
}

if (found.value()) {
  // the path exists
}
```

This distinction matters. An empty path, invalid path, or filesystem failure returns an error. A well-formed path that simply does not exist returns a successful result with the value `false`.

## Create a directory only when needed

When the caller only cares that a directory exists after the operation, use `ensure_directory()`.

```cpp id="zmgkq5"
auto ready = vix::fs::ensure_directory("storage/cache");

if (!ready) {
  std::cerr << ready.error().message() << '\n';
  return;
}
```

`ensure_directory()` succeeds whether the directory already existed or had to be created. This is usually the right choice for cache folders, generated output folders, and runtime storage directories.

## Work with binary files

Binary file operations use `vix::fs::Bytes`, which is a `std::vector<std::uint8_t>`.

```cpp id="qzu3le"
vix::fs::Bytes data{0x10, 0x20, 0x30, 0x40};

auto written = vix::fs::write_file("storage/data.bin", data);
if (!written) {
  std::cerr << written.error().message() << '\n';
  return;
}

auto read = vix::fs::read_file("storage/data.bin");
if (!read) {
  std::cerr << read.error().message() << '\n';
  return;
}

const vix::fs::Bytes& bytes = read.value();
```

Use text functions for text files and binary functions for raw bytes. The separation keeps the call site clear and avoids guessing how a file should be interpreted.

## List a directory

`list_directory()` returns a list of `FsEntry` values. Each entry contains the full path, entry name, type, size when known, and whether the entry is hidden.

```cpp id="gkgblx"
auto listed = vix::fs::list_directory("storage");

if (!listed) {
  std::cerr << listed.error().message() << '\n';
  return;
}

for (const auto& entry : listed.value()) {
  std::cout << entry.name << '\n';
}
```

The default listing is shallow. To list recursively, pass `FsOptions`.

```cpp id="pxr5w0"
vix::fs::FsOptions options;
options.recursive = true;

auto listed = vix::fs::list_directory("storage", options);
```

## Remove generated files

Use `remove()` for a file or empty directory. Use `remove_all()` for a directory tree.

```cpp id="wcc4kw"
auto removed = vix::fs::remove_all("storage");

if (!removed) {
  std::cerr << removed.error().message() << '\n';
  return;
}

std::cout << "removed entries: " << removed.value() << '\n';
```

`remove_all()` is recursive and returns the number of removed filesystem entries. It should be used deliberately, especially in tools that receive paths from user input.

## A complete small workflow

The following example creates a workspace, writes a file, appends content, checks the final size, and removes the workspace.

```cpp id="eqi85o"
#include <iostream>

#include <vix/fs.hpp>

int main()
{
  const std::string dir = "tmp/fs-demo";
  const std::string file = dir + "/log.txt";

  auto ready = vix::fs::ensure_directory(dir);
  if (!ready) {
    std::cerr << ready.error().message() << '\n';
    return 1;
  }

  auto first = vix::fs::write_text(file, "first line\n");
  if (!first) {
    std::cerr << first.error().message() << '\n';
    return 1;
  }

  auto second = vix::fs::append_file(file, "second line\n");
  if (!second) {
    std::cerr << second.error().message() << '\n';
    return 1;
  }

  auto bytes = vix::fs::size(file);
  if (!bytes) {
    std::cerr << bytes.error().message() << '\n';
    return 1;
  }

  std::cout << "file size: " << bytes.value() << " bytes\n";

  auto cleanup = vix::fs::remove_all(dir);
  if (!cleanup) {
    std::cerr << cleanup.error().message() << '\n';
    return 1;
  }

  return 0;
}
```

This is the normal shape of FS code in Vix: perform the filesystem operation, check the result, and use the returned value only after success has been confirmed.

The next page explains the path and result types used by the module.
