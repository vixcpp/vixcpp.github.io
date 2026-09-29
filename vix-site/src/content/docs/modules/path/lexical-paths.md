# Lexical Paths

The Path module is built around lexical path processing. A lexical operation works only from the characters inside the path string. It does not ask the operating system whether the path exists, whether a directory is real, whether a symlink points somewhere, or whether the current user can access the target.

For normal use, include the public header:

```cpp id="f0deub"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## What lexical means

A lexical path is treated as structured text. The module reads separators, roots, filenames, extensions, `.` segments, and `..` segments, then produces another path string or a structured result.

```cpp id="ybwkfn"
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

This result is computed without checking whether `/a`, `/a/b`, or `/a/b/d` exists. The operation is about path syntax, not filesystem state.

This is the central difference between `vix::path` and `vix::fs`. The Path module prepares and analyzes path strings. The FS module reads, writes, lists, copies, moves, and removes real filesystem entries.

## Why lexical paths matter

Vix often needs to reason about paths before it touches the filesystem. A manifest can contain source files, include directories, generated output paths, resource mappings, or module paths. At that stage, Vix usually needs stable strings and predictable diagnostics, not immediate filesystem access.

Lexical path processing gives that layer a clean boundary. Code can normalize a path, join fragments, compute a relative path for display, or split a filename into parts without causing side effects.

```cpp id="ob1tav"
auto source = vix::path::join("src", "app/main.cpp");

if (!source) {
  return source.error();
}

// source.value() is a prepared path string.
// No file was opened or checked.
```

This makes higher-level code easier to understand. A function that transforms a path string stays separate from a function that reads or writes a real file.

## Empty paths

Most path transformations reject empty paths.

```cpp id="xlg0jy"
auto result = vix::path::normalize("");

if (!result) {
  const auto& err = result.error();
  // err.category().name() == "path"
}
```

An empty path usually means the caller failed to build or pass a meaningful value. The module reports that as a structured path error instead of silently returning another empty string.

There are a few boolean helpers, such as `is_absolute()` and `is_relative()`, that return plain boolean values. In those cases, an empty path is simply not absolute, so `is_absolute("")` returns `false`.

```cpp id="mm7tu6"
bool absolute = vix::path::is_absolute(
  "",
  vix::path::PathStyle::Posix
);

// absolute == false
```

The distinction follows the shape of the API. Transformations return `Result<T>` because they may fail. Direct lexical checks return plain values.

## Roots

A root is the part of a path that anchors it. In POSIX style, `/` is the root. In Windows style, roots can include drive paths such as `C:\` and UNC-style roots such as `\\server\share`.

```cpp id="zz9299"
bool posix_rooted = vix::path::is_absolute(
  "/usr/bin",
  vix::path::PathStyle::Posix
);

bool windows_rooted = vix::path::is_absolute(
  "C:\\Windows",
  vix::path::PathStyle::Windows
);
```

Roots matter when computing relative paths. A relative path can only be computed when the target and base have compatible roots.

```cpp id="xygylv"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto rel = vix::path::relative(
  "D:\\docs\\file.txt",
  "C:\\base",
  options
);

if (!rel) {
  // the roots are incompatible
}
```

When a caller wants a relative path when possible, but still wants a usable path when the roots are incompatible, `lexically_proximate()` is the better API. It returns the relative path when it can, and falls back to the normalized target path when it cannot.

```cpp id="l5f6f5"
auto prox = vix::path::lexically_proximate(
  "D:\\docs\\file.txt",
  "C:\\base",
  options
);

// prox.value() == "D:\\docs\\file.txt"
```

## Dot segments

The module understands `.` and `..` as lexical path segments. A `.` segment refers to the current level and is usually removed during normalization. A `..` segment moves one level up when that can be resolved safely.

```cpp id="zy0y1k"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "/project/src/./core/../main.cpp",
  options
);

// path.value() == "/project/src/main.cpp"
```

When a path is absolute, the module prevents normalization from moving above the root.

```cpp id="vgijox"
auto result = vix::path::normalize(
  "/../outside",
  options
);

if (!result) {
  // traversal above root is rejected
}
```

For relative paths, unresolved `..` segments can remain because there is no root boundary to cross.

```cpp id="ow36bx"
auto path = vix::path::normalize(
  "../src/../include",
  options
);

// path.value() == "../include"
```

This behavior keeps lexical normalization safe for rooted paths while still allowing relative paths to express movement from an unknown base.

## Separators

The module recognizes both `/` and `\` as separators when reading path strings. The preferred separator used in generated output depends on the selected path style.

```cpp id="g0a5or"
char posix = vix::path::preferred_separator(
  vix::path::PathStyle::Posix
);

// posix == '/'
```

```cpp id="p193oy"
char windows = vix::path::preferred_separator(
  vix::path::PathStyle::Windows
);

// windows == '\\'
```

This is why the same operation can produce different output depending on the style.

```cpp id="v0r2r8"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto joined = vix::path::join(
  "C:\\Users\\",
  "\\gaspard",
  options
);

// joined.value() == "C:\\Users\\gaspard"
```

The goal is not to guess what the current filesystem contains. The goal is to produce a path string that follows the requested syntax.

## Native, POSIX, and Windows styles

`PathStyle` controls which syntax rules should be used.

```cpp id="lfogz7"
enum class PathStyle
{
  Native,
  Posix,
  Windows
};
```

`PathStyle::Native` follows the platform where the code is running. `PathStyle::Posix` uses POSIX-style output and `/` as the preferred separator. `PathStyle::Windows` uses Windows-style output and recognizes Windows roots.

```cpp id="xv2vey"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto posix = vix::path::normalize(
  "/x//y/./z/../a",
  options
);

// posix.value() == "/x/y/a"
```

```cpp id="tbi73w"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto windows = vix::path::normalize(
  "C:\\temp\\\\foo\\.\\bar\\..\\file.txt",
  options
);

// windows.value() == "C:\\temp\\foo\\file.txt"
```

Choosing the style explicitly is useful in tooling code because the target path format may not always match the host platform. For example, a Vix command running on Linux can still prepare Windows-style paths when generating files for a Windows target.

## Lexical relationship between paths

The module can compute relationships between two paths by comparing their normalized segments.

```cpp id="h7qdfl"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto rel = vix::path::relative(
  "/a/b/c/file.txt",
  "/a/b/d",
  options
);

// rel.value() == "../c/file.txt"
```

The operation compares both paths as strings with path structure. It does not check that `/a/b/c/file.txt` or `/a/b/d` exists. That makes it useful for build output, generated diagnostics, project manifests, and any case where paths need to be described before the filesystem layer runs.

## Absolute paths from a base

`absolute()` resolves a relative path against an absolute base.

```cpp id="dwdp23"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::absolute(
  "docs/readme.md",
  "/home/gaspard",
  options
);

// path.value() == "/home/gaspard/docs/readme.md"
```

If the input path is already absolute, it is normalized and returned. If it is relative, the base must be non-empty and absolute.

```cpp id="cd5jbt"
auto result = vix::path::absolute(
  "docs/readme.md",
  "",
  options
);

if (!result) {
  // base path cannot be empty when resolving a relative path
}
```

This keeps the function honest. It can produce an absolute lexical path only when the input already has a root or when a valid absolute base is provided.

## Practical rule

Use `vix::path` when the operation can be answered from the path string alone. Use `vix::fs` when the operation requires the real filesystem.

A path can be joined, normalized, split, or compared without touching the disk. A file can only be read, written, copied, listed, or removed through the filesystem layer.

```cpp id="hlnkl3"
auto output = vix::path::join("build", "generated/main.cpp");

if (!output) {
  return output.error();
}

// Later, another layer may pass output.value() to vix::fs.
```

Keeping this boundary clear makes Vix code more predictable. Path code stays pure and side-effect free. Filesystem code remains explicit and easier to audit.

The next page explains how `join()`, `normalize()`, and `lexically_normal()` work in common workflows.
