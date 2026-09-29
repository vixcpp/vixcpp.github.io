# Quick Start

The Path module is used when Vix needs to work with paths as structured text. It can join path fragments, normalize separators, remove `.` segments, resolve `..` segments lexically, extract filenames and extensions, split a path into parts, and compute relative paths. It does not check whether a file or directory exists.

For normal use, include the public header:

```cpp id="bh7y36"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## Join path fragments

Use `join()` when two or three path fragments need to become one clean path.

```cpp id="a9j1vf"
#include <iostream>
#include <vix/path.hpp>

int main()
{
  auto result = vix::path::join("src", "main.cpp");

  if (!result) {
    std::cerr << result.error().message() << '\n';
    return 1;
  }

  std::cout << result.value() << '\n';
  return 0;
}
```

`join()` is lexical. It does not check whether `src` exists and it does not create any file. It only returns a normalized path string that another layer can use later.

## Normalize a path

Use `normalize()` when a path needs a stable lexical form.

```cpp id="kbf5oz"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto normalized = vix::path::normalize(
  "/a//b/./c/../d",
  options
);

if (!normalized) {
  return normalized.error();
}

// normalized.value() == "/a/b/d"
```

Normalization can unify separators, collapse repeated separators, remove `.` segments, and resolve `..` segments when possible. It still works only from the path string. No filesystem lookup happens during this operation.

## Use Windows-style paths

The module can also apply Windows path rules explicitly. This is useful when Vix needs to reason about Windows paths even when the current host platform is not Windows.

```cpp id="bp44ry"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto normalized = vix::path::normalize(
  "C:\\temp\\\\foo\\.\\bar\\..\\file.txt",
  options
);

if (!normalized) {
  return normalized.error();
}

// normalized.value() == "C:\\temp\\foo\\file.txt"
```

`PathStyle::Native` follows the platform where the code runs. `PathStyle::Posix` prefers `/`. `PathStyle::Windows` prefers `\` and recognizes Windows drive roots and UNC-style roots.

## Extract path components

The component helpers make common path operations readable at the call site.

```cpp id="is85g6"
auto name = vix::path::filename("/home/user/main.cpp");
auto dir = vix::path::parent("/home/user/main.cpp");
auto base = vix::path::basename("/home/user/main.cpp");
auto dirname = vix::path::dirname("/home/user/main.cpp");
auto st = vix::path::stem("/home/user/main.cpp");
auto ext = vix::path::extension("/home/user/main.cpp");

if (!name || !dir || !base || !dirname || !st || !ext) {
  return 1;
}

// name.value()    == "main.cpp"
// dir.value()     == "/home/user"
// base.value()    == "main.cpp"
// dirname.value() == "/home/user"
// st.value()      == "main"
// ext.value()     == ".cpp"
```

In this module, `basename()` is equivalent to `filename()`, and `dirname()` is equivalent to `parent()`. They are provided because both naming styles are common in path-related code.

## Replace an extension

Use `replace_extension()` to replace the final extension of a path. When the new extension does not start with `.`, the module adds it.

```cpp id="cwp43e"
auto header = vix::path::replace_extension(
  "/home/user/main.cpp",
  "hpp"
);

if (!header) {
  return header.error();
}

// header.value() == "/home/user/main.hpp"
```

When the path has no extension, the new extension is appended.

```cpp id="h7da2u"
auto file = vix::path::replace_extension(
  "/home/user/Makefile",
  "txt"
);

// file.value() == "/home/user/Makefile.txt"
```

## Split a path

Use `split()` when code needs several parts of the same path.

```cpp id="llj5rm"
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

`split()` returns a `PathParts` structure. This is useful for diagnostics, generated metadata, and tools that need a stable decomposition of a path string.

## Compute absolute and relative paths

Use `absolute()` to resolve a relative path against an absolute base. The result is lexical, so the base must be absolute, but it does not need to exist on the filesystem.

```cpp id="h56f3v"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto abs = vix::path::absolute(
  "docs/readme.md",
  "/home/gaspard",
  options
);

if (!abs) {
  return abs.error();
}

// abs.value() == "/home/gaspard/docs/readme.md"
```

Use `relative()` when code needs a path from one lexical location to another.

```cpp id="nomqet"
auto rel = vix::path::relative(
  "/home/gaspard/docs/readme.md",
  "/home/gaspard",
  options
);

if (!rel) {
  return rel.error();
}

// rel.value() == "docs/readme.md"
```

`relative()` delegates to the lexical relative path logic. It compares normalized path segments and produces a result without querying the filesystem.

## Use proximate paths

`lexically_proximate()` attempts to compute a lexical relative path. When that cannot be done because the roots are incompatible, it returns the normalized target path instead.

```cpp id="dnvsia"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto prox = vix::path::lexically_proximate(
  "D:\\docs\\file.txt",
  "C:\\base",
  options
);

if (!prox) {
  return prox.error();
}

// prox.value() == "D:\\docs\\file.txt"
```

This is useful when a caller prefers a relative path when possible, but still wants a usable target path when relative computation is not valid.

## Handle errors

Path functions that can fail return Vix results. Empty paths, invalid roots, incompatible roots, and traversal above a root are reported as structured errors with the `path` category.

```cpp id="n0rnlo"
auto result = vix::path::normalize("");

if (!result) {
  const auto& err = result.error();

  // err.category().name() == "path"
  std::cerr << err.message() << '\n';
}
```

Some helpers return plain booleans because they are simple lexical checks.

```cpp id="a507xa"
bool absolute = vix::path::is_absolute(
  "/usr/bin",
  vix::path::PathStyle::Posix
);

bool relative = vix::path::is_relative(
  "docs/readme.md",
  vix::path::PathStyle::Posix
);
```

The rule is simple: operations that produce a transformed path or structured path parts return `Result<T>`, while direct lexical checks such as `is_absolute()`, `is_relative()`, `has_extension()`, and separator helpers return plain values.

## A complete small workflow

The following example builds a generated source path, normalizes it, changes its extension, and prints a relative path for display.

```cpp id="xb4arf"
#include <iostream>
#include <vix/path.hpp>

int main()
{
  vix::path::PathOptions options;
  options.style = vix::path::PathStyle::Posix;

  auto joined = vix::path::join(
    "/home/gaspard/project/",
    "./build//generated/main.cpp",
    options
  );

  if (!joined) {
    std::cerr << joined.error().message() << '\n';
    return 1;
  }

  auto header = vix::path::replace_extension(joined.value(), "hpp");
  if (!header) {
    std::cerr << header.error().message() << '\n';
    return 1;
  }

  auto display = vix::path::relative(
    header.value(),
    "/home/gaspard/project",
    options
  );

  if (!display) {
    std::cerr << display.error().message() << '\n';
    return 1;
  }

  std::cout << display.value() << '\n';
  return 0;
}
```

This workflow never touches the filesystem. It only prepares path strings in a predictable form. A filesystem operation can use the final value later when the code is ready to read, write, or create files.

The next page explains lexical paths in more detail and clarifies the boundary between `vix::path` and `vix::fs`.
