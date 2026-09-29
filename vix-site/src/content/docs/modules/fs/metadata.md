# Metadata

The FS module includes small metadata helpers for common filesystem questions: whether a path exists, whether it is a regular file, whether it is a directory, how large a file is, and which directories the current process or system uses as working paths. These functions are useful before reading, writing, copying, or removing files, because they let the caller make filesystem assumptions explicit.

For normal use, include the public header:

```cpp id="suw8hq"
#include <vix/fs.hpp>
```

Metadata functions return `Result<T>` aliases like the rest of the FS module. A successful result means the check completed. The value then contains the answer. A failed result means the filesystem check itself could not be completed.

## Checking whether a path exists

Use `exists()` to check whether a path is present on the real filesystem.

```cpp id="mjiud1"
auto found = vix::fs::exists("vix.app");

if (!found) {
  return found.error();
}

if (found.value()) {
  // the path exists
}
```

A missing path is not an error for `exists()`. The operation succeeds and returns `false`, because the filesystem check completed correctly. This makes `exists()` useful before optional reads, cleanup steps, generated output checks, or user-facing diagnostics.

```cpp id="g135ls"
auto found = vix::fs::exists("missing.txt");

if (found && !found.value()) {
  // the path does not exist
}
```

An empty path is different. It returns a failed result because the operation did not receive a meaningful filesystem path to check.

## Checking files

Use `is_file()` when a path must refer to a regular file.

```cpp id="c4oj8c"
auto check = vix::fs::is_file("vix.app");

if (!check) {
  return check.error();
}

if (!check.value()) {
  // the path does not exist or is not a regular file
}
```

A missing path returns a successful result with `false`. This follows the same principle as `exists()`: the check was valid, and the answer was negative. A failed result is reserved for cases where the operation itself could not be completed, such as an empty path or a filesystem error.

This is useful when an API expects a file and wants to reject directories before reading.

```cpp id="xgkrl4"
auto file = vix::fs::is_file("storage/config/app.txt");
if (!file) {
  return file.error();
}

if (!file.value()) {
  return vix::fs::make_fs_error(
    vix::fs::FsErrorCode::NotAFile,
    "expected a regular file"
  );
}
```

## Checking directories

Use `is_directory()` when a path must refer to a directory.

```cpp id="yle13w"
auto check = vix::fs::is_directory("modules");

if (!check) {
  return check.error();
}

if (check.value()) {
  // the path is a directory
}
```

For setup workflows, `ensure_directory()` is often the better API because it creates the directory when needed. `is_directory()` is more useful when the caller wants to validate an existing path before listing it, reading a module folder, or accepting a user-provided directory.

```cpp id="d9v2v5"
auto dir = vix::fs::is_directory("modules/fs");

if (!dir) {
  return dir.error();
}

if (!dir.value()) {
  // reject the path or show a diagnostic
}
```

## Reading file size

Use `size()` to get the size of a regular file in bytes.

```cpp id="wiynex"
auto bytes = vix::fs::size("vix.app");

if (!bytes) {
  return bytes.error();
}

std::uintmax_t file_size = bytes.value();
```

`size()` expects a regular file. It returns an error when the path is empty, when the path does not exist, or when the path exists but is not a regular file. This is different from `exists()` and `is_file()`, where a missing path can be a successful negative answer. For `size()`, the requested operation is to read file size, and that requires an existing file.

```cpp id="powowq"
auto bytes = vix::fs::size("modules");

if (!bytes) {
  const auto& err = bytes.error();
  // path is not a regular file, or the size could not be read
}
```

For directory size, use a higher-level traversal workflow with `list_directory()` and sum regular file sizes yourself when that behavior is needed. The `size()` function is intentionally focused on regular files.

## Current working directory

Use `current_path()` to read the current working directory of the process.

```cpp id="q8s6fp"
auto cwd = vix::fs::current_path();

if (!cwd) {
  return cwd.error();
}

std::string root = cwd.value();
```

This is useful in CLI commands, project discovery, and runtime code that needs to resolve relative paths against the process environment. The function still returns a result because the current directory can fail to resolve, especially in unusual process states or restricted environments.

## Temporary directory

Use `temp_directory()` to get the system temporary directory.

```cpp id="ueqwkx"
auto tmp = vix::fs::temp_directory();

if (!tmp) {
  return tmp.error();
}

std::string temp_root = tmp.value();
```

Temporary directories are often used for generated files, intermediate build state, test workspaces, and short-lived artifacts. The function returns the platform-provided temporary directory path as a string.

```cpp id="zv7fqw"
auto tmp = vix::fs::temp_directory();
if (!tmp) {
  return tmp.error();
}

std::string workspace = tmp.value() + "/vix-workspace";

auto ready = vix::fs::ensure_directory(workspace);
if (!ready) {
  return ready.error();
}
```

The caller is still responsible for creating any subdirectory it wants to use inside the temporary directory.

## A practical metadata workflow

The following example validates that a path exists, confirms it is a file, reads its size, then reads the text content.

```cpp id="srbwsv"
#include <iostream>
#include <vix/fs.hpp>

int main()
{
  const std::string path = "vix.app";

  auto found = vix::fs::exists(path);
  if (!found) {
    std::cerr << found.error().message() << '\n';
    return 1;
  }

  if (!found.value()) {
    std::cerr << "path does not exist\n";
    return 1;
  }

  auto file = vix::fs::is_file(path);
  if (!file) {
    std::cerr << file.error().message() << '\n';
    return 1;
  }

  if (!file.value()) {
    std::cerr << "path is not a file\n";
    return 1;
  }

  auto bytes = vix::fs::size(path);
  if (!bytes) {
    std::cerr << bytes.error().message() << '\n';
    return 1;
  }

  std::cout << "size: " << bytes.value() << " bytes\n";

  auto content = vix::fs::read_text(path);
  if (!content) {
    std::cerr << content.error().message() << '\n';
    return 1;
  }

  std::cout << content.value();
  return 0;
}
```

The metadata helpers do not replace the operation they guard. They make the intent clearer when a workflow needs to validate a path before doing something more specific with it.

The next page explains `FsOptions` and where options affect the current FS API.
