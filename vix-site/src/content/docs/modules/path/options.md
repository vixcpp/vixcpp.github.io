# Options

`PathOptions` controls how lexical path transformations should interpret and rebuild path strings. It is used by operations such as `normalize()`, `lexically_normal()`, `join()`, `absolute()`, `relative()`, `lexically_relative()`, and `lexically_proximate()`.

For normal use, include the public header:

```cpp id="onqdw7"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## The options structure

`PathOptions` is intentionally small. It keeps the common path transformation choices in one place instead of spreading separator rules and normalization behavior across many call sites.

```cpp id="dlekem"
struct PathOptions
{
  PathStyle style{PathStyle::Native};

  bool collapse_separators{true};
  bool remove_dot_segments{true};
  bool resolve_dot_dot_segments{true};
  bool preserve_trailing_separator{false};
};
```

The default options use the native path style of the current platform, collapse repeated separators, remove `.` segments, resolve `..` segments when possible, and do not preserve a trailing separator.

```cpp id="nmhsgv"
vix::path::PathOptions options;

auto path = vix::path::normalize("src//./main.cpp", options);
```

For documentation examples and predictable tooling behavior, it is usually better to set `style` explicitly.

## PathStyle

`PathStyle` controls the syntax rules and preferred separator used by path operations.

```cpp id="p43kqx"
enum class PathStyle
{
  Native,
  Posix,
  Windows
};
```

`PathStyle::Native` follows the platform where the code is running. `PathStyle::Posix` uses `/` as the preferred separator. `PathStyle::Windows` uses `\` and recognizes Windows drive roots and UNC-style roots.

```cpp id="gntzbm"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
```

Use an explicit style when the output format matters. This is common in Vix tooling because the generated path format may need to stay stable across platforms.

## POSIX options

With POSIX style, generated output uses `/`.

```cpp id="i0ud04"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "/a//b/./c/../d",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/a/b/d"
```

POSIX style treats a path starting with `/` as absolute.

```cpp id="bf1q79"
bool absolute = vix::path::is_absolute(
  "/usr/bin",
  vix::path::PathStyle::Posix
);

// absolute == true
```

## Windows options

With Windows style, generated output uses `\`.

```cpp id="akgu6l"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto path = vix::path::normalize(
  "C:\\temp\\\\foo\\.\\bar\\..\\file.txt",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "C:\\temp\\foo\\file.txt"
```

Windows style recognizes drive-root paths and UNC-style paths.

```cpp id="hqdmg9"
bool drive = vix::path::is_absolute(
  "C:\\Windows",
  vix::path::PathStyle::Windows
);

// drive == true
```

```cpp id="jgdv20"
bool unc = vix::path::is_absolute(
  "\\\\server\\share",
  vix::path::PathStyle::Windows
);

// unc == true
```

This allows Vix code to reason about Windows paths even when the program is running on another platform.

## Native options

`PathStyle::Native` follows the current platform.

```cpp id="x07bv1"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Native;
```

Native style is useful when the path should match the machine running the command. For generated files, manifests, documentation examples, or cross-platform tests, explicit POSIX or Windows style is clearer because it makes the expected output independent from the host platform.

## Repeated separators

`collapse_separators` is part of the options structure and its default value is `true`.

```cpp id="orhus1"
vix::path::PathOptions options;
options.collapse_separators = true;
```

In the current implementation, normalization collapses repeated separators while reading the path segments.

```cpp id="puqulz"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "src//core///main.cpp",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "src/core/main.cpp"
```

Treat `collapse_separators` as part of the public options model, but do not rely on setting it to `false` to preserve repeated separators in the current implementation. The active behavior today is that normalized output is rebuilt in a clean lexical form.

## Dot segments

`remove_dot_segments` controls whether `.` segments are removed during normalization.

```cpp id="jknfts"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.remove_dot_segments = true;

auto path = vix::path::normalize(
  "src/./main.cpp",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "src/main.cpp"
```

When this option is disabled, `.` segments are kept in the normalized segment list.

```cpp id="ckmro3"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.remove_dot_segments = false;

auto path = vix::path::normalize(
  "src/./main.cpp",
  options
);

if (!path) {
  return path.error();
}

// the dot segment is preserved
```

Most Vix code should keep the default. Removing `.` segments gives cleaner output and simpler diagnostics.

## Dot-dot segments

`resolve_dot_dot_segments` controls whether `..` segments are resolved when possible.

```cpp id="focwok"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.resolve_dot_dot_segments = true;

auto path = vix::path::normalize(
  "src/core/../main.cpp",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "src/main.cpp"
```

When this option is disabled, `..` segments are preserved.

```cpp id="qfigte"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.resolve_dot_dot_segments = false;

auto path = vix::path::normalize(
  "src/core/../main.cpp",
  options
);

if (!path) {
  return path.error();
}

// the dot-dot segment is preserved
```

For absolute paths, resolving `..` cannot move above the root. When that would happen, normalization returns a structured path error.

```cpp id="fpb2ai"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "/../outside",
  options
);

if (!path) {
  const auto& err = path.error();
  // traversal above root is not allowed
}
```

For relative paths, unresolved leading `..` segments can remain because there is no root boundary to cross.

```cpp id="yi1v1k"
auto path = vix::path::normalize(
  "../src/../include",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "../include"
```

## Trailing separators

`preserve_trailing_separator` controls whether normalization keeps a trailing separator when the input path had one.

```cpp id="fh5llv"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.preserve_trailing_separator = false;

auto path = vix::path::normalize(
  "build/generated/",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "build/generated"
```

Set the option to `true` when the trailing separator should remain visible in the output.

```cpp id="zg9ogh"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.preserve_trailing_separator = true;

auto path = vix::path::normalize(
  "build/generated/",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "build/generated/"
```

The option preserves a trailing separator only when the input already ended with one. It does not add a trailing separator to paths that did not have one.

## Options with join

`join()` accepts `PathOptions` and applies them to the final normalized result.

```cpp id="sid1qz"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto path = vix::path::join(
  "C:\\Users\\",
  "\\gaspard",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "C:\\Users\\gaspard"
```

This makes `join()` useful for cross-platform tooling. The caller can choose the output style instead of relying on the platform where the code happens to run.

## Options with absolute paths

`absolute()` uses `PathOptions` to decide whether the input and base are absolute, which separator to use, and how the final path should be normalized.

```cpp id="pxde2d"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::absolute(
  "docs/readme.md",
  "/home/gaspard/project",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/home/gaspard/project/docs/readme.md"
```

When the input path is already absolute, the base is ignored and the path is normalized.

```cpp id="cbrgtr"
auto path = vix::path::absolute(
  "/home/gaspard/./project",
  "/ignored",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/home/gaspard/project"
```

When the input path is relative, the base must be non-empty and absolute for the selected style.

## Options with relative paths

`relative()`, `lexically_relative()`, and `lexically_proximate()` use `PathOptions` when normalizing both paths and comparing their roots.

```cpp id="eu5ry8"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::relative(
  "/a/b/c/file.txt",
  "/a/b/d",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "../c/file.txt"
```

With Windows style, drive roots are compared using Windows rules.

```cpp id="c631kw"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto path = vix::path::lexically_proximate(
  "D:\\docs\\file.txt",
  "C:\\base",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "D:\\docs\\file.txt"
```

A relative path cannot be computed between incompatible roots, but `lexically_proximate()` can still return the normalized target path.

## A practical options workflow

The following example prepares a POSIX-style generated path, preserves the trailing separator for a directory-like display string, and then builds a file path inside it.

```cpp id="h0hulb"
#include <iostream>
#include <vix/path.hpp>

int main()
{
  vix::path::PathOptions options;
  options.style = vix::path::PathStyle::Posix;
  options.preserve_trailing_separator = true;

  auto directory = vix::path::normalize(
    "build//generated/",
    options
  );

  if (!directory) {
    std::cerr << directory.error().message() << '\n';
    return 1;
  }

  options.preserve_trailing_separator = false;

  auto file = vix::path::join(
    directory.value(),
    "./main.cpp",
    options
  );

  if (!file) {
    std::cerr << file.error().message() << '\n';
    return 1;
  }

  std::cout << "directory: " << directory.value() << '\n';
  std::cout << "file: " << file.value() << '\n';

  return 0;
}
```

The workflow is still lexical. It prepares strings only. It does not create `build`, does not create `generated`, and does not check whether `main.cpp` exists.

## Practical rule

Use `PathOptions` when the output style or normalization behavior matters. Set `style` explicitly in tooling code, keep dot and dot-dot normalization enabled for ordinary generated paths, and preserve trailing separators only when the representation needs to show a directory-like path. For real filesystem operations, pass the final path string to the FS module after the lexical work is complete.

The next page explains path errors and how they integrate with the Vix error model.
