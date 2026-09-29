# Path

The Path module provides lexical path utilities for Vix. It works with path strings, separates them into meaningful parts, normalizes them, joins fragments, computes relative paths, and handles POSIX or Windows-style separators without touching the real filesystem.

This distinction is important. `vix::path` does not check whether a file exists, does not create directories, does not read metadata, and does not resolve symlinks through the operating system. It treats a path as structured text. When code needs to operate on real files and directories, it should use the FS module. When code needs to prepare, transform, compare, or analyze path strings before any filesystem operation happens, the Path module is the right layer.

For normal use, include the module header:

```cpp id="aubhm9"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## Why this module exists

Vix tools and modules often need to work with paths before they can safely touch the filesystem. A project manifest may contain relative source paths, generated build files may need stable output paths, and cross-platform code may need to normalize separators without depending on the platform where the command is currently running.

The Path module gives those operations a dedicated place. It keeps path transformations predictable and explicit, so higher-level Vix code does not have to mix string manipulation, platform rules, and filesystem access in the same function.

```cpp id="gih8tg"
auto path = vix::path::join("src", "main.cpp");

if (!path) {
  return path.error();
}

// path.value() can now be passed to another layer.
```

The result is still just a path string. No file has been opened, no directory has been listed, and no filesystem state has been required.

## Lexical paths

A lexical path operation works only from the characters in the path. For example, normalizing `src//core/./../main.cpp` can collapse repeated separators, remove `.` segments, and resolve `..` segments where possible. It can do that without asking the operating system whether `src`, `core`, or `main.cpp` actually exists.

```cpp id="jztcmo"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto normalized = vix::path::normalize(
  "/a//b/./c/../d",
  options
);

// normalized.value() == "/a/b/d"
```

This makes the module useful in build tooling, code generation, manifest parsing, CLI commands, and any place where Vix needs a stable path representation before moving into real filesystem work.

## Path styles

The module supports native, POSIX, and Windows path styles through `PathOptions`.

```cpp id="d3hjn4"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto normalized = vix::path::normalize(
  "C:\\temp\\\\foo\\.\\bar\\..\\file.txt",
  options
);

// normalized.value() == "C:\\temp\\foo\\file.txt"
```

`PathStyle::Native` follows the current platform. `PathStyle::Posix` uses `/` as the preferred separator. `PathStyle::Windows` uses `\` and recognizes Windows drive roots and UNC-style roots. This lets Vix code reason about a target path format even when the host platform is different.

## Common operations

The module provides a compact set of path operations. `join()` combines path fragments and normalizes the result. `normalize()` and `lexically_normal()` clean a path lexically. `filename()`, `basename()`, `parent()`, `dirname()`, `stem()`, `extension()`, and `replace_extension()` work on path components. `absolute()`, `relative()`, `lexically_relative()`, and `lexically_proximate()` compute path relationships without accessing the filesystem.

```cpp id="r9fgia"
auto file = vix::path::filename("/home/user/main.cpp");
// file.value() == "main.cpp"

auto parent = vix::path::parent("/home/user/main.cpp");
// parent.value() == "/home/user"

auto stem = vix::path::stem("/home/user/main.cpp");
// stem.value() == "main"

auto ext = vix::path::extension("/home/user/main.cpp");
// ext.value() == ".cpp"
```

These functions keep common path manipulation readable at the call site. Instead of manually slicing strings and repeating separator rules, code can express the path operation directly.

## Splitting paths

When a caller needs a structured view of a path, `split()` returns `PathParts`.

```cpp id="pf1raf"
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

This is useful for diagnostics, generated metadata, project tooling, and code that needs more than one component from the same path.

## Results and errors

Operations that can fail return Vix results.

```cpp id="z74l5a"
using PathResult = vix::error::Result<std::string>;
using PathListResult = vix::error::Result<std::vector<std::string>>;
using PathPartsResult = vix::error::Result<vix::path::PathParts>;
```

A failed result contains a structured Vix error with the `path` category. Empty paths, invalid roots, incompatible roots, and traversal above a root are examples of path-specific failures.

```cpp id="mugoye"
auto result = vix::path::normalize("");

if (!result) {
  const auto& err = result.error();
  // err.category().name() == "path"
}
```

This keeps lexical path failures consistent with the rest of Vix. A caller can return the error directly, wrap it with higher-level context, or turn it into a diagnostic for CLI output.

## Path and FS together

The Path module and the FS module are designed to work together, but they solve different problems. Path prepares and transforms strings. FS acts on the filesystem.

```cpp id="l6t6er"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto output = vix::path::join("build", "generated/app.cpp", options);
if (!output) {
  return output.error();
}

// A filesystem layer can use output.value() later.
```

Keeping those responsibilities separate makes Vix code easier to understand. A path can be normalized, joined, or split without accidentally depending on the current machine. Filesystem access remains explicit and belongs to the layer that actually needs it.

## Next step

Start with the quick start page to see the most common path operations in small examples. Then move through lexical paths, join and normalize, components, relative paths, separators, options, errors, and the API reference.
