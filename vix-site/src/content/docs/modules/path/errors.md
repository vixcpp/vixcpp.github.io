# Errors

The Path module reports lexical path failures through the Vix error model. Operations that transform a path, split a path, or compute a relationship between paths return `Result<T>` aliases. When the result succeeds, the caller receives the transformed value. When it fails, the caller receives a structured `vix::error::Error` with the `path` category.

For normal use, include the public header:

```cpp id="w3d6cg"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## Result-based operations

Most path transformations return a result.

```cpp id="b1dvx8"
auto result = vix::path::normalize("src/./main.cpp");

if (!result) {
  const auto& err = result.error();
  // handle path error
}

std::string path = result.value();
```

The boolean conversion of the result means success. When `if (result)` is true, the value is available. When it is false, the error is available.

```cpp id="q7z08q"
auto result = vix::path::normalize("");

if (!result) {
  std::cerr << result.error().message() << '\n';
}
```

This is the same pattern used by other Vix modules. A path function does not need to throw an exception for ordinary validation failures, and it does not need to return magic strings for invalid cases.

## Path error category

Path errors use the `path` category.

```cpp id="k5kl4h"
auto result = vix::path::split("");

if (!result) {
  const auto& err = result.error();

  // err.category().name() == "path"
}
```

The category is useful when a higher-level module wants to preserve the source of the failure. For example, a manifest loader may fail because a source path is invalid. It can keep the original `path` error, or it can wrap it with manifest-specific context.

## PathErrorCode

The module defines `PathErrorCode` for path-specific failures.

```cpp id="ylt4q8"
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

These codes describe lexical path problems, not filesystem problems. A `PathErrorCode::EmptyPath` means the string passed to a path operation was empty. `PathErrorCode::IncompatibleRoots` means two paths cannot be compared as relative paths because their roots do not match. `PathErrorCode::TraversalAboveRoot` means normalization tried to resolve `..` above an absolute root.

The public error object still uses the shared Vix error type. The path-specific code is converted into a common `vix::error::ErrorCode`.

## Shared Vix error code

Path-specific errors are converted to the shared error model.

```cpp id="z309m8"
vix::path::PathErrorCode::EmptyPath
  -> vix::error::ErrorCode::InvalidArgument

vix::path::PathErrorCode::InvalidPath
  -> vix::error::ErrorCode::InvalidArgument

vix::path::PathErrorCode::IncompatibleRoots
  -> vix::error::ErrorCode::InvalidArgument

vix::path::PathErrorCode::TraversalAboveRoot
  -> vix::error::ErrorCode::InvalidArgument
```

This keeps the module integrated with the rest of Vix. Higher-level code can work with the common `ErrorCode` vocabulary while still keeping the `path` category and the human-readable message.

## Building a path error

Use `make_path_error()` when path-related code needs to return an error consistent with the module.

```cpp id="t3k72r"
return vix::path::make_path_error(
  vix::path::PathErrorCode::InvalidPath,
  "expected a project-relative path"
);
```

The helper builds a `vix::error::Error` using the converted shared error code, the `path` category, and the provided message.

```cpp id="f88vya"
vix::error::Result<std::string> require_relative_path(
  std::string_view path
)
{
  if (path.empty()) {
    return vix::path::make_path_error(
      vix::path::PathErrorCode::EmptyPath,
      "path cannot be empty"
    );
  }

  if (!vix::path::is_relative(path, vix::path::PathStyle::Posix)) {
    return vix::path::make_path_error(
      vix::path::PathErrorCode::InvalidPath,
      "path must be relative"
    );
  }

  return std::string(path);
}
```

This keeps custom path validation aligned with the built-in module functions.

## Empty paths

Most path transformations reject empty input.

```cpp id="oypca4"
auto result = vix::path::normalize("");

if (!result) {
  const auto& err = result.error();
  // path cannot be empty
}
```

The same rule applies to functions such as `filename()`, `parent()`, `split()`, `replace_extension()`, and `absolute()` when the main path argument is empty.

```cpp id="rrijjl"
auto parts = vix::path::split("");

if (!parts) {
  std::cerr << parts.error().message() << '\n';
}
```

An empty path usually means the caller failed to build a meaningful value. Returning a structured error makes that mistake visible instead of silently producing another empty string.

## Join errors

`join()` accepts one empty fragment when the other side contains a path. In that case, the non-empty side is normalized and returned.

```cpp id="iearll"
auto path = vix::path::join("", "src/main.cpp");

if (!path) {
  return path.error();
}

// path.value() == "src/main.cpp"
```

When both fragments are empty, there is no meaningful path to build, so the function returns an error.

```cpp id="kjza0g"
auto path = vix::path::join("", "");

if (!path) {
  const auto& err = path.error();
  // cannot join two empty paths
}
```

This keeps accidental empty path construction clear while still allowing practical join workflows where one side may be optional.

## Absolute path errors

`absolute()` resolves a path into an absolute lexical path. If the input path is already absolute, it is normalized and returned. If the input path is relative, the base path must be non-empty and absolute.

```cpp id="c3tbph"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::absolute(
  "docs/readme.md",
  "",
  options
);

if (!path) {
  const auto& err = path.error();
  // base path cannot be empty when resolving a relative path
}
```

A relative path with a relative base also fails.

```cpp id="tw9fko"
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

The function cannot invent a root. To produce an absolute path, the caller must either provide an already absolute path or provide an absolute base.

## Relative path errors

`relative()` and `lexically_relative()` compute a path from a base to a target. Both paths must be non-empty, and their roots must be compatible after normalization.

```cpp id="x10d0k"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

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

A relative path from `C:` to `D:` cannot be expressed with normal lexical rules. The error is not a filesystem failure; it is a path relationship failure.

When the caller prefers a relative path but can accept a fallback, use `lexically_proximate()`.

```cpp id="fqp1fl"
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

`lexically_proximate()` tries the relative computation first. If that does not produce a valid relative path, it returns the normalized target path instead.

## Traversal above root

Normalization resolves `..` segments when possible. For an absolute path, resolving `..` above the root is rejected.

```cpp id="eh5dqo"
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

This protects rooted lexical paths from being normalized into a value that escapes the root boundary.

For relative paths, leading `..` segments can remain because there is no root boundary to cross.

```cpp id="ntp0bl"
auto path = vix::path::normalize(
  "../src/../include",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "../include"
```

The module is still working lexically. It does not check whether the parent directories exist.

## Boolean helpers

Some helpers return plain boolean values instead of `Result<T>` because their answer can be represented directly.

```cpp id="hw1vax"
bool absolute = vix::path::is_absolute(
  "/usr/bin",
  vix::path::PathStyle::Posix
);

bool relative = vix::path::is_relative(
  "docs/readme.md",
  vix::path::PathStyle::Posix
);

bool has = vix::path::has_extension(
  "src/main.cpp"
);
```

These functions do not expose structured errors. For example, `is_absolute("")` returns `false`, and `has_extension("")` returns `false`.

```cpp id="jdsa7s"
bool absolute = vix::path::is_absolute(
  "",
  vix::path::PathStyle::Posix
);

// absolute == false
```

This keeps simple lexical checks simple. Operations that transform paths or return structured parts use `Result<T>` because they need a real error path.

## Error strings

`to_string()` converts a `PathErrorCode` into a stable string name.

```cpp id="oqox31"
const char* name = vix::path::to_string(
  vix::path::PathErrorCode::IncompatibleRoots
);

// name == "incompatible_roots"
```

This is useful for diagnostics, logging, tests, and any code that wants a stable symbolic name without manually duplicating the enum mapping.

## Preserving errors in higher-level code

Because path operations return results, higher-level functions can preserve errors directly.

```cpp id="yqzx0q"
vix::error::Result<std::string> generated_header_path(
  std::string_view source
)
{
  auto normalized = vix::path::normalize(source);
  if (!normalized) {
    return normalized.error();
  }

  return vix::path::replace_extension(
    normalized.value(),
    "hpp"
  );
}
```

The caller of `generated_header_path()` receives either the generated header path or the original path error. There is no need for a separate status flag or exception boundary.

## A practical error workflow

The following example validates a project-relative source path, normalizes it, and reports a path error when the input is invalid.

```cpp id="lgxxeg"
#include <iostream>
#include <string>

#include <vix/path.hpp>

int main()
{
  vix::path::PathOptions options;
  options.style = vix::path::PathStyle::Posix;

  const std::string source = "";

  if (!vix::path::is_relative(source, options.style)) {
    auto err = vix::path::make_path_error(
      vix::path::PathErrorCode::InvalidPath,
      "source path must be relative"
    );

    std::cerr << err.message() << '\n';
    return 1;
  }

  auto normalized = vix::path::normalize(source, options);
  if (!normalized) {
    std::cerr << normalized.error().message() << '\n';
    return 1;
  }

  std::cout << normalized.value() << '\n';
  return 0;
}
```

This example keeps validation and transformation explicit. The boolean check handles the simple relative-path rule. The normalization step handles structured path errors such as empty input or invalid traversal.

## Practical rule

Use result checks for operations that produce a transformed path or structured path parts. Use boolean helpers for simple lexical questions. When creating custom path errors, use `make_path_error()` so the error category, generic code, and message follow the same model as the built-in Path module functions.

The next page contains the API reference for the Path module.
