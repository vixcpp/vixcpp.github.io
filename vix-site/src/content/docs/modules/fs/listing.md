# Listing

Directory listing in the FS module is handled by `list_directory()`. It reads entries from the real filesystem and returns a list of `FsEntry` values, giving the caller a simple view of each file, directory, or symbolic link found inside the target directory.

For normal use, include the public header:

```cpp id="fscn1p"
#include <vix/fs.hpp>
```

The default listing is shallow. It lists the entries directly inside the directory, but it does not walk into nested directories unless recursive listing is requested through `FsOptions`.

## Listing a directory

Use `list_directory()` with a path to read the entries inside that directory.

```cpp id="yaplal"
auto listed = vix::fs::list_directory("modules");

if (!listed) {
  return listed.error();
}

for (const auto& entry : listed.value()) {
  // entry.name
}
```

A successful result contains a `std::vector<FsEntry>`. A failed result means the listing operation could not be completed. An empty path, a missing directory, a path that is not a directory, or a filesystem failure will return an error.

```cpp id="fmg8b6"
auto listed = vix::fs::list_directory("");

if (!listed) {
  const auto& err = listed.error();
  // handle filesystem error
}
```

A missing directory is an error for `list_directory()` because the operation is not asking whether the path exists. It is asking to read entries from a directory, and that cannot happen if the directory is not present.

## FsEntry

Each listed item is returned as an `FsEntry`.

```cpp id="pam7vu"
struct FsEntry
{
  std::string path;
  std::string name;
  FsEntryType type;
  std::uintmax_t size;
  bool hidden;
};
```

`path` contains the full entry path as reported by the filesystem operation. `name` contains only the filename portion. This keeps common listing code simple, because most callers want to display or compare the entry name while still preserving the full path for later operations.

```cpp id="xsy2wo"
for (const auto& entry : listed.value()) {
  std::cout << entry.name << " -> " << entry.path << '\n';
}
```

`type` is a high-level classification represented by `FsEntryType`.

```cpp id="o92nvx"
enum class FsEntryType
{
  Unknown = 0,
  File,
  Directory,
  Symlink
};
```

For regular files, `size` contains the file size when it can be read. For directories and entries where the size is not available, the value is normally `0`. The `hidden` field is based on the entry name; names beginning with `.` are treated as hidden.

## Shallow listing

Shallow listing is the default behavior.

```cpp id="ddh4gz"
auto listed = vix::fs::list_directory("storage");
```

If `storage` contains a file named `root.txt` and a directory named `nested`, the result will include both `root.txt` and `nested`. It will not include files inside `nested`.

This is the safest default for most tooling code. A shallow listing gives the caller a view of one directory level without accidentally walking a large tree.

## Recursive listing

Use `FsOptions` when the listing should include nested entries.

```cpp id="y7tfmq"
vix::fs::FsOptions options;
options.recursive = true;

auto listed = vix::fs::list_directory("storage", options);
```

The same behavior can also be requested through `list_mode`.

```cpp id="dtvv7q"
vix::fs::FsOptions options;
options.list_mode = vix::fs::DirectoryListMode::Recursive;

auto listed = vix::fs::list_directory("storage", options);
```

Recursive listing walks the directory tree and returns entries from nested directories as well. Use it when the caller needs to process a whole workspace, clean generated files after inspection, collect assets, or discover files in a module tree.

Because recursive traversal can touch many paths, it is better to use it deliberately rather than making it the default.

## Hidden entries

By default, hidden entries are included.

```cpp id="g5nz79"
auto listed = vix::fs::list_directory("storage");
```

To exclude hidden entries, set `include_hidden` to `false`.

```cpp id="ragdqy"
vix::fs::FsOptions options;
options.include_hidden = false;

auto listed = vix::fs::list_directory("storage", options);
```

The current rule is simple: an entry is treated as hidden when its filename starts with `.`. This matches common project and Unix-style conventions for files such as `.env`, `.gitignore`, or `.cache`.

## Filtering results

The listing API returns filesystem entries. Filtering is normally done by the caller, because different modules care about different rules.

```cpp id="ryy8op"
auto listed = vix::fs::list_directory("modules");
if (!listed) {
  return listed.error();
}

for (const auto& entry : listed.value()) {
  if (entry.type != vix::fs::FsEntryType::Directory) {
    continue;
  }

  // use directory entry
}
```

This keeps `list_directory()` focused on reading the filesystem. A module that wants only directories, only regular files, or only entries with a specific extension can express that logic locally without adding many specialized listing functions.

## A practical listing workflow

The following example lists a directory recursively, skips hidden entries, and prints the entries with their type.

```cpp id="ewh90c"
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
    switch (entry.type) {
      case vix::fs::FsEntryType::File:
        std::cout << "[file] ";
        break;

      case vix::fs::FsEntryType::Directory:
        std::cout << "[dir]  ";
        break;

      case vix::fs::FsEntryType::Symlink:
        std::cout << "[link] ";
        break;

      default:
        std::cout << "[?]    ";
        break;
    }

    std::cout << entry.path << '\n';
  }

  return 0;
}
```

The important pattern is the same as other FS APIs: request the listing, check the result, then iterate over the returned entries only after success has been confirmed.

The next page explains copying, moving, renaming, and removing filesystem entries.
