# Path Components

The Path module provides helpers for reading and transforming the visible components of a path string. These APIs are useful when Vix needs to extract a filename, read a parent path, inspect an extension, replace an extension, or split one path into structured parts without accessing the filesystem.

For normal use, include the public header:

```cpp id="kf06we"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## Filename

Use `filename()` to return the final component of a path.

```cpp id="nm0yqz"
auto name = vix::path::filename("/home/user/main.cpp");

if (!name) {
  return name.error();
}

// name.value() == "main.cpp"
```

The function is purely lexical. It does not check whether the file exists. It only reads the path string, removes trailing separators, then returns the final segment.

```cpp id="vfqca7"
auto name = vix::path::filename("/home/user/project/");

// name.value() == "project"
```

An empty path returns a structured path error because there is no meaningful component to extract.

## Basename

`basename()` is equivalent to `filename()` in this module.

```cpp id="kdx72e"
auto base = vix::path::basename("/var/log/system.log");

if (!base) {
  return base.error();
}

// base.value() == "system.log"
```

Both names are provided because both are common in path-related code. Use `filename()` when the code is already written in C++ path vocabulary. Use `basename()` when the surrounding code is closer to CLI or Unix-style naming.

## Parent

Use `parent()` to return the directory portion of a path.

```cpp id="v02j3h"
auto dir = vix::path::parent("/home/user/main.cpp");

if (!dir) {
  return dir.error();
}

// dir.value() == "/home/user"
```

`parent()` is lexical. It does not verify that `/home/user` exists and it does not inspect the filesystem. It only removes the final component from the path string.

When there is no parent component, the function returns an empty string as a successful value.

```cpp id="j7umzv"
auto dir = vix::path::parent("main.cpp");

if (!dir) {
  return dir.error();
}

// dir.value() == ""
```

That empty string is not an error. It means the path did not contain a directory portion.

## Dirname

`dirname()` is equivalent to `parent()` in this module.

```cpp id="tzlr2d"
auto dir = vix::path::dirname("/var/log/system.log");

if (!dir) {
  return dir.error();
}

// dir.value() == "/var/log"
```

The two functions exist for the same reason as `filename()` and `basename()`: both naming styles are useful depending on the codebase and the kind of path operation being expressed.

## Stem

Use `stem()` to return the filename without its final extension.

```cpp id="u5yglb"
auto st = vix::path::stem("/home/user/main.cpp");

if (!st) {
  return st.error();
}

// st.value() == "main"
```

The stem is computed from the final filename component, not from the whole path. If the filename has no extension, the filename is returned unchanged.

```cpp id="cewlrp"
auto st = vix::path::stem("/home/user/Makefile");

if (!st) {
  return st.error();
}

// st.value() == "Makefile"
```

For special names such as `.` and `..`, the module preserves the name rather than trying to remove an extension.

## Extension

Use `extension()` to return the final extension of a path, including the leading dot.

```cpp id="o09541"
auto ext = vix::path::extension("/home/user/main.cpp");

if (!ext) {
  return ext.error();
}

// ext.value() == ".cpp"
```

If the filename has no extension, the function succeeds with an empty string.

```cpp id="bmzm6w"
auto ext = vix::path::extension("/home/user/Makefile");

if (!ext) {
  return ext.error();
}

// ext.value() == ""
```

A leading dot alone does not count as a normal extension. This keeps hidden-style filenames such as `.env` from being treated as files with an `env` extension.

## Checking for an extension

Use `has_extension()` when code only needs a boolean answer.

```cpp id="xb6v00"
bool has = vix::path::has_extension("/home/user/main.cpp");
// has == true
```

```cpp id="n4v2g8"
bool has = vix::path::has_extension("/home/user/Makefile");
// has == false
```

Unlike functions such as `filename()` or `extension()`, this helper returns a plain boolean. If the path cannot produce a valid filename, the function returns `false`.

## Replacing an extension

Use `replace_extension()` to replace the final extension of a path.

```cpp id="z0bujr"
auto header = vix::path::replace_extension(
  "/home/user/main.cpp",
  ".hpp"
);

if (!header) {
  return header.error();
}

// header.value() == "/home/user/main.hpp"
```

The new extension may be passed with or without a leading dot. When it does not start with `.`, the module adds one.

```cpp id="mpn9ao"
auto header = vix::path::replace_extension(
  "/home/user/main.cpp",
  "hpp"
);

// header.value() == "/home/user/main.hpp"
```

If the path has no extension, the new extension is appended.

```cpp id="wnx3um"
auto file = vix::path::replace_extension(
  "/home/user/Makefile",
  "txt"
);

// file.value() == "/home/user/Makefile.txt"
```

Passing an empty new extension removes the existing extension when one is present.

```cpp id="dd14zj"
auto file = vix::path::replace_extension(
  "/home/user/main.cpp",
  ""
);

// file.value() == "/home/user/main"
```

## Splitting a path

Use `split()` when code needs several components from the same path.

```cpp id="o8o6p6"
auto parts = vix::path::split("/home/user/main.cpp");

if (!parts) {
  return parts.error();
}

// parts.value().root      == "/"
// parts.value().dirname   == "/home/user"
// parts.value().filename  == "main.cpp"
// parts.value().stem      == "main"
// parts.value().extension == ".cpp"
```

`split()` returns a `PathParts` structure.

```cpp id="f6760t"
struct PathParts
{
  std::string root;
  std::string dirname;
  std::string filename;
  std::string stem;
  std::string extension;
};
```

This is useful for diagnostics, generated metadata, project tooling, and code that wants a stable decomposition of the path string. Instead of calling several helpers separately and keeping the results in sync, the caller can request the structured view once.

## Root

The `root` field stores the detected root portion of the path.

```cpp id="tm8bw8"
auto parts = vix::path::split("/home/user/main.cpp");

if (!parts) {
  return parts.error();
}

// parts.value().root == "/"
```

For Windows-style paths, the root can be a drive root or a UNC-style root.

```cpp id="cql6mp"
auto parts = vix::path::split("C:\\Users\\gaspard\\main.cpp");

if (!parts) {
  return parts.error();
}

// parts.value().root == "C:\\"
```

Root detection is lexical. It reads the shape of the string and does not check the operating system.

## Working with components safely

Component functions that return a path string use `PathResult`. Check the result before reading the value.

```cpp id="gphzcv"
auto name = vix::path::filename("");

if (!name) {
  const auto& err = name.error();
  // err.category().name() == "path"
}
```

Boolean helpers such as `has_extension()` return plain values because their failure mode can be represented as `false`.

```cpp id="qchx51"
if (vix::path::has_extension("src/main.cpp")) {
  // extension is present
}
```

This keeps call sites simple while preserving structured errors for operations that need to return transformed path strings or structured path parts.

## A practical component workflow

The following example splits a source file path, changes the extension, and prints a generated header path.

```cpp id="hy61qy"
#include <iostream>
#include <vix/path.hpp>

int main()
{
  const std::string source = "/home/gaspard/project/src/main.cpp";

  auto parts = vix::path::split(source);
  if (!parts) {
    std::cerr << parts.error().message() << '\n';
    return 1;
  }

  auto header = vix::path::replace_extension(source, "hpp");
  if (!header) {
    std::cerr << header.error().message() << '\n';
    return 1;
  }

  std::cout << "directory: " << parts.value().dirname << '\n';
  std::cout << "filename: " << parts.value().filename << '\n';
  std::cout << "stem: " << parts.value().stem << '\n';
  std::cout << "extension: " << parts.value().extension << '\n';
  std::cout << "header: " << header.value() << '\n';

  return 0;
}
```

The example never touches the filesystem. It only reads and transforms the path string. This is the role of the Path module: keep path structure clear before any real filesystem operation is needed.

The next page explains absolute and relative path operations.
