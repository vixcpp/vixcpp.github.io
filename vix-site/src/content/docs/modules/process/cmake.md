# CMake

The `process` module is used like the other Vix modules: include the public process header in C++ code and link the CMake target `vix::process`. The module provides portable process spawning, waiting, status checks, output capture, termination, two-stage pipelines, and async process helpers.

Most applications should link only the public module target. The target carries the module’s public dependencies, so consumers do not need to link the internal dependency graph manually.

## Header

Use the public process header in normal application code:

```cpp id="w37pdr"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="jh6k6h"
#include <vix/print.hpp>
```

The module also exposes direct headers under `<vix/process/...>`, but application code should normally use the public entry point.

## Link the process module

For an application target, link `vix::process`.

```cmake id="davzkt"
cmake_minimum_required(VERSION 3.20)

project(my_process_app LANGUAGES CXX)

add_executable(my_process_app
  src/main.cpp
)

target_compile_features(my_process_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

The application can then use the process API normally.

```cpp id="wij5yt"
#include <vix/process.hpp>

int main()
{
  vix::process::Command command("git");
  command.arg("--version");

  auto result = vix::process::output(command);

  return result && result.value().success() ? 0 : 1;
}
```

## Compile standard

The process module is built with C++20. Consuming targets should also use C++20 or newer.

```cmake id="ty0vl4"
target_compile_features(my_process_app
  PRIVATE
    cxx_std_20
)
```

This keeps the application consistent with the public module headers and with the rest of the Vix module ecosystem.

## Public target

The module exposes this consumer target:

```txt id="t7g8ti"
vix::process
```

Internally, the real target is named `vix_process`, and the namespaced target is provided as an alias. Application code should link the namespaced target.

```cmake id="tqv9uu"
target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

Using the namespaced target keeps the consuming project independent from the internal target name.

## Public dependencies

The process target links these public dependencies:

```txt id="ed6w1b"
vix::error
vix::env
vix::path
vix::async
```

`vix::error` is used by the result and error model. `vix::async` is required because the process module exposes coroutine-based process helpers in its public API. `vix::env` and `vix::path` are part of the module’s public dependency set and are resolved by the module build.

Consumers should normally link `vix::process` only:

```cmake id="ke2ifs"
target_link_libraries(my_tool
  PRIVATE
    vix::process
)
```

The process target then carries the include paths and link requirements needed by its public API.

## Use inside another Vix module

When another Vix module uses process only in implementation files, link it privately.

```cmake id="ms7izp"
target_link_libraries(my_module
  PRIVATE
    vix::process
)
```

Use `PUBLIC` only when the module’s public headers expose process types.

```cpp id="yp0dkm"
#pragma once

#include <vix/process.hpp>

vix::process::ProcessOutputResult
run_tool(vix::process::Command command);
```

```cmake id="xcq1cw"
target_link_libraries(my_module
  PUBLIC
    vix::process
)
```

The visibility should match the public API of the consuming target. If a public header mentions `vix::process::Command`, `Child`, `ProcessOutput`, `SpawnResult`, or another process type, the dependency should be public.

## Umbrella build

When the module is built inside the Vix umbrella build, dependencies are expected to be provided by the umbrella project before the process module is configured.

In that mode, the process module does not fetch or add sibling dependencies by itself. It expects targets such as `vix::error`, `vix::env`, `vix::path`, and `vix::async` to already exist.

```txt id="rpwr8h"
VIX_UMBRELLA_BUILD=ON
```

In an umbrella build, the process target is installed into the shared Vix export set:

```txt id="bux2pj"
VixTargets
```

This keeps module dependency order controlled by the main Vix build instead of by each module individually.

## Standalone build

When the module is built outside the umbrella build, it can resolve several dependencies from sibling modules, installed packages, or FetchContent depending on the dependency.

The standalone export set is:

```txt id="mb77p6"
vix_processTargets
```

The standalone package files are installed under the module package directory and expose the namespaced target to consumers.

A standalone consumer can use the installed package when available:

```cmake id="tjmcex"
cmake_minimum_required(VERSION 3.20)

project(process_consumer LANGUAGES CXX)

find_package(vix_process CONFIG REQUIRED)

add_executable(process_consumer
  src/main.cpp
)

target_compile_features(process_consumer
  PRIVATE
    cxx_std_20
)

target_link_libraries(process_consumer
  PRIVATE
    vix::process
)
```

The exact dependency discovery path depends on how the Vix modules are installed or arranged in the source tree.

## Dependency options

The module exposes dependency options for standalone builds.

```txt id="gk2iqb"
VIX_PROCESS_FETCH_ERROR
VIX_PROCESS_FETCH_ENV
VIX_PROCESS_FETCH_PATH
VIX_PROCESS_FETCH_TESTS
VIX_PROCESS_FETCH_ASYNC
```

The current build logic can fetch `vix::error`, `vix::env`, `vix::path`, and `vix::tests` when the matching option is enabled and the target is not already available. The async dependency is required by the process module; in the current CMake flow, standalone builds should provide `vix::async` through a sibling module or installed package before the process target can be configured.

For normal Vix development, prefer the umbrella build so dependency order and versions are controlled in one place.

## Static or interface mode

The module discovers implementation files under `src/*.cpp`.

```txt id="qg2kpt"
src/
  async/
  pipeline/
  platform/
  Child.cpp
  Command.cpp
  Kill.cpp
  Output.cpp
  Spawn.cpp
  Status.cpp
  Terminate.cpp
  Wait.cpp
```

When sources are present, the module builds a static library.

```txt id="ojosnj"
Mode: STATIC / sources found
```

When no source files are present, the module can fall back to an interface target.

```txt id="hfpj6s"
Mode: HEADER-ONLY / no sources
```

In the normal module layout, sources are present, so consumers should expect a compiled process library.

## Windows system library

On Windows, the process target links `kernel32` privately.

```cmake id="ki2de7"
target_link_libraries(vix_process
  PRIVATE
    kernel32
)
```

This is an implementation detail of the module target. Consumers still link only `vix::process`.

```cmake id="mm43xe"
target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

## Example application

A small process application can keep its structure simple.

```txt id="zwouda"
my_process_app/
  CMakeLists.txt
  src/
    main.cpp
```

`CMakeLists.txt`:

```cmake id="iylkjk"
cmake_minimum_required(VERSION 3.20)

project(my_process_app LANGUAGES CXX)

add_executable(my_process_app
  src/main.cpp
)

target_compile_features(my_process_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

`src/main.cpp`:

```cpp id="lvyq5d"
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello from process");
#else
  vix::process::Command command("echo");
  command.arg("hello from process");
#endif

  auto result = vix::process::output(command);

  return result && result.value().success() ? 0 : 1;
}
```

This example uses `output()` because it is the simplest command-to-result workflow.

## Example with spawn and wait

The CMake setup does not change when the application uses the lower-level lifecycle API.

```cpp id="z1gv6f"
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("exit 0");
#else
  vix::process::Command command("true");
#endif

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    return 1;
  }

  auto waited = vix::process::wait(spawned.value());

  if (!waited)
  {
    return 1;
  }

  return waited.value() == 0 ? 0 : 1;
}
```

The target still links only `vix::process`.

```cmake id="s36diu"
target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

## Example with async process APIs

The async APIs are part of the process module’s public surface. Because `vix::async` is a public dependency of `vix::process`, an application that links `vix::process` can use the async process helpers.

```cpp id="zyxz7v"
#include <utility>

#include <vix/async/async.hpp>
#include <vix/process.hpp>

vix::async::core::task<void>
run(vix::async::core::io_context &ctx)
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello from async process");
#else
  vix::process::Command command("echo");
  command.arg("hello from async process");
#endif

  auto out = co_await vix::process::async::output(
    ctx,
    std::move(command)
  );

  (void)out;

  ctx.stop();
  co_return;
}

int main()
{
  vix::async::core::io_context ctx;

  vix::async::core::spawn_detached(ctx, run(ctx));

  ctx.run();

  return 0;
}
```

The CMake target remains the same:

```cmake id="kib0kn"
target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

The process module carries the async dependency because the async process headers are part of the public module API.

## Tests

The process module has an optional test build.

```txt id="xlymqc"
VIX_PROCESS_BUILD_TESTS
```

Enable it when configuring the module:

```bash id="xjcypl"
cmake -S . -B build -DVIX_PROCESS_BUILD_TESTS=ON
cmake --build build
ctest --test-dir build
```

When tests are enabled, the module adds the `test` directory and requires `vix::tests`.

A test target that uses process should link `vix::process` like any other application target.

```cmake id="esaf2n"
add_executable(process_tests
  test/process_tests.cpp
)

target_compile_features(process_tests
  PRIVATE
    cxx_std_20
)

target_link_libraries(process_tests
  PRIVATE
    vix::process
)
```

Tests are especially useful for process code because behavior depends on platform process APIs, executable lookup, environment handling, and stream capture.

## Examples

The module can also build its example programs.

```txt id="hqj14a"
VIX_PROCESS_BUILD_EXAMPLES
```

Enable examples during configuration:

```bash id="b9b78i"
cmake -S . -B build -DVIX_PROCESS_BUILD_EXAMPLES=ON
cmake --build build
```

The examples are useful for checking common workflows such as basic spawn, output capture, status checks, termination, kill, pipelines, and async process operations.

## Sanitizers

The process target respects the parent sanitizer option on non-MSVC builds.

```txt id="mhj1tr"
VIX_ENABLE_SANITIZERS
```

When enabled, the module adds address and undefined-behavior sanitizer flags to the process target. This is useful while developing the module, especially around platform handles, pipes, process lifecycle state, and output capture.

```bash id="gvhlnd"
cmake -S . -B build -DVIX_ENABLE_SANITIZERS=ON
cmake --build build
```

## Installation

In a standalone build, the module installs its headers, package configuration files, and export target files. In an umbrella build, installation is coordinated through the umbrella Vix export set.

The installed consumer target remains:

```txt id="sizkm8"
vix::process
```

Application projects should depend on the target rather than on manually configured include directories or library paths.

## Public API surface

Linking `vix::process` gives access to the public process headers.

```txt id="ve4x3a"
<vix/process.hpp>
<vix/process/Process.hpp>
<vix/process/Command.hpp>
<vix/process/Child.hpp>
<vix/process/PipeMode.hpp>
<vix/process/ProcessOptions.hpp>
<vix/process/ProcessId.hpp>
<vix/process/ProcessResult.hpp>
<vix/process/ProcessError.hpp>
<vix/process/Spawn.hpp>
<vix/process/Output.hpp>
<vix/process/Status.hpp>
<vix/process/Wait.hpp>
<vix/process/Terminate.hpp>
<vix/process/Kill.hpp>
<vix/process/async/SpawnAsync.hpp>
<vix/process/async/OutputAsync.hpp>
<vix/process/async/WaitAsync.hpp>
<vix/process/pipeline/Pipeline.hpp>
<vix/process/pipeline/PipelineAsync.hpp>
```

For normal application code, prefer:

```cpp id="tmkbtk"
#include <vix/process.hpp>
```

Use direct headers only when a file intentionally depends on a narrow part of the module.

## Recommended project shape

A small project using the process module can use this structure:

```txt id="z56ltr"
my_process_app/
  CMakeLists.txt
  src/
    main.cpp
```

`CMakeLists.txt`:

```cmake id="z9nxdv"
cmake_minimum_required(VERSION 3.20)

project(my_process_app LANGUAGES CXX)

add_executable(my_process_app
  src/main.cpp
)

target_compile_features(my_process_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

`src/main.cpp`:

```cpp id="sbwacx"
#include <vix/process.hpp>

int main()
{
  vix::process::Command command("git");
  command.arg("--version");

  auto result = vix::process::output(command);

  return result && result.value().success() ? 0 : 1;
}
```

This keeps process integration focused. The build links the module target, while the application code decides which commands to run and how to handle their results.

## Common mistakes

Do not link the internal target name directly when `vix::process` is available. The namespaced target is the public CMake interface.

Do not link `vix::error`, `vix::env`, `vix::path`, or `vix::async` manually in normal application targets just because process uses them. Link `vix::process` and let the target carry its public requirements.

Do not use `PUBLIC` link visibility unless your public headers expose process types. `PRIVATE` is correct when process is only used in implementation files.

Do not forget that async process APIs require the async dependency to be available when the process module is configured.

Do not compile consuming targets with an older C++ standard. Use C++20 or newer.

## Next step

Continue with the API reference for a compact list of the public types, aliases, functions, and namespaces exposed by the process module.

```md id="orfr5l"
[API Reference](./api-reference.md)
```
