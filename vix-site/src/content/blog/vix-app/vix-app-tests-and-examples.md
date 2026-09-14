---
title: vix.app Tests and Examples
description: How to structure tests and examples with vix.app using one manifest per target while keeping projects simple and predictable.
date: 2026-05-17
---

# vix.app Tests and Examples

`vix.app` is intentionally designed around one rule:

```txt
one vix.app = one target
```

That rule also affects how tests and examples should be organized.

Instead of adding a complex multi-target syntax to one manifest, the recommended approach is to use separate manifests:

```txt
project/
  vix.app

  tests/
    vix.app

  examples/
    basic/
      vix.app
```

This keeps each target small, explicit, and easy to build.

## Why tests and examples are separate

A test executable is a different target from the library or application being tested.

An example executable is also a different target.

If `vix.app` tried to describe everything in one file, it would quickly need concepts like:

```txt
targets
test targets
example targets
target dependencies
public includes
private includes
per-target packages
per-target links
per-target resources
```

That is already build-system territory.

For `vix.app` V1, the simpler model is better:

```txt
root/vix.app              -> main app or library
tests/vix.app             -> test executable
examples/basic/vix.app    -> example executable
```

Each folder is independently buildable.

## Recommended library layout

For a library with tests and examples:

```txt
mathlib/
  vix.app

  include/
    mathlib/
      math.hpp

  src/
    add.cpp
    mul.cpp

  tests/
    vix.app
    test_math.cpp

  examples/
    basic/
      vix.app
      src/
        main.cpp
```

This gives three independent targets:

```txt
mathlib                 -> static library
mathlib_tests           -> test executable
mathlib_basic_example   -> example executable
```

## Root library manifest

The root manifest builds the library.

`mathlib/vix.app`:

```ini
name = mathlib
type = static
standard = c++20

sources = [
  src/add.cpp,
  src/mul.cpp,
]

include_dirs = [
  include,
]
```

This manifest describes the library target only.

It does not describe tests.

It does not describe examples.

## Library code

`include/mathlib/math.hpp`:

```cpp
#pragma once

namespace mathlib
{
  int add(int a, int b);
  int mul(int a, int b);
}
```

`src/add.cpp`:

```cpp
#include <mathlib/math.hpp>

namespace mathlib
{
  int add(int a, int b)
  {
    return a + b;
  }
}
```

`src/mul.cpp`:

```cpp
#include <mathlib/math.hpp>

namespace mathlib
{
  int mul(int a, int b)
  {
    return a * b;
  }
}
```

Build the library:

```bash
vix build
```

## Test manifest

The test manifest builds an executable.

`mathlib/tests/vix.app`:

```ini
name = mathlib_tests
type = executable
standard = c++20

sources = [
  test_math.cpp,
  ../src/add.cpp,
  ../src/mul.cpp,
]

include_dirs = [
  ../include,
]
```

Notice the paths:

```txt
test_math.cpp
../src/add.cpp
../src/mul.cpp
../include
```

Because this manifest is inside:

```txt
mathlib/tests/
```

all paths are relative to that directory.

## Test code

`mathlib/tests/test_math.cpp`:

```cpp
#include <vix.hpp>
#include <mathlib/math.hpp>

int main()
{
  if (mathlib::add(2, 3) != 5)
  {
    vix::print("add test failed");
    return 1;
  }

  if (mathlib::mul(4, 5) != 20)
  {
    vix::print("mul test failed");
    return 1;
  }

  vix::print("all tests passed");
  return 0;
}
```

Run the tests:

```bash
cd tests
vix run
```

Expected output:

```txt
all tests passed
```

## Why tests include source files again

In `vix.app` V1, there is no multi-target dependency graph inside one manifest.

So the test executable includes the implementation files it needs:

```ini
sources = [
  test_math.cpp,
  ../src/add.cpp,
  ../src/mul.cpp,
]
```

This is simple and explicit.

For small libraries, it works well.

For larger projects with many targets and dependencies, use `CMakeLists.txt`.

## Application tests

Applications should keep most logic outside `main.cpp`.

Recommended layout:

```txt
myapp/
  vix.app

  include/
    myapp/
      app.hpp

  src/
    main.cpp
    app.cpp

  tests/
    vix.app
    test_app.cpp
```

Root `vix.app`:

```ini
name = myapp
type = executable
standard = c++20

sources = [
  src/main.cpp,
  src/app.cpp,
]

include_dirs = [
  include,
]
```

Test `vix.app`:

```ini
name = myapp_tests
type = executable
standard = c++20

sources = [
  test_app.cpp,
  ../src/app.cpp,
]

include_dirs = [
  ../include,
]
```

The test manifest includes:

```txt
../src/app.cpp
```

but not:

```txt
../src/main.cpp
```

This avoids duplicate `main()` errors.

## Thin main.cpp pattern

Keep `main.cpp` small:

```cpp
#include <myapp/app.hpp>

int main()
{
  return myapp::run();
}
```

Put testable logic in:

```txt
src/app.cpp
include/myapp/app.hpp
```

This makes the test target simple.

## Application code example

`include/myapp/app.hpp`:

```cpp
#pragma once

namespace myapp
{
  int add(int a, int b);
  int run();
}
```

`src/app.cpp`:

```cpp
#include <vix.hpp>
#include <myapp/app.hpp>

namespace myapp
{
  int add(int a, int b)
  {
    return a + b;
  }

  int run()
  {
    vix::print("myapp running");
    return 0;
  }
}
```

`src/main.cpp`:

```cpp
#include <myapp/app.hpp>

int main()
{
  return myapp::run();
}
```

`tests/test_app.cpp`:

```cpp
#include <vix.hpp>
#include <myapp/app.hpp>

int main()
{
  if (myapp::add(10, 20) != 30)
  {
    vix::print("add test failed");
    return 1;
  }

  vix::print("app tests passed");
  return 0;
}
```

Run:

```bash
cd tests
vix run
```

## Multiple test files

Tests can be split across several files.

Example:

```txt
mathlib/
  tests/
    vix.app
    test_main.cpp
    test_add.cpp
    test_mul.cpp
```

`tests/vix.app`:

```ini
name = mathlib_tests
type = executable
standard = c++20

sources = [
  test_main.cpp,
  test_add.cpp,
  test_mul.cpp,
  ../src/add.cpp,
  ../src/mul.cpp,
]

include_dirs = [
  ../include,
]
```

`test_main.cpp`:

```cpp
#include <vix.hpp>

int run_add_tests();
int run_mul_tests();

int main()
{
  if (run_add_tests() != 0)
    return 1;

  if (run_mul_tests() != 0)
    return 1;

  vix::print("all tests passed");
  return 0;
}
```

`test_add.cpp`:

```cpp
#include <vix.hpp>
#include <mathlib/math.hpp>

int run_add_tests()
{
  if (mathlib::add(2, 3) != 5)
  {
    vix::print("add test failed");
    return 1;
  }

  return 0;
}
```

`test_mul.cpp`:

```cpp
#include <vix.hpp>
#include <mathlib/math.hpp>

int run_mul_tests()
{
  if (mathlib::mul(4, 5) != 20)
  {
    vix::print("mul test failed");
    return 1;
  }

  return 0;
}
```

## Test resources

Tests sometimes need input files.

Example layout:

```txt
myapp/
  tests/
    vix.app
    test_config.cpp
    data/
      config.json
```

`tests/vix.app`:

```ini
name = config_tests
type = executable
standard = c++20
output_dir = bin

sources = [
  test_config.cpp,
]

resources = [
  data,
]
```

Build and run:

```bash
cd tests
vix run
```

The `data` directory is copied next to the test executable.

## Custom test resource destination

You can also rename or nest resources:

```ini
resources = [
  "data/config.json=config/config.json",
]
```

This copies:

```txt
data/config.json
```

to:

```txt
config/config.json
```

next to the test executable.

## Tests with packages

A test target can use packages and links like any other target.

Example:

```ini
name = threaded_tests
type = executable
standard = c++20

sources = [
  test_threads.cpp,
]

packages = [
  Threads:REQUIRED,
]

links = [
  Threads::Threads,
]
```

The rule is the same:

```txt
packages finds packages
links links targets
```

## Tests with compile options

Test targets can have their own compiler options:

```ini
name = mathlib_tests
type = executable
standard = c++20

sources = [
  test_math.cpp,
  ../src/add.cpp,
]

include_dirs = [
  ../include,
]

compile_options = [
  -Wall,
  -Wextra,
  -Wpedantic,
]
```

This keeps test build settings close to the test target.

## Tests with defines

Test-specific definitions can be added with `defines`:

```ini
name = mathlib_tests
type = executable
standard = c++20

sources = [
  test_math.cpp,
  ../src/add.cpp,
]

include_dirs = [
  ../include,
]

defines = [
  MATHLIB_TESTING=1,
]
```

Then in C++:

```cpp
#ifdef MATHLIB_TESTING
// test-only behavior
#endif
```

## Examples

Examples follow the same rule as tests:

```txt
one example target = one vix.app
```

Recommended layout:

```txt
mathlib/
  examples/
    basic/
      vix.app
      src/
        main.cpp
    advanced/
      vix.app
      src/
        main.cpp
```

Each example can be built independently.

## Basic example manifest

`examples/basic/vix.app`:

```ini
name = mathlib_basic_example
type = executable
standard = c++20

sources = [
  src/main.cpp,
  ../../src/add.cpp,
  ../../src/mul.cpp,
]

include_dirs = [
  ../../include,
]
```

`examples/basic/src/main.cpp`:

```cpp
#include <vix.hpp>
#include <mathlib/math.hpp>

int main()
{
  vix::print("2 + 3 =", mathlib::add(2, 3));
  vix::print("4 * 5 =", mathlib::mul(4, 5));
  return 0;
}
```

Run:

```bash
cd examples/basic
vix run
```

## Example with resources

Example layout:

```txt
myapp/
  examples/
    resources/
      vix.app
      src/
        main.cpp
      assets/
        message.txt
```

`examples/resources/vix.app`:

```ini
name = resources_example
type = executable
standard = c++20
output_dir = bin

sources = [
  src/main.cpp,
]

resources = [
  assets,
]
```

Run:

```bash
cd examples/resources
vix run
```

## Example with packages

Example:

```ini
name = fmt_example
type = executable
standard = c++20

sources = [
  src/main.cpp,
]

packages = [
  fmt:REQUIRED,
]

links = [
  fmt::fmt,
]
```

This keeps package requirements explicit for the example itself.

## Why examples should be independent

Independent examples are useful because they can be copied, tested, and understood alone.

A reader can enter the folder and run:

```bash
vix run
```

without understanding the entire repository.

That makes examples better for documentation and debugging.

## CI for tests

A simple CI flow for a library can run:

```bash
vix build

cd tests
vix build
vix run
```

If the project has examples:

```bash
cd examples/basic
vix build
vix run
```

For release builds:

```bash
vix build --preset release
```

inside each target folder.

## Why not CTest in vix.app V1

CTest is powerful, but it brings a larger model:

```txt
test registration
test discovery
test properties
fixtures
labels
parallel execution
working directories
```

That belongs in full CMake for now.

For `vix.app` V1, test executables are enough.

A test passes when the executable returns `0`.

A test fails when it returns non-zero.

This keeps the model simple.

## When to use CMake for tests

Use `CMakeLists.txt` when tests need:

```txt
CTest integration
GoogleTest discovery
FetchContent
many test targets
fixtures
generated test files
coverage tools
custom test commands
```

`vix.app` is best for simple test executables.

## Common mistakes

### Including main.cpp in tests

Wrong:

```ini
sources = [
  test_app.cpp,
  ../src/main.cpp,
  ../src/app.cpp,
]
```

This can create duplicate `main()` errors.

Correct:

```ini
sources = [
  test_app.cpp,
  ../src/app.cpp,
]
```

### Forgetting relative paths

Inside `tests/vix.app`, this is usually wrong:

```ini
sources = [
  src/add.cpp,
]
```

Because the file is probably one level above:

```ini
sources = [
  ../src/add.cpp,
]
```

### Missing include_dirs

If your test includes:

```cpp
#include <mathlib/math.hpp>
```

you need:

```ini
include_dirs = [
  ../include,
]
```

### Trying to run a library target

If the root project is:

```ini
type = static
```

then use:

```bash
vix build
```

To run something, use:

```txt
tests/vix.app
```

or:

```txt
examples/basic/vix.app
```

### Putting too much into one manifest

Avoid trying to describe an entire workspace in one `vix.app`.

Prefer:

```txt
one folder
one target
one manifest
```

## Recommended patterns

### Library with tests

```txt
mathlib/
  vix.app
  include/
  src/
  tests/
    vix.app
    test_math.cpp
```

### Library with examples

```txt
mathlib/
  vix.app
  include/
  src/
  examples/
    basic/
      vix.app
      src/
        main.cpp
```

### App with tests

```txt
myapp/
  vix.app
  include/
  src/
  tests/
    vix.app
    test_app.cpp
```

## Summary

For tests and examples, keep the model simple:

```txt
root/vix.app              -> main target
tests/vix.app             -> test executable
examples/name/vix.app     -> example executable
```

Use explicit sources.

Use relative paths carefully.

Do not include `main.cpp` in test executables.

Use CMake when the test system becomes complex.

`vix.app` is strongest when every manifest describes one clear target.
