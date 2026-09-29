# Absolute and Relative

The Path module can compute absolute and relative paths without touching the filesystem. These operations are lexical: they compare roots, separators, and path segments from the strings provided by the caller. They do not check whether the target exists, whether the base directory exists, or whether the path points to a real file.

For normal use, include the public header:

```cpp id="eg6y3d"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## Absolute paths

Use `is_absolute()` when code only needs to know whether a path is lexically absolute.

```cpp id="taovro"
bool ok = vix::path::is_absolute(
  "/usr/bin",
  vix::path::PathStyle::Posix
);

// ok == true
```

In POSIX style, a path that starts with a separator is absolute. In Windows style, the module also recognizes drive-root paths such as `C:\Windows` and UNC-style paths such as `\\server\share`.

```cpp id="o68c6q"
bool drive = vix::path::is_absolute(
  "C:\\Windows",
  vix::path::PathStyle::Windows
);

// drive == true
```

This check is purely lexical. It does not verify that `/usr/bin`, `C:\Windows`, or any UNC path exists.

## Relative paths

Use `is_relative()` when code needs the opposite check.

```cpp id="oq5uqc"
bool rel = vix::path::is_relative(
  "docs/readme.md",
  vix::path::PathStyle::Posix
);

// rel == true
```

`is_relative()` is implemented as the lexical opposite of `is_absolute()`. A path is relative when it does not have an absolute root for the selected style.

This makes the function useful for validating manifest values. For example, a Vix project file may allow relative source paths but reject absolute paths when the project layout needs to remain portable.

## Resolving an absolute path

Use `absolute()` when code needs to resolve a path against a base path.

```cpp id="fkjfcj"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::absolute(
  "docs/readme.md",
  "/home/gaspard",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/home/gaspard/docs/readme.md"
```

If the input path is already absolute, `absolute()` normalizes it and returns it.

```cpp id="rgjxuw"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::absolute(
  "/home/gaspard/./docs/../README.md",
  "/ignored/base",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/home/gaspard/README.md"
```

If the input path is relative, the base must be non-empty and absolute. The function then joins the base with the relative path and normalizes the result.

```cpp id="rrtzk1"
auto path = vix::path::absolute(
  "src/../README.md",
  "/home/gaspard/project",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/home/gaspard/project/README.md"
```

The base does not need to exist on disk. It only needs to be lexically absolute for the selected path style.

## Invalid absolute resolution

`absolute()` returns a structured path error when it cannot build a meaningful absolute path.

```cpp id="dzm9v8"
auto path = vix::path::absolute(
  "",
  "/home/gaspard",
  {}
);

if (!path) {
  const auto& err = path.error();
  // path cannot be empty
}
```

A relative path also requires a valid base.

```cpp id="zg41gw"
auto path = vix::path::absolute(
  "docs/readme.md",
  "",
  {}
);

if (!path) {
  const auto& err = path.error();
  // base path cannot be empty when resolving a relative path
}
```

When the base is provided but is not absolute, the function fails as well.

```cpp id="sv7zkd"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::absolute(
  "docs/readme.md",
  "project",
  options
);

if (!path) {
  const auto& err = path.error();
  // base path must be absolute
}
```

This keeps the API honest. A relative path cannot become an absolute lexical path unless the caller provides an absolute root to resolve it from.

## Computing a relative path

Use `relative()` when code needs a path from one lexical location to another.

```cpp id="lovrmc"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::relative(
  "/home/gaspard/docs/readme.md",
  "/home/gaspard",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "docs/readme.md"
```

`relative()` is the high-level API. It delegates to the module’s lexical relative computation. The operation normalizes both paths, compares their segments, and builds the path needed to reach the target from the base.

```cpp id="l4pf7h"
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

The result is computed from the path strings only. The module does not check that `/a/b/c/file.txt` or `/a/b/d` exists.

## Lexically relative paths

`lexically_relative()` is the explicit lexical form of the relative path operation.

```cpp id="jlnnse"
auto path = vix::path::lexically_relative(
  "/a/b/c/file.txt",
  "/a/b/d",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "../c/file.txt"
```

Use `relative()` when the code wants the high-level Vix API name. Use `lexically_relative()` when the code wants to make the lexical nature of the operation visible at the call site. Both produce the same kind of `PathResult`.

When the target and base are the same after normalization, the relative result is `"."`.

```cpp id="noa14q"
auto path = vix::path::lexically_relative(
  "/home/gaspard/project",
  "/home/gaspard/project",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "."
```

This gives callers a stable representation for “the target is the base”.

## Incompatible roots

Relative paths can only be computed when the target and base have compatible roots.

```cpp id="i8xlcq"
vix::path::PathOptions options;
options.style = vix::path::Windows;

auto path = vix::path::relative(
  "D:\\docs\\file.txt",
  "C:\\base",
  options
);

if (!path) {
  const auto& err = path.error();
  // cannot compute lexical relative path between incompatible roots
}
```

A path on `D:` cannot be expressed relatively from a path on `C:` using normal lexical rules. The same principle applies to other incompatible root forms.

This error is useful in tooling code because it tells the caller that the requested relative representation is not valid. The caller can then keep the absolute target, show a diagnostic, or use a proximate path instead.

## Proximate paths

Use `lexically_proximate()` when relative output is preferred but not required.

```cpp id="mmr4ca"
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

The function first attempts to compute a lexical relative path. When that succeeds, the relative path is returned. When it cannot produce a relative path, it returns the normalized target path instead.

```cpp id="s71aju"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::lexically_proximate(
  "/home/gaspard/project/src/main.cpp",
  "/home/gaspard/project",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "src/main.cpp"
```

This is useful for diagnostics and generated output. A relative path is usually easier to read, but a normalized target path is still better than failing when the roots cannot be compared.

## POSIX and Windows examples

The same APIs work with POSIX and Windows styles. The selected style controls how roots are interpreted and which separator is preferred in generated output.

```cpp id="xtj7q4"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto rel = vix::path::relative(
  "/project/src/main.cpp",
  "/project",
  options
);

// rel.value() == "src/main.cpp"
```

```cpp id="uyvtlp"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto rel = vix::path::relative(
  "C:\\project\\src\\main.cpp",
  "C:\\project",
  options
);

// rel.value() == "src\\main.cpp"
```

Choosing the style explicitly is useful when the target platform or generated path format matters more than the platform running the command.

## A practical workflow

The following example resolves a relative source path against a project root, then computes a relative display path from the same root.

```cpp id="vj21uo"
#include <iostream>
#include <vix/path.hpp>

int main()
{
  vix::path::PathOptions options;
  options.style = vix::path::PathStyle::Posix;

  const std::string root = "/home/gaspard/project";
  const std::string source = "src/app/main.cpp";

  auto absolute_source = vix::path::absolute(source, root, options);
  if (!absolute_source) {
    std::cerr << absolute_source.error().message() << '\n';
    return 1;
  }

  auto display = vix::path::relative(
    absolute_source.value(),
    root,
    options
  );

  if (!display) {
    std::cerr << display.error().message() << '\n';
    return 1;
  }

  std::cout << "absolute: " << absolute_source.value() << '\n';
  std::cout << "display: " << display.value() << '\n';

  return 0;
}
```

This workflow is common in project tooling. The absolute path gives the internal representation a stable root, while the relative path gives diagnostics and generated metadata a cleaner form.

## Practical rule

Use `absolute()` when a relative path needs to be anchored to a known absolute base. Use `relative()` or `lexically_relative()` when a target should be described from another path. Use `lexically_proximate()` when a relative path is preferred but a normalized target path is acceptable when relative computation is not valid.

The next page explains separators and path styles in more detail.
