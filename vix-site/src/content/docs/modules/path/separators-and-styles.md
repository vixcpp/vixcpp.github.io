# Separators and Styles

The Path module supports POSIX, Windows, and native path styles. This matters because Vix can run on one platform while preparing paths for another. A command running on Linux may still need to generate Windows-style paths, and a project tool may want stable POSIX output even when it is executed on Windows.

For normal use, include the public header:

```cpp id="e2fo1u"
#include <vix/path.hpp>
```

All public APIs live in the `vix::path` namespace.

## Path styles

`PathStyle` controls the syntax rules used by path operations.

```cpp id="kjdkj4"
enum class PathStyle
{
  Native,
  Posix,
  Windows
};
```

`PathStyle::Native` follows the platform where the program is running. `PathStyle::Posix` uses POSIX-style output and prefers `/`. `PathStyle::Windows` uses Windows-style output and prefers `\`.

```cpp id="j4t3n7"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;
```

Choosing the style explicitly is usually better in tooling code. It makes the expected output clear and avoids accidental differences between machines.

## Preferred separator

Use `preferred_separator()` when code needs the separator character for a style.

```cpp id="d6ff1l"
char sep = vix::path::preferred_separator(
  vix::path::PathStyle::Posix
);

// sep == '/'
```

```cpp id="p3c8pn"
char sep = vix::path::preferred_separator(
  vix::path::PathStyle::Windows
);

// sep == '\\'
```

For `PathStyle::Native`, the result depends on the current platform.

```cpp id="uoosgm"
char sep = vix::path::preferred_separator(
  vix::path::PathStyle::Native
);
```

This helper is useful when a caller needs to build a small display string or align custom logic with the same separator style used by `join()` and `normalize()`.

## Recognized separators

The module recognizes both `/` and `\` as separators during lexical processing.

```cpp id="o6n662"
bool slash = vix::path::is_separator('/');
// slash == true
```

```cpp id="eud73s"
bool backslash = vix::path::is_separator('\\');
// backslash == true
```

A normal character is not a separator.

```cpp id="vvglsb"
bool regular = vix::path::is_separator('x');
// regular == false
```

Recognizing both separator characters makes the module tolerant when reading path strings. The selected style still controls which separator is preferred in generated output.

## Leading and trailing separators

Use `has_leading_separator()` to check whether a path starts with a separator.

```cpp id="jlw1x6"
bool leading = vix::path::has_leading_separator("/tmp");

// leading == true
```

Use `has_trailing_separator()` to check whether a path ends with a separator.

```cpp id="vnj90h"
bool trailing = vix::path::has_trailing_separator("/tmp/");

// trailing == true
```

```cpp id="g0p4j3"
bool trailing = vix::path::has_trailing_separator("/tmp/file.txt");

// trailing == false
```

These helpers are simple lexical checks. They do not inspect the filesystem and they do not decide whether the path is a directory.

## POSIX style

POSIX style uses `/` as the preferred separator. A path starting with a separator is treated as absolute.

```cpp id="b4zeq3"
bool absolute = vix::path::is_absolute(
  "/usr/bin",
  vix::path::PathStyle::Posix
);

// absolute == true
```

A path without a leading separator is relative.

```cpp id="gxnrqn"
bool relative = vix::path::is_relative(
  "usr/bin",
  vix::path::PathStyle::Posix
);

// relative == true
```

When POSIX style is used with `join()` or `normalize()`, generated output uses `/`.

```cpp id="j09d1v"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto joined = vix::path::join("/usr/", "/bin", options);

if (!joined) {
  return joined.error();
}

// joined.value() == "/usr/bin"
```

## Windows style

Windows style uses `\` as the preferred separator. The module recognizes drive-root paths such as `C:\Windows`.

```cpp id="mdw800"
bool absolute = vix::path::is_absolute(
  "C:\\Windows",
  vix::path::PathStyle::Windows
);

// absolute == true
```

It also recognizes UNC-style paths.

```cpp id="wgsqn5"
bool absolute = vix::path::is_absolute(
  "\\\\server\\share",
  vix::path::PathStyle::Windows
);

// absolute == true
```

A path without a Windows root is relative.

```cpp id="dyr7pe"
bool relative = vix::path::is_relative(
  "docs\\readme.md",
  vix::path::PathStyle::Windows
);

// relative == true
```

When Windows style is selected, `join()` and `normalize()` produce Windows-style output.

```cpp id="hg2h4k"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto joined = vix::path::join(
  "C:\\Users\\",
  "\\gaspard",
  options
);

if (!joined) {
  return joined.error();
}

// joined.value() == "C:\\Users\\gaspard"
```

## Native style

`PathStyle::Native` follows the platform where the program is compiled and executed.

```cpp id="yxpyly"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Native;
```

This is useful when the path should match the current machine. It is less useful for generated project files, cross-platform manifests, or documentation examples where the expected output should be the same everywhere.

For stable tooling behavior, prefer `PathStyle::Posix` or `PathStyle::Windows` when the target format is known.

## Separator conversion through normalization

Normalization can read mixed separators and rebuild the path with the preferred separator for the selected style.

```cpp id="jpghoc"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "src\\core//main.cpp",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "src/core/main.cpp"
```

With Windows style, the generated output uses `\`.

```cpp id="cxjnrr"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto path = vix::path::normalize(
  "C:/temp//foo\\bar",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "C:\\temp\\foo\\bar"
```

This is one of the reasons the style belongs in `PathOptions`. The same input string can be normalized into different output forms depending on the target syntax.

## Repeated separators

By default, repeated separators are collapsed during normalization.

```cpp id="tkxdi9"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "/a//b///c",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "/a/b/c"
```

This keeps generated paths clean and avoids carrying accidental separator noise from user input, configuration files, or string concatenation.

## Trailing separators

By default, normalization does not preserve a trailing separator.

```cpp id="y5dmgr"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Posix;

auto path = vix::path::normalize(
  "build/generated/",
  options
);

if (!path) {
  return path.error();
}

// path.value() == "build/generated"
```

Set `preserve_trailing_separator` when the trailing separator should remain part of the output representation.

```cpp id="shfqk4"
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

This option preserves a trailing separator only when the input already had one. It does not add a separator to a path that did not end with one.

## Style and roots

The selected style also affects how roots are understood. In POSIX style, `/` is the main root form.

```cpp id="qrvqwq"
bool root = vix::path::is_absolute(
  "/project",
  vix::path::PathStyle::Posix
);

// root == true
```

In Windows style, drive-root paths and UNC-style paths are recognized.

```cpp id="w3fj0y"
bool drive = vix::path::is_absolute(
  "C:\\project",
  vix::path::PathStyle::Windows
);

// drive == true
```

```cpp id="mny5a5"
bool unc = vix::path::is_absolute(
  "\\\\server\\share",
  vix::path::PathStyle::Windows
);

// unc == true
```

Roots matter most when computing relative paths. A relative path can only be computed when the target and base have compatible roots.

```cpp id="ekkk8x"
vix::path::PathOptions options;
options.style = vix::path::PathStyle::Windows;

auto rel = vix::path::relative(
  "D:\\docs\\file.txt",
  "C:\\base",
  options
);

if (!rel) {
  // incompatible roots
}
```

When incompatible roots are acceptable and the caller still wants a usable path, use `lexically_proximate()` instead.

## A practical style workflow

The following example normalizes the same conceptual path for POSIX and Windows output.

```cpp id="m8vgc6"
#include <iostream>
#include <vix/path.hpp>

int main()
{
  vix::path::PathOptions posix;
  posix.style = vix::path::PathStyle::Posix;

  auto a = vix::path::normalize(
    "src\\core//main.cpp",
    posix
  );

  if (!a) {
    std::cerr << a.error().message() << '\n';
    return 1;
  }

  vix::path::PathOptions windows;
  windows.style = vix::path::PathStyle::Windows;

  auto b = vix::path::normalize(
    "src\\core//main.cpp",
    windows
  );

  if (!b) {
    std::cerr << b.error().message() << '\n';
    return 1;
  }

  std::cout << "posix: " << a.value() << '\n';
  std::cout << "windows: " << b.value() << '\n';

  return 0;
}
```

The input path is only text. The selected style decides how that text is interpreted and rebuilt.

## Practical rule

Use explicit styles when the output format matters. Use POSIX for project metadata, generated documentation examples, or portable internal paths. Use Windows when generating or validating Windows-style paths. Use Native only when the path should follow the machine running the code.

The next page explains `PathOptions` in detail.
