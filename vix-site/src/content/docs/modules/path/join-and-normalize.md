# Join and Normalize

Joining and normalizing are the most common operations in the Path module. They are used when Vix needs to build a path from several fragments and then bring the result into a stable lexical form. These operations do not access the filesystem. They only work from the characters in the path strings.

For normal use, include the public header:

```cpp id="r9a0dg"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## Joining two fragments

Use `join()` to combine two path fragments.

```cpp id="d7zv3q"
auto path = vix::path::join("src", "main.cpp");

if (!path) {
  return path.error();
}

// path.value() == "src/main.cpp" on POSIX-style output
```

`join()` does more than simple string concatenation. It removes unnecessary separators at the boundary between the two fragments, inserts the preferred separator for the selected style, and normalizes the final result.

```cpp id="lcb38d"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::join("/usr/", "/bin", options);

if (!path) {
  return path.error();
}

// path.value() == "/usr/bin"
```

The function treats both inputs as fragments to combine. If the right side starts with a separator, the leading separator is trimmed before the fragments are joined. This keeps `join()` predictable for Vix tooling, where paths are often assembled from manifest values, generated folder names, and known output roots.

## Joining three fragments

`join()` also has an overload for three fragments.

```cpp id="q8olwy"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::join(
  "src",
  "app",
  "main.cpp",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "src/app/main.cpp"
```

Internally, this is equivalent to joining the first two fragments, then joining the result with the third fragment. If the first join fails, the error is returned immediately.

## Empty fragments

`join()` accepts one empty side when the other side contains a path. In that case, it normalizes the non-empty side.

```cpp id="yg57qf"
auto path = vix::path::join("", "src/main.cpp");

if (!path) {
  return path.error();
}

// path.value() == "src/main.cpp"
```

When both sides are empty, the function returns a path error.

```cpp id="rra0nh"
auto path = vix::path::join("", "");

if (!path) {
  const auto& err = path.error();
  // cannot join two empty paths
}
```

This keeps accidental empty path construction visible. A single empty fragment may simply mean “use the other path”, but two empty fragments do not produce a meaningful path.

## Windows-style joining

Use `PathOptions` when the output should follow Windows path rules.

```cpp id="ls0dpv"
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

The selected style controls the preferred separator used when building the result. `PathStyle::Windows` uses `\`, while `PathStyle::Posix` uses `/`. `PathStyle::Native` follows the platform where the code runs.

## Normalizing a path

Use `normalize()` when a path needs a stable lexical form.

```cpp id="zp61aw"
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

Normalization can collapse repeated separators, remove `.` segments, and resolve `..` segments when possible. The operation is purely lexical. It does not check that `/a`, `/a/b`, or `/a/b/d` exists.

This makes `normalize()` safe to use in manifest parsing, project generation, CLI diagnostics, and build tooling before any filesystem operation is performed.

## Normalizing Windows paths

The same normalization model works with Windows-style paths.

```cpp id="w6d2of"
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

When Windows style is selected, the module recognizes drive roots such as `C:\` and uses `\` as the preferred separator in generated output.

## Dot segments

By default, normalization removes `.` segments.

```cpp id="uutvi8"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "src/./main.cpp",
  options
);

// path.value() == "src/main.cpp"
```

This behavior can be disabled when a caller wants to preserve `.` as a visible segment.

```cpp id="qroa5k"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.remove_dot_segments = false;

auto path = vix::path::normalize(
  "src/./main.cpp",
  options
);

// path.value() keeps the dot segment
```

Most Vix code should keep the default behavior. Removing `.` segments gives cleaner generated paths and simpler diagnostics.

## Dot-dot segments

By default, normalization resolves `..` segments when it can do so safely.

```cpp id="bog76i"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "src/core/../main.cpp",
  options
);

// path.value() == "src/main.cpp"
```

For relative paths, unresolved `..` segments can remain because there is no absolute root to cross.

```cpp id="d42jpm"
auto path = vix::path::normalize(
  "../src/../include",
  options
);

// path.value() == "../include"
```

For absolute paths, traversal above the root is rejected.

```cpp id="mqayz4"
auto path = vix::path::normalize(
  "/../outside",
  options
);

if (!path) {
  // traversal above root is not allowed
}
```

This keeps rooted paths safe while still allowing relative paths to express movement from an external base.

## Preserving a trailing separator

By default, normalization does not preserve a trailing separator.

```cpp id="xliomc"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "build/generated/",
  options
);

// path.value() == "build/generated"
```

Set `preserve_trailing_separator` when the trailing separator is part of the representation the caller wants to keep.

```cpp id="wu6zt4"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
options.preserve_trailing_separator = true;

auto path = vix::path::normalize(
  "build/generated/",
  options
);

// path.value() == "build/generated/"
```

The separator is preserved only when the input path already had one. The option does not add a trailing separator to paths that did not contain one.

## Lexically normal paths

`lexically_normal()` is the canonical lexical normalization entry point of the module. It delegates to the same normalization behavior.

```cpp id="q13kwl"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::lexically_normal(
  "/x//y/./z/../a",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/x/y/a"
```

Use `lexically_normal()` when the code wants to communicate intent using the standard path vocabulary. Use `normalize()` when the code wants the shorter Vix API name. Both are lexical and both return a `PathResult`.

## A practical workflow

A common workflow is to join several fragments, normalize the result, then pass the final string to another layer.

```cpp id="quj6hc"
#include <iostream>
#include <vix/path.hpp>

int main()
{
  vix::path::PathOptions options;
  options.style = vix::path::PathStyle::Posix;

  auto source = vix::path::join(
    "src/",
    "./app//main.cpp",
    options
  );

  if (!source) {
    std::cerr << source.error().message() << '\n';
    return 1;
  }

  auto output = vix::path::join(
    "build/generated",
    source.value(),
    options
  );

  if (!output) {
    std::cerr << output.error().message() << '\n';
    return 1;
  }

  std::cout << output.value() << '\n';
  return 0;
}
```

This code prepares a stable path string. It does not create `build`, it does not check that `src/app/main.cpp` exists, and it does not read or write anything. A filesystem layer can use the returned value later.

## Practical rule

Use `join()` when the path is being assembled from fragments. Use `normalize()` or `lexically_normal()` when the path already exists as one string and needs to be cleaned lexically. In both cases, check the result before using the value, because empty inputs and invalid traversal can produce structured path errors.

The next page explains path components such as filename, parent, stem, extension, and split.
