# API Reference

This page summarizes the public API of the Path module. It is meant for quick lookup while writing or reviewing code. For the design model and workflow, start with the overview, quick start, and topic pages in this section.

## Header

Use the public Path header in application and module code:

```cpp id="ik7twq"
#include <vix/path.hpp>
```

All public APIs are declared in the `vix::path` namespace.

```cpp id="bqjzth"
namespace vix::path
{
}
```

The module is lexical. It transforms and analyzes path strings without accessing the real filesystem.

## Result types

Path operations that can fail return Vix results.

```cpp id="a4zk69"
using PathResult = vix::error::Result<std::string>;
using PathListResult = vix::error::Result<std::vector<std::string>>;
using PathPartsResult = vix::error::Result<PathParts>;
```

`PathResult` is used by operations that return one path string. `PathListResult` is reserved for operations that return multiple path segments. `PathPartsResult` is used by `split()`.

```cpp id="sav2lk"
auto path = vix::path::normalize("src/./main.cpp");

if (!path) {
  return path.error();
}

std::string value = path.value();
```

A failed result contains a structured `vix::error::Error`.

## PathStyle

```cpp id="r2dtct"
enum class PathStyle
{
  Native,
  Posix,
  Windows
};
```

`PathStyle` controls the syntax rules used by path operations.

`Native` follows the current platform. `Posix` uses POSIX-style output and prefers `/`. `Windows` uses Windows-style output, prefers `\`, and recognizes Windows drive roots and UNC-style roots.

```cpp id="tonc4f"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
```

## PathOptions

```cpp id="hcm2ty"
struct PathOptions
{
  PathStyle style{PathStyle::Native};

  bool collapse_separators{true};
  bool remove_dot_segments{true};
  bool resolve_dot_dot_segments{true};
  bool preserve_trailing_separator{false};
};
```

`PathOptions` controls lexical path transformations.

`style` selects native, POSIX, or Windows rules. `remove_dot_segments` controls whether `.` segments are removed. `resolve_dot_dot_segments` controls whether `..` segments are resolved when possible. `preserve_trailing_separator` keeps a trailing separator only when the input path already had one.

`collapse_separators` is part of the public options model. In the current implementation, normalization rebuilds paths from parsed segments and produces clean separator output, so code should not rely on setting `collapse_separators` to `false` to preserve repeated separators.

## PathParts

```cpp id="rdjgjy"
struct PathParts
{
  std::string root;
  std::string dirname;
  std::string filename;
  std::string stem;
  std::string extension;
};
```

`PathParts` is returned by `split()`.

`root` stores the detected root portion. `dirname` stores the directory portion without the final filename. `filename` stores the final filename component. `stem` stores the filename without its final extension. `extension` stores the final extension, including the leading dot when present.

```cpp id="wbdxgw"
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

## PathErrorCode

```cpp id="v82zuz"
enum class PathErrorCode
{
  None = 0,
  EmptyPath,
  InvalidPath,
  InvalidSegment,
  InvalidRoot,
  IncompatibleRoots,
  CannotComputeRelative,
  TraversalAboveRoot
};
```

`PathErrorCode` describes lexical path failures.

These are path-level errors, not filesystem errors. They describe invalid path input, incompatible roots, and invalid lexical traversal.

### path_error_category

```cpp id="q1vpkv"
[[nodiscard]] constexpr vix::error::ErrorCategory
path_error_category() noexcept;
```

Returns the default Path error category.

```cpp id="nw034s"
auto category = vix::path::path_error_category();
// category.name() == "path"
```

### to_error_code

```cpp id="agtxgt"
[[nodiscard]] constexpr vix::error::ErrorCode
to_error_code(PathErrorCode code) noexcept;
```

Converts a `PathErrorCode` into the shared Vix `ErrorCode` model.

All current path-specific failures map to `vix::error::ErrorCode::InvalidArgument`, except `PathErrorCode::None`, which maps to `Ok`.

```cpp id="kqz9mr"
auto code = vix::path::to_error_code(
  vix::path::PathErrorCode::EmptyPath
);
```

### to_string

```cpp id="ai9ok6"
[[nodiscard]] const char* to_string(PathErrorCode code) noexcept;
```

Returns a stable string name for a path error code.

```cpp id="l7ct8h"
const char* name = vix::path::to_string(
  vix::path::PathErrorCode::IncompatibleRoots
);

// name == "incompatible_roots"
```

### make_path_error

```cpp id="ggrseu"
[[nodiscard]] vix::error::Error make_path_error(
  PathErrorCode code,
  std::string message
);
```

Builds a structured `vix::error::Error` using the converted shared error code, the `path` category, and the provided message.

```cpp id="for2kc"
return vix::path::make_path_error(
  vix::path::PathErrorCode::InvalidPath,
  "expected a project-relative path"
);
```

## Separator helpers

### preferred_separator

```cpp id="rvcazx"
[[nodiscard]] char preferred_separator(
  PathStyle style = PathStyle::Native
) noexcept;
```

Returns the preferred separator for a path style.

```cpp id="td8kwi"
char sep = vix::path::preferred_separator(
  vix::path::PathStyle::Posix
);

// sep == '/'
```

For `PathStyle::Windows`, the result is `\`. For `PathStyle::Native`, the result depends on the current platform.

### is_separator

```cpp id="t5uhaz"
[[nodiscard]] constexpr bool is_separator(char c) noexcept;
```

Returns `true` when the character is a recognized path separator.

```cpp id="pqu08z"
bool slash = vix::path::is_separator('/');
bool backslash = vix::path::is_separator('\\');
bool regular = vix::path::is_separator('x');
```

Both `/` and `\` are treated as separators for lexical path processing.

### has_leading_separator

```cpp id="s296ip"
[[nodiscard]] bool has_leading_separator(
  std::string_view path
) noexcept;
```

Returns `true` when the path starts with a separator.

```cpp id="pq935o"
bool leading = vix::path::has_leading_separator("/tmp");
```

### has_trailing_separator

```cpp id="uj4im6"
[[nodiscard]] bool has_trailing_separator(
  std::string_view path
) noexcept;
```

Returns `true` when the path ends with a separator.

```cpp id="w9cz7q"
bool trailing = vix::path::has_trailing_separator("/tmp/");
```

These helpers are lexical checks. They do not determine whether the path is a real directory.

## Path checks

### is_absolute

```cpp id="bmvkv1"
[[nodiscard]] bool is_absolute(
  std::string_view path,
  PathStyle style = PathStyle::Native
) noexcept;
```

Returns `true` when the path is lexically absolute for the selected style.

```cpp id="ld8k7i"
bool absolute = vix::path::is_absolute(
  "/usr/bin",
  vix::path::PathStyle::Posix
);
```

With Windows style, drive-root paths and UNC-style roots are recognized.

```cpp id="t1oh33"
bool drive = vix::path::is_absolute(
  "C:\\Windows",
  vix::path::PathStyle::Windows
);
```

### is_relative

```cpp id="q6ae84"
[[nodiscard]] bool is_relative(
  std::string_view path,
  PathStyle style = PathStyle::Native
) noexcept;
```

Returns `true` when the path is lexically relative for the selected style.

```cpp id="d5t7yf"
bool relative = vix::path::is_relative(
  "docs/readme.md",
  vix::path::PathStyle::Posix
);
```

`is_relative()` is the opposite of `is_absolute()`.

## Joining and normalization

### join

```cpp id="k7sjhx"
[[nodiscard]] PathResult join(
  std::string_view left,
  std::string_view right,
  const PathOptions& options = {}
);

[[nodiscard]] PathResult join(
  std::string_view a,
  std::string_view b,
  std::string_view c,
  const PathOptions& options = {}
);
```

Joins two or three path fragments using lexical rules, then normalizes the result.

```cpp id="nxtzm8"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::join("/usr/", "/bin", options);

// path.value() == "/usr/bin"
```

If one side is empty, the non-empty side is normalized and returned. If both sides are empty, the function returns a path error.

### normalize

```cpp id="qiql8e"
[[nodiscard]] PathResult normalize(
  std::string_view path,
  const PathOptions& options = {}
);
```

Normalizes a path lexically.

```cpp id="qgk1hc"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "/a//b/./c/../d",
  options
);

// path.value() == "/a/b/d"
```

Normalization may collapse repeated separators, remove `.` segments, resolve `..` segments when possible, and rebuild the path with the preferred separator for the selected style.

The function returns an error when the path is empty or when resolving `..` would move above an absolute root.

### lexically_normal

```cpp id="wyg55g"
[[nodiscard]] PathResult lexically_normal(
  std::string_view path,
  const PathOptions& options = {}
);
```

Returns the lexically normal form of a path.

```cpp id="a37dto"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::lexically_normal(
  "/x//y/./z/../a",
  options
);

// path.value() == "/x/y/a"
```

`lexically_normal()` delegates to `normalize()`.

## Components

### filename

```cpp id="l4c9t4"
[[nodiscard]] PathResult filename(std::string_view path);
```

Returns the final filename component of a path.

```cpp id="n5l5cw"
auto name = vix::path::filename("/home/user/main.cpp");

// name.value() == "main.cpp"
```

The function removes trailing separators before extracting the final component. An empty path returns a path error.

### basename

```cpp id="vw6278"
[[nodiscard]] PathResult basename(std::string_view path);
```

Returns the basename of a path.

```cpp id="q7g4gp"
auto base = vix::path::basename("/var/log/system.log");

// base.value() == "system.log"
```

In this module, `basename()` is equivalent to `filename()`.

### parent

```cpp id="zu3f4z"
[[nodiscard]] PathResult parent(std::string_view path);
```

Returns the parent path.

```cpp id="mrk5q7"
auto dir = vix::path::parent("/home/user/main.cpp");

// dir.value() == "/home/user"
```

When there is no parent component, the function succeeds with an empty string. An empty input path returns a path error.

### dirname

```cpp id="kju8aw"
[[nodiscard]] PathResult dirname(std::string_view path);
```

Returns the directory portion of a path.

```cpp id="wsieyu"
auto dir = vix::path::dirname("/var/log/system.log");

// dir.value() == "/var/log"
```

In this module, `dirname()` is equivalent to `parent()`.

### stem

```cpp id="xol44w"
[[nodiscard]] PathResult stem(std::string_view path);
```

Returns the filename without its final extension.

```cpp id="htosdq"
auto st = vix::path::stem("/home/user/main.cpp");

// st.value() == "main"
```

If the filename has no extension, the filename is returned unchanged. Special names such as `.` and `..` are preserved.

### extension

```cpp id="ojnrrh"
[[nodiscard]] PathResult extension(std::string_view path);
```

Returns the final extension of a path, including the leading dot.

```cpp id="s98x1y"
auto ext = vix::path::extension("/home/user/main.cpp");

// ext.value() == ".cpp"
```

If the filename has no extension, the function succeeds with an empty string. A leading dot alone does not count as a normal extension, so `.env` has no extension under this rule.

### has_extension

```cpp id="mmoott"
[[nodiscard]] bool has_extension(std::string_view path) noexcept;
```

Returns `true` when the final filename component has an extension.

```cpp id="glqoas"
bool has = vix::path::has_extension("/home/user/main.cpp");
// has == true
```

```cpp id="gzvnvy"
bool has = vix::path::has_extension("/home/user/Makefile");
// has == false
```

If the path cannot produce a valid filename, the function returns `false`.

### replace_extension

```cpp id="xq9zfw"
[[nodiscard]] PathResult replace_extension(
  std::string_view path,
  std::string_view new_extension
);
```

Replaces the final extension of a path.

```cpp id="iu2sx1"
auto path = vix::path::replace_extension(
  "/home/user/main.cpp",
  "hpp"
);

// path.value() == "/home/user/main.hpp"
```

If `new_extension` is non-empty and does not start with `.`, the module adds one. If the path has no extension, the new extension is appended. If `new_extension` is empty, the existing extension is removed.

### split

```cpp id="uc9ewo"
[[nodiscard]] PathPartsResult split(std::string_view path);
```

Splits a path into structured components.

```cpp id="ngwkkn"
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

An empty path returns a path error.

## Absolute and relative paths

### absolute

```cpp id="l79m8q"
[[nodiscard]] PathResult absolute(
  std::string_view path,
  std::string_view base,
  const PathOptions& options = {}
);
```

Resolves a path to an absolute lexical path using a base path.

```cpp id="ipagzn"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::absolute(
  "docs/readme.md",
  "/home/gaspard",
  options
);

// path.value() == "/home/gaspard/docs/readme.md"
```

If `path` is already absolute, it is normalized and returned. If `path` is relative, `base` must be non-empty and absolute for the selected style.

The function does not access the filesystem.

### relative

```cpp id="txyv8h"
[[nodiscard]] PathResult relative(
  std::string_view target,
  std::string_view base,
  const PathOptions& options = {}
);
```

Computes a lexical relative path from `base` to `target`.

```cpp id="cj0idq"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::relative(
  "/home/gaspard/docs/readme.md",
  "/home/gaspard",
  options
);

// path.value() == "docs/readme.md"
```

`relative()` delegates to `lexically_relative()`.

### lexically_relative

```cpp id="odwvuq"
[[nodiscard]] PathResult lexically_relative(
  std::string_view target,
  std::string_view base,
  const PathOptions& options = {}
);
```

Computes a relative path by normalizing both paths, comparing their path segments, and producing a lexical route from `base` to `target`.

```cpp id="k0su6t"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::lexically_relative(
  "/a/b/c/file.txt",
  "/a/b/d",
  options
);

// path.value() == "../c/file.txt"
```

If the target and base have incompatible roots, the function returns a path error.

When both paths normalize to the same location, the result is `"."`.

### lexically_proximate

```cpp id="x0819n"
[[nodiscard]] PathResult lexically_proximate(
  std::string_view target,
  std::string_view base,
  const PathOptions& options = {}
);
```

Computes a lexical relative path when possible. If that cannot be done, the function returns the normalized target path.

```cpp id="e4cgn8"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto path = vix::path::lexically_proximate(
  "D:\\docs\\file.txt",
  "C:\\base",
  options
);

// path.value() == "D:\\docs\\file.txt"
```

This is useful when a relative display path is preferred but not required.

## Minimal example

```cpp id="s948dh"
#include <iostream>

#include <vix/path.hpp>

int main()
{
  vix::path::PathOptions options;
  options.style = vix::path::PathStyle::Posix;

  auto joined = vix::path::join(
    "/home/gaspard/project/",
    "./src//main.cpp",
    options
  );

  if (!joined) {
    std::cerr << joined.error().message() << '\n';
    return 1;
  }

  auto header = vix::path::replace_extension(
    joined.value(),
    "hpp"
  );

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

This example only prepares path strings. It does not check whether the paths exist and it does not perform filesystem operations.

This completes the Path module reference.
