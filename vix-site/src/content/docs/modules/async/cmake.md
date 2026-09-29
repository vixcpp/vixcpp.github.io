# CMake

The Async module exposes one public CMake target:

```cmake
vix::async
```

Linking this target gives an application the Async library, its public headers, C++20 requirement, and the platform dependencies required by the module.

Application code can then use:

```cpp
#include <vix/async.hpp>
```

## Link Async

For an installed standalone Async package:

```cmake
cmake_minimum_required(VERSION 3.20)

project(example LANGUAGES CXX)

find_package(async CONFIG REQUIRED)

add_executable(example
  main.cpp
)

target_link_libraries(example
  PRIVATE
    vix::async
)
```

The application does not need to list the individual Async source files or internal networking dependencies.

The public target carries those requirements.

## C++20

Vix Async uses C++20 coroutines.

The library declares:

```cmake
target_compile_features(vix_async
  PUBLIC
    cxx_std_20
)
```

A target linked with:

```cmake
target_link_libraries(example
  PRIVATE
    vix::async
)
```

therefore inherits the C++20 requirement through CMake.

The compiler itself must support the C++20 features used by the module.

## Public header

The preferred public entry point is:

```cpp
#include <vix/async.hpp>
```

For example:

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<void> run()
{
  vix::print("Hello from Async");
  co_return;
}

int main()
{
  io_context ctx;

  std::move(run()).start(
    ctx.get_scheduler()
  );

  ctx.run();

  return 0;
}
```

The Async CMake target provides the include path containing this header.

If the example also uses `vix::print`, link the Vix target that provides the Print API according to the surrounding Vix application setup.

## Standalone package

When the Async module is built outside the Vix umbrella, it installs its own CMake package.

The installed package contains:

```text
asyncConfig.cmake
asyncConfigVersion.cmake
asyncTargets.cmake
```

The exported target is:

```cmake
vix::async
```

A consumer therefore uses:

```cmake
find_package(async CONFIG REQUIRED)
```

followed by:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::async
)
```

The package version follows the Async module version.

The current stabilized module declares:

```text
1.2.1
```

and its generated package version uses `SameMajorVersion` compatibility.

## Build as part of a source tree

The module can also be added directly to another CMake build.

For example:

```cmake
add_subdirectory(
  modules/async
)

add_executable(my_app
  main.cpp
)

target_link_libraries(my_app
  PRIVATE
    vix::async
)
```

The target name remains the same:

```cmake
vix::async
```

Application targets should depend on the public alias rather than the implementation target name.

Prefer:

```cmake
vix::async
```

over:

```cmake
vix_async
```

The alias is the public CMake interface of the module.

## Vix umbrella builds

When Async is built inside the Vix umbrella, the parent Vix build owns package export.

Async contributes its target to:

```text
VixTargets
```

instead of installing a second independent `asyncTargets` export set.

The public target remains:

```cmake
vix::async
```

This avoids competing package ownership between the module and the complete Vix distribution.

Conceptually:

```text
standalone Async
      ↓
async package
      ↓
vix::async

Vix umbrella
      ↓
Vix package owns export
      ↓
vix::async
```

The application-facing target does not change.

## Asio dependency

TCP, UDP, and DNS use standalone Asio internally.

Applications should not link Asio manually just to use Vix Async.

The `vix::async` target carries the networking dependency required by the module.

In a Vix umbrella build, Async expects the umbrella to provide:

```cmake
vix::thirdparty_asio
```

In a standalone Async build, the module searches in this order:

```text
module-local Asio
      ↓
system Asio headers
```

A module-local installation is expected under:

```text
third_party/asio/include
```

If it is not present, CMake searches for:

```text
asio.hpp
```

in the system environment.

## Standalone Asio installation

When building Async by itself without vendored Asio, standalone Asio headers must be installed somewhere CMake can find them.

The module searches common locations such as:

```text
/usr/include
/usr/local/include
```

and also respects:

```text
ASIO_ROOT
```

For example:

```bash
cmake -S . -B build \
  -DASIO_ROOT=/path/to/asio
```

The expected layout can be:

```text
/path/to/asio/include/asio.hpp
```

or:

```text
/path/to/asio/asio.hpp
```

depending on the value supplied through `ASIO_ROOT`.

If Asio cannot be found, configuration stops with an error instead of silently disabling networking.

## Asio is header-only here

The module configures Asio with:

```text
ASIO_STANDALONE=1
```

No Boost.Asio dependency is required by the Async target.

On Linux and other non-Apple Unix systems, the Async target also links the required pthread support.

These platform details are propagated by `vix::async`; application CMake files should not duplicate them.

## Build the module

A normal standalone CMake build is:

```bash
cmake -S . -B build
cmake --build build
```

If no build type is supplied for a single-configuration generator, the module defaults to:

```text
Debug
```

A Release build can be configured explicitly:

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release

cmake --build build
```

## Tests

Async tests are controlled by:

```cmake
ASYNC_BUILD_TESTS
```

The option defaults to:

```text
ON
```

Configure without tests when only the library is needed:

```bash
cmake -S . -B build \
  -DASYNC_BUILD_TESTS=OFF
```

With tests enabled:

```bash
cmake -S . -B build
cmake --build build
ctest --test-dir build
```

The stabilized test suite currently defines ten CTest tests covering:

```text
tasks
cancellation
scheduler
when_all / when_any
timers
thread pool
signals
io_context
network cancellation
network smoke behavior
```

## Examples

Examples are controlled independently by:

```cmake
ASYNC_BUILD_EXAMPLES
```

They are disabled by default.

Enable them with:

```bash
cmake -S . -B build \
  -DASYNC_BUILD_EXAMPLES=ON

cmake --build build
```

The current examples include:

```text
hello task
signal stop
timer
thread pool
when_all / when_any
TCP echo server
```

Each example links only against:

```cmake
vix::async
```

for the Async module itself.

## Warnings as errors

For stricter module development builds, enable:

```cmake
ASYNC_WARNINGS_AS_ERRORS
```

with:

```bash
cmake -S . -B build \
  -DASYNC_WARNINGS_AS_ERRORS=ON
```

This turns the warning policy configured by the module into build errors.

It is useful for validating Async itself. Consumers linking the installed target do not need to enable this option to use the library.

## AddressSanitizer and UBSan

Async provides a module development option for AddressSanitizer and UndefinedBehaviorSanitizer:

```cmake
ASYNC_ENABLE_SANITIZERS
```

Enable it with:

```bash
cmake -S . -B build \
  -DASYNC_ENABLE_SANITIZERS=ON

cmake --build build
ctest --test-dir build
```

The exact compiler flags are selected by the module helper according to compiler support.

This option is intended for validating the library, tests, and examples built in the same tree.

## ThreadSanitizer

Concurrency can be checked separately with:

```cmake
ASYNC_ENABLE_TSAN
```

For example:

```bash
cmake -S . -B build \
  -DASYNC_ENABLE_TSAN=ON

cmake --build build
ctest --test-dir build
```

Do not enable ThreadSanitizer together with incompatible sanitizer combinations unless the compiler and platform explicitly support that configuration.

The stabilized Async runtime has been validated with its ThreadSanitizer configuration.

## mold

On Linux, module development builds can request the mold linker:

```cmake
ASYNC_USE_MOLD
```

Enable it with:

```bash
cmake -S . -B build \
  -DASYNC_USE_MOLD=ON
```

If `mold` is available, CMake adds:

```text
-fuse-ld=mold
```

If it is not installed, configuration continues without it and reports that the requested linker was not found.

Using mold is a build-time optimization. It does not change the Async public API or runtime behavior.

## Build options

The current module options are:

| Option                     | Default | Purpose                                            |
| -------------------------- | ------- | -------------------------------------------------- |
| `ASYNC_BUILD_TESTS`        | `ON`    | Build the Async test suite.                        |
| `ASYNC_BUILD_EXAMPLES`     | `OFF`   | Build Async examples.                              |
| `ASYNC_WARNINGS_AS_ERRORS` | `OFF`   | Treat configured compiler warnings as errors.      |
| `ASYNC_ENABLE_SANITIZERS`  | `OFF`   | Enable AddressSanitizer and UBSan where supported. |
| `ASYNC_ENABLE_TSAN`        | `OFF`   | Enable ThreadSanitizer where supported.            |
| `ASYNC_USE_MOLD`           | `OFF`   | Use mold when available on Linux.                  |

These options configure development of the module itself. They are not runtime Async settings.

## Install the standalone package

A standalone build can be installed with normal CMake installation:

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release

cmake --build build

cmake --install build \
  --prefix /path/to/prefix
```

The installation contains:

```text
include/vix/async.hpp
include/vix/async/...
lib/libvix_async...
lib/cmake/async/asyncConfig.cmake
lib/cmake/async/asyncConfigVersion.cmake
lib/cmake/async/asyncTargets.cmake
```

The exact library directory follows `GNUInstallDirs` and can therefore vary by platform or installation configuration.

## Find a custom installation

If Async was installed to a non-system prefix:

```text
/opt/vix
```

a consumer can point CMake at that prefix:

```bash
cmake -S . -B build \
  -DCMAKE_PREFIX_PATH=/opt/vix
```

Then:

```cmake
find_package(async CONFIG REQUIRED)
```

can locate the installed package.

The consumer still links:

```cmake
vix::async
```

## A complete consumer example

`CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.20)

project(async_example LANGUAGES CXX)

find_package(async CONFIG REQUIRED)

add_executable(async_example
  main.cpp
)

target_link_libraries(async_example
  PRIVATE
    vix::async
)
```

`main.cpp`:

```cpp
#include <chrono>
#include <vix/async.hpp>

using namespace std::chrono_literals;
using namespace vix::async::core;

task<void> run(io_context& ctx)
{
  co_await ctx.timers().sleep_for(100ms);

  ctx.stop();
}

int main()
{
  io_context ctx;

  std::move(run(ctx)).start(
    ctx.get_scheduler()
  );

  ctx.run();

  return 0;
}
```

Configure and build:

```bash
cmake -S . -B build
cmake --build build
```

No internal Async source directory, Asio target, pthread target, or implementation library name needs to appear in the consumer project.

The public dependency is:

```cmake
vix::async
```

## CMake model

The intended dependency relationship is:

```text
application
    ↓
vix::async
    ↓
public Async headers
C++20 requirement
platform threading requirements
Asio networking requirements
Async library
```

Consumers depend on the public target.

The target owns the details required to compile and link the module correctly.

## Next step

Continue with [API Reference](./api-reference) for a compact map of the public Async types and operations.

Then read:

- [Quick Start](./quick-start)
- [Networking](./networking)
- [Thread Pool](./thread-pool)
