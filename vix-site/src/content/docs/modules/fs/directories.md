# Directories

Directory operations in the FS module cover the common setup work needed by Vix tools and applications: creating output folders, preparing cache directories, checking whether a path is really a directory, and removing generated directory trees when they are no longer needed.

For normal use, include the public header:

```cpp id="g5s7fu"
#include <vix/fs.hpp>
```

The directory APIs return `Result<T>` aliases, so a failed filesystem operation is always reported through the same structured error path used by the rest of Vix.

## Creating one directory

Use `create_directory()` when the path should represent one directory level.

```cpp id="kllm6x"
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

The returned value is the successful filesystem answer. `true` means a directory was created. `false` means the directory already existed. A failed result means the operation could not be completed, for example because the path was empty, the filesystem rejected the operation, or another entry already exists at that path and it is not a directory.

This distinction matters because an existing directory is not an error. Many setup workflows can safely continue when the directory is already present.

## Creating a directory hierarchy

Use `create_directories()` when the path may contain several missing levels.

```cpp id="xwfsgv"
auto created = vix::fs::create_directories("build/generated/assets");

if (!created) {
  return created.error();
}
```

This function creates the full hierarchy needed for the final directory to exist. It returns `true` when at least one directory was created and `false` when the full hierarchy already existed.

```cpp id="gp7k44"
auto created = vix::fs::create_directories("storage/cache");

if (!created) {
  return created.error();
}

if (!created.value()) {
  // the hierarchy was already present
}
```

Use this function for generated output, nested storage paths, test workspaces, and project folders where the parent directories may not exist yet.

## Ensuring a directory exists

Use `ensure_directory()` when the caller does not care whether the directory already existed or had to be created.

```cpp id="iy0fag"
auto ready = vix::fs::ensure_directory("storage/cache");

if (!ready) {
  return ready.error();
}
```

`ensure_directory()` returns `true` when the directory exists after the operation. That makes it the most direct choice for runtime setup code, because the caller’s real requirement is usually not “create this directory”, but “make sure this directory is ready before I write into it”.

```cpp id="vf1btl"
auto ready = vix::fs::ensure_directory("build/logs");

if (!ready) {
  return ready.error();
}

auto written = vix::fs::write_text("build/logs/app.log", "started\n");
if (!written) {
  return written.error();
}
```

The write APIs do not create parent directories automatically. Preparing the directory explicitly keeps the failure easier to understand: if directory creation fails, the error is reported before the write operation is attempted.

## Checking directory paths

Use `is_directory()` when a path must be a directory before another operation can safely run.

```cpp id="i0nzj1"
auto check = vix::fs::is_directory("modules");

if (!check) {
  return check.error();
}

if (!check.value()) {
  // the path does not exist or is not a directory
}
```

A missing path is not an error for `is_directory()`. The function succeeds with `false`, because the check itself completed and the answer was negative. An empty path or filesystem failure returns an error.

For setup code, `ensure_directory()` is usually better than checking first and creating later. For validation code, `is_directory()` is useful when the operation should only proceed if the user provided an existing directory.

## Listing directory contents

Directory listing is handled by `list_directory()`, which returns `FsEntry` values.

```cpp id="g92zmn"
auto listed = vix::fs::list_directory("modules");

if (!listed) {
  return listed.error();
}

for (const auto& entry : listed.value()) {
  // entry.name
}
```

The default listing is shallow. Recursive listing and hidden-entry behavior are controlled with `FsOptions`. Listing is covered in more detail on the next page.

## Removing directory trees

Use `remove()` for a file or an empty directory. Use `remove_all()` for a directory tree.

```cpp id="uxuygc"
auto removed = vix::fs::remove_all("build/generated");

if (!removed) {
  return removed.error();
}

std::uintmax_t count = removed.value();
```

`remove_all()` returns the number of removed filesystem entries. It is useful for cleaning build output, temporary workspaces, and test folders. Because it removes recursively, it should be used only after the target path is known and intentional.

```cpp id="ix476a"
auto found = vix::fs::exists("build/generated");
if (!found) {
  return found.error();
}

if (found.value()) {
  auto removed = vix::fs::remove_all("build/generated");
  if (!removed) {
    return removed.error();
  }
}
```

This pattern is useful when the path comes from project state or generated output and the code wants to make the removal decision explicit.

## A practical directory setup flow

A typical Vix workflow prepares a directory, writes files into it, then removes it during cleanup or tests.

```cpp id="x6dxo6"
#include <iostream>
#include <vix/fs.hpp>

int main()
{
  const std::string dir = "tmp/vix-workspace";
  const std::string file = dir + "/state.txt";

  auto ready = vix::fs::ensure_directory(dir);
  if (!ready) {
    std::cerr << ready.error().message() << '\n';
    return 1;
  }

  auto written = vix::fs::write_text(file, "ready\n");
  if (!written) {
    std::cerr << written.error().message() << '\n';
    return 1;
  }

  auto check = vix::fs::is_directory(dir);
  if (!check) {
    std::cerr << check.error().message() << '\n';
    return 1;
  }

  if (!check.value()) {
    std::cerr << "workspace path is not a directory\n";
    return 1;
  }

  auto cleanup = vix::fs::remove_all(dir);
  if (!cleanup) {
    std::cerr << cleanup.error().message() << '\n';
    return 1;
  }

  return 0;
}
```

This keeps each filesystem assumption visible. The directory is prepared before writing, the write is checked before continuing, and recursive cleanup is performed only after the path has been chosen deliberately.

The next page explains directory listing and `FsEntry` values.
