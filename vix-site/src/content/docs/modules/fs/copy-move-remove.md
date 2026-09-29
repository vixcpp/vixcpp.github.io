# Copy, Move, and Remove

The FS module provides direct operations for changing the filesystem: copying files or directories, moving paths, renaming entries, removing one path, and removing a full directory tree. These functions are useful in Vix tooling code where generated files, build output, assets, module folders, and temporary workspaces need to be managed in a predictable way.

For normal use, include the public header:

```cpp id="g0o1c9"
#include <vix/fs.hpp>
```

All functions return `Result<T>` aliases. A failed result means the filesystem operation could not be completed. A successful result contains the operation’s normal filesystem answer.

## Copying files and directories

Use `copy()` to copy a file or directory from one path to another.

```cpp id="qom7h6"
auto copied = vix::fs::copy("public", "dist/public");

if (!copied) {
  return copied.error();
}
```

The source path and destination path must both be non-empty. The source path must also exist. When the source is a directory, the copy is recursive. When the source is a file, the file is copied directly. Existing destination files are overwritten by the current implementation.

```cpp id="p3ccxn"
auto copied = vix::fs::copy("assets/logo.png", "dist/assets/logo.png");

if (!copied) {
  const auto& err = copied.error();
  // handle copy failure
}
```

`copy()` does not create the destination parent directory as a separate public behavior. Prepare the target directory before copying when the parent may not already exist.

```cpp id="actkp9"
auto ready = vix::fs::ensure_directory("dist/assets");
if (!ready) {
  return ready.error();
}

auto copied = vix::fs::copy("assets/logo.png", "dist/assets/logo.png");
if (!copied) {
  return copied.error();
}
```

This makes the workflow easier to diagnose. If the destination folder cannot be created, the error comes from the directory setup step. If the copy itself fails, the error belongs to the copy operation.

## Moving paths

Use `move()` to move a file or directory from one path to another.

```cpp id="jqrzjo"
auto moved = vix::fs::move("build/tmp", "build/cache");

if (!moved) {
  return moved.error();
}
```

The move operation requires a non-empty source path, a non-empty destination path, and an existing source. Internally, it uses the filesystem rename operation, so it follows the behavior and limits of the underlying platform. Moving across filesystem boundaries may not behave the same way as copying followed by removing, depending on the operating system and target paths.

```cpp id="i81orc"
auto moved = vix::fs::move("output/app.log", "logs/app.log");

if (!moved) {
  const auto& err = moved.error();
  // handle move failure
}
```

As with copying, prepare the destination parent directory before moving when it may not exist.

## Renaming entries

`rename()` is provided as a filesystem-friendly name for the same operation as `move()`.

```cpp id="ry84qy"
auto renamed = vix::fs::rename("logs/current.log", "logs/previous.log");

if (!renamed) {
  return renamed.error();
}
```

Use `rename()` when the operation reads naturally as changing the name of an entry in place. Use `move()` when the operation reads as relocating a file or directory. Both follow the same implementation path.

## Removing one path

Use `remove()` to delete a file or an empty directory.

```cpp id="dcav4v"
auto removed = vix::fs::remove("old.txt");

if (!removed) {
  return removed.error();
}
```

A successful result with `true` means something was removed. A successful result with `false` means the path did not exist.

```cpp id="d7b42g"
auto removed = vix::fs::remove("missing.txt");

if (!removed) {
  return removed.error();
}

if (!removed.value()) {
  // nothing was removed because the path was not present
}
```

This is an important distinction. A missing path is not a removal failure for `remove()`. The filesystem operation completed and reported that there was nothing to delete. An empty path, permission problem, invalid path, or filesystem exception returns a failed result.

## Removing a directory tree

Use `remove_all()` to remove a file or directory tree recursively.

```cpp id="i6ahsn"
auto removed = vix::fs::remove_all("build/generated");

if (!removed) {
  return removed.error();
}

std::uintmax_t count = removed.value();
```

The returned value is the number of filesystem entries removed. If the path does not exist, the operation can succeed with `0`. If the path is empty or the filesystem rejects the recursive removal, the result fails with a structured FS error.

Because `remove_all()` is recursive, use it only when the target path is known and intentional. This matters in CLI and build tooling, where paths may come from project configuration, user input, or generated state.

```cpp id="oj8xkx"
const std::string output = "build/generated";

auto found = vix::fs::exists(output);
if (!found) {
  return found.error();
}

if (found.value()) {
  auto removed = vix::fs::remove_all(output);
  if (!removed) {
    return removed.error();
  }
}
```

The explicit `exists()` check is not required by the API, but it can make destructive workflows easier to read when the path is important.

## A practical copy and cleanup workflow

The following example prepares an output directory, copies an asset folder, renames a generated file, and then removes a temporary workspace.

```cpp id="pj5zub"
#include <iostream>
#include <vix/fs.hpp>

int main()
{
  auto dist_ready = vix::fs::ensure_directory("dist/assets");
  if (!dist_ready) {
    std::cerr << dist_ready.error().message() << '\n';
    return 1;
  }

  auto copied = vix::fs::copy("assets/logo.png", "dist/assets/logo.png");
  if (!copied) {
    std::cerr << copied.error().message() << '\n';
    return 1;
  }

  auto renamed = vix::fs::rename("dist/assets/logo.png", "dist/assets/app-logo.png");
  if (!renamed) {
    std::cerr << renamed.error().message() << '\n';
    return 1;
  }

  auto cleanup = vix::fs::remove_all("tmp/workspace");
  if (!cleanup) {
    std::cerr << cleanup.error().message() << '\n';
    return 1;
  }

  std::cout << "removed temporary entries: " << cleanup.value() << '\n';
  return 0;
}
```

The pattern is the same as the rest of the FS module: prepare the filesystem state explicitly, run the operation, check the result, and only then use the returned value.

The next page explains metadata helpers such as `exists()`, `is_file()`, `is_directory()`, `size()`, `current_path()`, and `temp_directory()`.
