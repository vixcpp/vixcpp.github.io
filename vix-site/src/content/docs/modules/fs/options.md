# Options

`FsOptions` groups the optional behavior used by filesystem operations. It gives the FS module one place to describe choices such as recursive traversal, hidden entry handling, overwrite behavior, parent directory creation, and symbolic link behavior.

For normal use, include the public header:

```cpp id="eh0l2j"
#include <vix/fs.hpp>
```

The current public API uses `FsOptions` mainly with `list_directory()`. Some fields exist to keep the options model consistent for the module as it grows, but they should not be read as active behavior for every filesystem function today. The documentation in this page focuses on what is supported now and explains the remaining fields carefully.

## The options structure

`FsOptions` is a small value type with defaults chosen for ordinary filesystem work.

```cpp id="cwsdte"
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

A default-constructed `FsOptions` performs a shallow directory listing and includes hidden entries.

```cpp id="ox3wbt"
vix::fs::FsOptions options;

auto listed = vix::fs::list_directory("modules", options);
```

For simple operations, you usually do not need to pass options at all.

```cpp id="d2nbuw"
auto listed = vix::fs::list_directory("modules");
```

## Recursive listing

Use `recursive` when `list_directory()` should walk into nested directories.

```cpp id="kc7kgl"
vix::fs::FsOptions options;
options.recursive = true;

auto listed = vix::fs::list_directory("modules", options);
```

The same behavior can be expressed with `list_mode`.

```cpp id="md60fx"
vix::fs::FsOptions options;
options.list_mode = vix::fs::DirectoryListMode::Recursive;

auto listed = vix::fs::list_directory("modules", options);
```

Both forms are accepted by the current implementation. `recursive` is convenient when code only needs a boolean flag. `list_mode` is useful when the caller wants to make the listing strategy explicit.

## Hidden entries

Hidden entries are included by default.

```cpp id="e18mft"
auto listed = vix::fs::list_directory("modules");
```

To exclude hidden entries, set `include_hidden` to `false`.

```cpp id="k6b1k9"
vix::fs::FsOptions options;
options.include_hidden = false;

auto listed = vix::fs::list_directory("modules", options);
```

The current hidden-file rule is based on the entry name. If the filename starts with `.`, the entry is treated as hidden. This is a simple rule that matches common project files such as `.env`, `.gitignore`, `.cache`, and `.vscode`.

## Listing modes

`DirectoryListMode` describes how directory traversal should behave.

```cpp id="hmqtc0"
enum class DirectoryListMode
{
  Shallow,
  Recursive
};
```

`Shallow` lists only the entries directly inside the target directory. `Recursive` walks through nested directories as well.

```cpp id="qz1isw"
vix::fs::FsOptions options;
options.list_mode = vix::fs::DirectoryListMode::Shallow;
```

The default is shallow because it is predictable and avoids accidentally traversing a large project tree.

## Write and copy modes

`WriteMode` and `CopyMode` are part of the shared options model.

```cpp id="rfnpy6"
enum class WriteMode
{
  Overwrite,
  Append
};

enum class CopyMode
{
  SkipExisting,
  OverwriteExisting
};
```

The current write functions expose their behavior through separate functions rather than through `FsOptions`. `write_text()` and `write_file()` overwrite existing content. `append_file()` appends content. This makes ordinary call sites clear without requiring an options object.

```cpp id="sw87ni"
auto written = vix::fs::write_text("storage/app.txt", "content\n");
auto appended = vix::fs::append_file("storage/app.txt", "more\n");
```

The current `copy()` behavior overwrites existing destination files. Even though `CopyMode` exists in `FsOptions`, the public `copy()` function does not currently take an options argument. Avoid documenting or relying on `CopyMode` as active copy behavior until the copy API accepts options.

## Parent directories

`create_parents` describes whether parent directories should be created automatically.

```cpp id="a81nwe"
vix::fs::FsOptions options;
options.create_parents = true;
```

The current write APIs do not take `FsOptions`, so parent directories should be created explicitly before writing.

```cpp id="pljrcd"
auto ready = vix::fs::ensure_directory("storage/config");
if (!ready) {
  return ready.error();
}

auto written = vix::fs::write_text(
  "storage/config/app.txt",
  "name = demo\n"
);
```

This explicit pattern is the recommended workflow today. It keeps directory setup errors separate from write errors and makes the call sequence easier to diagnose.

## Symbolic links

`follow_symlinks` is present in the options structure, but the current listing implementation does not use it to change traversal behavior.

```cpp id="bofvk8"
vix::fs::FsOptions options;
options.follow_symlinks = false;
```

`list_directory()` can classify symlink entries as `FsEntryType::Symlink` when the filesystem reports them as symbolic links. The option should be treated as reserved for future behavior rather than a fully active traversal control in the current API.

## A practical listing configuration

The most common use of `FsOptions` today is configuring directory listing.

```cpp id="f4q1t3"
#include <iostream>
#include <vix/fs.hpp>

int main()
{
  vix::fs::FsOptions options;
  options.recursive = true;
  options.include_hidden = false;

  auto listed = vix::fs::list_directory("modules", options);
  if (!listed) {
    std::cerr << listed.error().message() << '\n';
    return 1;
  }

  for (const auto& entry : listed.value()) {
    std::cout << entry.path << '\n';
  }

  return 0;
}
```

This example walks the directory tree and skips hidden entries. The result still follows the normal FS pattern: check the result first, then use the returned entries.

## Practical rule

Use `FsOptions` when an FS function accepts it, and rely only on the behavior supported by that function. Today, that mainly means directory listing: shallow or recursive traversal, and whether hidden entries are included. For writing, copying, moving, and removing, use the dedicated functions and prepare the filesystem state explicitly.

The next page explains how filesystem-specific errors are converted into structured Vix errors.
