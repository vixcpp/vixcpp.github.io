# Errors

The FS module reports failures through the same structured error model used by the rest of Vix. Every filesystem operation returns a `Result<T>` alias. When the result succeeds, the caller reads the value. When it fails, the caller receives a `vix::error::Error` with a stable error code, the `fs` category, and a message that explains the concrete filesystem failure.

For normal use, include the public header:

```cpp id="r4f4m2"
#include <vix/fs.hpp>
```

This error model is important because filesystem operations fail for many ordinary reasons. A path may be empty, a file may not exist, a directory may be required but a file was found instead, permissions may block an operation, or the operating system may reject a copy, move, or removal. The FS module keeps those failures explicit without exposing raw exceptions at every call site.

## Result failure

A failed FS result means the operation could not be completed.

```cpp id="ixmn4z"
auto content = vix::fs::read_text("missing.txt");

if (!content) {
  const auto& err = content.error();

  // err.code()
  // err.category().name()
  // err.message()
}
```

The boolean conversion follows the normal `Result<T>` rule: `true` means the result contains a value, and `false` means it contains an error.

```cpp id="qozv07"
auto result = vix::fs::write_text("output/app.txt", "hello\n");

if (!result) {
  return result.error();
}
```

Do not treat a boolean value inside a successful result as the error state. For example, `exists()` can succeed with `false` when the path does not exist. That is not a failed operation; it is the answer to the check.

```cpp id="cliuo7"
auto found = vix::fs::exists("missing.txt");

if (!found) {
  return found.error();
}

if (!found.value()) {
  // the operation succeeded, and the path does not exist
}
```

## Filesystem error category

FS errors use the `fs` category.

```cpp id="b5kwv2"
auto result = vix::fs::read_text("");

if (!result) {
  const auto& err = result.error();

  // err.category().name() == "fs"
}
```

The category lets diagnostics and higher-level modules identify the domain of the failure without parsing the message. A configuration loader, for example, may receive an FS error while trying to read `vix.app`. It can preserve the original filesystem failure or wrap it with configuration-specific context depending on the API boundary.

## Filesystem-specific codes

Internally, the module defines `FsErrorCode` for filesystem-specific meaning.

```cpp id="bw5d33"
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

These codes are specific to filesystem behavior. They make it possible for the module to describe failures precisely while still returning the shared Vix `Error` type to callers.

The public error object stores a generic `vix::error::ErrorCode`, not an `FsErrorCode`. The conversion keeps FS aligned with the rest of Vix.

```cpp id="xtmzre"
vix::fs::FsErrorCode::EmptyPath      -> vix::error::ErrorCode::InvalidArgument
vix::fs::FsErrorCode::NotFound       -> vix::error::ErrorCode::NotFound
vix::fs::FsErrorCode::AlreadyExists  -> vix::error::ErrorCode::AlreadyExists
vix::fs::FsErrorCode::ReadFailed     -> vix::error::ErrorCode::IoError
vix::fs::FsErrorCode::WriteFailed    -> vix::error::ErrorCode::IoError
vix::fs::FsErrorCode::CreateFailed   -> vix::error::ErrorCode::FilesystemError
vix::fs::FsErrorCode::RemoveFailed   -> vix::error::ErrorCode::FilesystemError
```

This means higher-level code can work with the common `ErrorCode` vocabulary while still getting filesystem-specific messages and the `fs` category.

## Building an FS error

The helper `make_fs_error()` builds a structured Vix error from an `FsErrorCode`.

```cpp id="w2107v"
return vix::fs::make_fs_error(
  vix::fs::FsErrorCode::NotFound,
  "source path does not exist"
);
```

The returned object is a `vix::error::Error`. Its code is produced by converting the filesystem-specific code, its category is `fs`, and its message is the text passed by the caller.

This helper is useful when writing FS-related code that needs to return the same kind of error as the built-in module functions.

```cpp id="pd006h"
vix::error::Result<std::string> read_required_file(const std::string& path)
{
  auto file = vix::fs::is_file(path);
  if (!file) {
    return file.error();
  }

  if (!file.value()) {
    return vix::fs::make_fs_error(
      vix::fs::FsErrorCode::NotAFile,
      "expected a regular file"
    );
  }

  return vix::fs::read_text(path);
}
```

## Empty path errors

An empty path is treated as an invalid operation input.

```cpp id="jxx77c"
auto result = vix::fs::read_text("");

if (!result) {
  const auto& err = result.error();
  // file path cannot be empty
}
```

This applies across the module. Functions such as `exists()`, `read_text()`, `write_text()`, `remove()`, `size()`, and `list_directory()` return a failed result when the path is empty.

This behavior is deliberate. An empty path is not the same as a missing file. It usually means the caller failed to build or pass a meaningful path.

## Missing paths

Missing paths are handled according to the operation.

For check-style functions, absence can be a valid answer. `exists()`, `is_file()`, and `is_directory()` succeed with `false` when the path does not exist.

```cpp id="nm8tgs"
auto found = vix::fs::exists("missing.txt");

if (found && !found.value()) {
  // valid check, path is absent
}
```

For operations that require the path to exist, absence is an error. `read_text()`, `read_file()`, `size()`, `list_directory()`, `copy()`, and `move()` cannot complete their requested work if the required source path is missing.

```cpp id="b8mod6"
auto listed = vix::fs::list_directory("missing-dir");

if (!listed) {
  const auto& err = listed.error();
  // directory path does not exist
}
```

The difference comes from the operation’s meaning. A check can answer “no”. A read, list, size, copy, or move operation needs a real target to operate on.

## Type errors

Some operations require a specific kind of filesystem entry. `size()` expects a regular file. `list_directory()` expects a directory. `touch()` rejects directory paths because it is meant to create or update a file.

```cpp id="bzuyzy"
auto bytes = vix::fs::size("modules");

if (!bytes) {
  const auto& err = bytes.error();
  // path is not a regular file
}
```

These failures are reported as structured errors rather than being folded into a `false` result, because the operation did not complete successfully.

## Preserving errors through workflows

Because FS uses `Result<T>`, errors can be returned directly from higher-level functions.

```cpp id="lsn6gg"
vix::error::Result<std::string> load_config()
{
  auto found = vix::fs::exists("vix.app");
  if (!found) {
    return found.error();
  }

  if (!found.value()) {
    return vix::fs::make_fs_error(
      vix::fs::FsErrorCode::NotFound,
      "vix.app was not found"
    );
  }

  return vix::fs::read_text("vix.app");
}
```

This keeps the error path clear. The function does not need a separate output parameter, exception boundary, or magic return value. It either returns the file content or returns a structured error.

## Practical rule

Treat a failed FS result as an operation failure and inspect `result.error()`. Treat the stored value as the successful filesystem answer. This distinction keeps code correct for functions such as `exists()`, `create_directory()`, and `remove()`, where `false` can be a valid result.

The next page contains the API reference for the FS module.
