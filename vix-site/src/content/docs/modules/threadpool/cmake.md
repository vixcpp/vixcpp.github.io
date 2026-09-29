# CMake

The ThreadPool module provides a CMake package and an exported target for use from CMake projects.

The installed target is:

```cmake id="m41qlh"
vix::threadpool
```

A minimal project needs:

```cmake id="a5f27m"
find_package(vix_threadpool CONFIG REQUIRED)

target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

The target carries the ThreadPool include directory, C++20 requirement, and native thread dependency.

## Minimal project

Given:

```text id="m33wib"
my-app/
├── CMakeLists.txt
└── main.cpp
```

`CMakeLists.txt` can be:

```cmake id="rfutfg"
cmake_minimum_required(VERSION 3.20)

project(my_app LANGUAGES CXX)

find_package(vix_threadpool CONFIG REQUIRED)

add_executable(my_app
  main.cpp
)

target_link_libraries(my_app
  PRIVATE
    vix::threadpool
)
```

Then:

```cpp id="4j8n54"
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

The application does not need to manually add ThreadPool include directories or thread linker flags.

## Package name and target name

The standalone installed CMake package is named:

```text id="7yyw2g"
vix_threadpool
```

Therefore use:

```cmake id="bj2s0n"
find_package(vix_threadpool CONFIG REQUIRED)
```

The imported library target is:

```text id="az1xjl"
vix::threadpool
```

Therefore link with:

```cmake id="l1xf4s"
target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

These names serve different purposes:

```text id="34klbi"
vix_threadpool
      ↓
CMake package name


vix::threadpool
      ↓
CMake target used by consumers
```

## Do not link the archive manually

An installed standalone package contains a static library such as:

```text id="ypgtym"
lib/libvix_threadpool.a
```

Application CMake files should not normally link that path directly.

Avoid:

```cmake id="ab23nm"
target_link_libraries(app
  PRIVATE
    /some/path/libvix_threadpool.a
)
```

Prefer:

```cmake id="sc65fp"
find_package(vix_threadpool CONFIG REQUIRED)

target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

The imported target carries the package's usage requirements.

## C++20

ThreadPool requires C++20.

The CMake target exports:

```cmake id="61o25t"
cxx_std_20
```

as a public compile feature.

When an application links:

```cmake id="p4zw95"
target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

CMake knows that the consumer must support C++20.

You can also state the application's own requirement explicitly:

```cmake id="vw2r46"
target_compile_features(app
  PRIVATE
    cxx_std_20
)
```

This is useful when C++20 is a direct requirement of the application itself.

## Minimum CMake version

The ThreadPool standalone project declares:

```cmake id="c9j7q2"
cmake_minimum_required(VERSION 3.20)
```

and the module manifest also specifies:

```text id="ty9qxy"
minimum CMake version: 3.20
```

Use CMake 3.20 or newer when building the module itself.

A consumer project can choose its own minimum version according to the rest of its build, but using CMake 3.20 or newer keeps it aligned with the ThreadPool module.

## Native thread dependency

ThreadPool uses CMake's standard threads package:

```cmake id="e1sdf3"
find_package(Threads REQUIRED)
```

The library links publicly to:

```cmake id="u9f5kn"
Threads::Threads
```

The installed package config also contains:

```cmake id="npm9og"
include(CMakeFindDependencyMacro)

find_dependency(Threads REQUIRED)
```

Therefore consumer projects do not need to repeat:

```cmake id="4xqzh7"
find_package(Threads REQUIRED)
```

just to satisfy ThreadPool.

This is handled by:

```cmake id="wrswct"
find_package(vix_threadpool CONFIG REQUIRED)
```

## Transitive thread linking

The exported target contains:

```text id="hnq97j"
INTERFACE_LINK_LIBRARIES = Threads::Threads
```

Therefore:

```cmake id="mqw05o"
target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

also gives the application the native thread-linking requirements needed by the module.

On platforms where additional thread flags are required, CMake's `Threads::Threads` target handles them.

Do not manually add platform-specific flags such as:

```text id="jxj19x"
-pthread
```

when using the exported CMake target unless the application independently requires custom handling.

## Include directories

The target exports the module's installed include directory.

After installation, headers are available under:

```text id="7s8deu"
include/vix/threadpool/
```

For example:

```text id="o821tx"
include/vix/threadpool/ThreadPool.hpp
include/vix/threadpool/Future.hpp
include/vix/threadpool/TaskOptions.hpp
include/vix/threadpool/ParallelFor.hpp
include/vix/threadpool/all.hpp
```

Consumer code can therefore write:

```cpp id="r7udld"
#include <vix/threadpool/all.hpp>
```

without adding a manual include path.

## Umbrella header

For general ThreadPool use, include:

```cpp id="dp31ng"
#include <vix/threadpool/all.hpp>
```

This is the ThreadPool module umbrella header installed by the standalone package.

For narrower compilation dependencies, individual public headers can also be included:

```cpp id="ksu9r5"
#include <vix/threadpool/ThreadPool.hpp>
#include <vix/threadpool/Future.hpp>
```

Both styles use the include directory exported by `vix::threadpool`.

## Installed package layout

A standalone installation has the effective structure:

```text id="hxmvbr"
<prefix>/
├── include/
│   └── vix/
│       └── threadpool/
│           ├── all.hpp
│           ├── ThreadPool.hpp
│           ├── Future.hpp
│           └── ...
├── lib/
│   ├── libvix_threadpool.a
│   └── cmake/
│       └── vix_threadpool/
│           ├── vix_threadpoolConfig.cmake
│           ├── vix_threadpoolConfigVersion.cmake
│           ├── vix_threadpoolTargets.cmake
│           └── vix_threadpoolTargets-<config>.cmake
```

The exact library directory can depend on the platform and `GNUInstallDirs`.

Applications should rely on `find_package()` rather than hard-coding this layout.

## Static library

The current ThreadPool source tree contains implementation `.cpp` files.

The standalone build therefore creates:

```cmake id="el5y3g"
add_library(vix_threadpool STATIC ...)
```

and exports it to consumers as:

```text id="rdr28d"
vix::threadpool
```

The installed artifact is consequently a static library on the current module build.

The module manifest also describes its library type as:

```text id="39q2ak"
static
```

## Source target and namespaced alias

Inside the ThreadPool source build, the actual CMake target is:

```text id="0hi9ub"
vix_threadpool
```

The project creates the namespaced alias:

```cmake id="62b9yx"
add_library(vix::threadpool ALIAS vix_threadpool)
```

Application code should normally depend on:

```text id="07fi6t"
vix::threadpool
```

rather than the implementation target name.

This keeps source-tree and installed-package usage consistent.

## Add ThreadPool with `add_subdirectory`

When the ThreadPool source is directly part of another CMake source tree, it can be added with:

```cmake id="2bjbyt"
add_subdirectory(path/to/threadpool)

target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

For example:

```text id="h0mxuw"
my-project/
├── CMakeLists.txt
├── app/
│   └── main.cpp
└── external/
    └── threadpool/
        ├── CMakeLists.txt
        ├── include/
        └── src/
```

The root build can contain:

```cmake id="47tpqt"
cmake_minimum_required(VERSION 3.20)

project(my_project LANGUAGES CXX)

add_subdirectory(external/threadpool)

add_executable(app
  app/main.cpp
)

target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

No `find_package(vix_threadpool)` is needed in this form because the target is created directly by `add_subdirectory()`.

## Installed package vs source tree

Use:

```cmake id="7fxnwv"
find_package(vix_threadpool CONFIG REQUIRED)
```

when ThreadPool has already been installed as a package.

Use:

```cmake id="i7p2bx"
add_subdirectory(...)
```

when the ThreadPool source tree is directly included in the current CMake build.

Both forms expose the same consumer target:

```text id="3ho34r"
vix::threadpool
```

This is the main CMake integration contract.

## Building ThreadPool standalone

From the module source directory:

```bash id="7jwl9s"
cmake -S . -B build
cmake --build build
```

The default build creates the ThreadPool library.

The project options for:

```text id="ry7r9f"
examples
tests
benchmarks
```

are disabled by default.

## Install the standalone package

A normal installation can be created with:

```bash id="9r7qov"
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/desired/prefix

cmake --build build
cmake --install build
```

This installs:

```text id="ui689b"
library
public headers
CMake package config
CMake version file
exported target files
```

under the selected prefix.

## Custom installation prefix

For example:

```bash id="7agcwj"
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX="$HOME/.local"

cmake --build build
cmake --install build
```

The package is then installed below:

```text id="fh350p"
$HOME/.local
```

A consumer must make that prefix discoverable by CMake when it is outside the normal search paths.

## `CMAKE_PREFIX_PATH`

One way to expose a custom installation is:

```bash id="cx793l"
cmake -S . -B build \
  -DCMAKE_PREFIX_PATH="$HOME/.local"
```

The consumer can then use the normal:

```cmake id="4ilmed"
find_package(vix_threadpool CONFIG REQUIRED)
```

You can also provide multiple package prefixes through the normal CMake `CMAKE_PREFIX_PATH` mechanism.

## Direct package directory

CMake can also be pointed directly to the package directory:

```bash id="2fjkv6"
cmake -S . -B build \
  -Dvix_threadpool_DIR=/prefix/lib/cmake/vix_threadpool
```

That directory must contain:

```text id="32krt2"
vix_threadpoolConfig.cmake
```

This is useful for debugging package discovery, but a prefix-based configuration is usually easier to move between environments.

## Package configuration

The installed package configuration performs three main operations:

```cmake id="vyq953"
include(CMakeFindDependencyMacro)

find_dependency(Threads REQUIRED)

include(
  "${CMAKE_CURRENT_LIST_DIR}/vix_threadpoolTargets.cmake"
)
```

It then calls:

```cmake id="xxjmc9"
check_required_components(vix_threadpool)
```

The exported targets file defines:

```text id="523azt"
vix::threadpool
```

as the imported target.

## Exported target properties

The installed `vix::threadpool` target exports the important consumer requirements:

```text id="pzn266"
target type:
  STATIC IMPORTED

compile feature:
  cxx_std_20

include directory:
  <install-prefix>/include

link dependency:
  Threads::Threads
```

The physical library location is provided by the configuration-specific exported target file.

Consumers should use those target properties through `target_link_libraries()` rather than reproducing them manually.

## Package version

The standalone ThreadPool CMake project currently declares:

```cmake id="cxtbja"
project(
  vix_threadpool
  VERSION 0.1.0
  LANGUAGES CXX
)
```

The generated package version file uses:

```cmake id="0pb2pg"
COMPATIBILITY SameMajorVersion
```

Therefore version-aware discovery is supported.

For example:

```cmake id="uw0s7b"
find_package(
  vix_threadpool 0.1
  CONFIG
  REQUIRED
)
```

asks CMake for a package version compatible with that requested version under the generated same-major-version policy.

For most applications that only need the installed ThreadPool package, this remains sufficient:

```cmake id="0csj0m"
find_package(vix_threadpool CONFIG REQUIRED)
```

## Build examples

Examples are disabled by default.

Enable them with:

```bash id="r41gh0"
cmake -S . -B build \
  -DVIX_THREADPOOL_BUILD_EXAMPLES=ON

cmake --build build
```

The option is:

```cmake id="4fdxef"
VIX_THREADPOOL_BUILD_EXAMPLES
```

with default value:

```text id="6wk1h1"
OFF
```

## Example targets

The module's example build currently includes programs for:

```text id="2q1sav"
basic_post
custom_config
metrics
parallel_for
parallel_for_each
parallel_map
parallel_reduce
periodic_task
shutdown
submit_future
task_cancellation
task_group
task_priority
task_timeout
```

Each example links:

```cmake id="2cogkv"
target_link_libraries(example
  PRIVATE
    vix::threadpool
)
```

and requests:

```cmake id="dd5c3h"
cxx_std_20
```

## Build tests

Tests are disabled by default.

Enable them with:

```bash id="fqb952"
cmake -S . -B build \
  -DVIX_THREADPOOL_BUILD_TESTS=ON
```

The option is:

```cmake id="gcocjw"
VIX_THREADPOOL_BUILD_TESTS
```

with default:

```text id="2evr08"
OFF
```

When enabled, the root module build performs:

```cmake id="jfpmax"
include(CTest)
enable_testing()
add_subdirectory(tests)
```

when the tests directory is available.

## Build benchmarks

Benchmarks are also disabled by default.

Enable them with:

```bash id="211gz2"
cmake -S . -B build \
  -DVIX_THREADPOOL_BUILD_BENCHMARKS=ON
```

The option is:

```cmake id="65inhj"
VIX_THREADPOOL_BUILD_BENCHMARKS
```

with default:

```text id="h129fj"
OFF
```

## Enable several development targets

For local module development:

```bash id="1vh2qk"
cmake -S . -B build \
  -DVIX_THREADPOOL_BUILD_EXAMPLES=ON \
  -DVIX_THREADPOOL_BUILD_TESTS=ON \
  -DVIX_THREADPOOL_BUILD_BENCHMARKS=ON
```

Then:

```bash id="672kr1"
cmake --build build
```

These options affect development artifacts.

They are not required by applications consuming `vix::threadpool`.

## Compiler warnings

When the module itself is compiled with a non-MSVC compiler, its CMake build enables:

```text id="lc88f5"
-Wall
-Wextra
-Wpedantic
```

for the ThreadPool target.

These options are:

```cmake id="9gtjn1"
PRIVATE
```

Therefore they do not propagate to consumer targets.

An application chooses its own warning configuration independently.

## Position-independent code

The module build sets:

```cmake id="dzbf4i"
CMAKE_POSITION_INDEPENDENT_CODE ON
```

for its build.

This affects how the ThreadPool library is compiled but does not require consumer projects to copy that setting merely to link the library.

## Sanitizer integration

The module source CMake contains support for:

```cmake id="pzmj13"
VIX_ENABLE_SANITIZERS
```

on non-MSVC builds.

When that surrounding option is enabled, the ThreadPool target adds:

```text id="mxpcdi"
-fno-omit-frame-pointer
-fsanitize=address,undefined
```

for compilation and:

```text id="12ogb9"
-fsanitize=address,undefined
```

for linking.

`VIX_ENABLE_SANITIZERS` is not declared as a ThreadPool-specific option in this module.

The ThreadPool build only reacts to it when the variable is already enabled by the surrounding build.

## ThreadPool-specific options

The standalone module declares three ThreadPool-specific CMake options:

| Option                            | Default | Purpose                   |
| --------------------------------- | ------- | ------------------------- |
| `VIX_THREADPOOL_BUILD_EXAMPLES`   | `OFF`   | Build example executables |
| `VIX_THREADPOOL_BUILD_TESTS`      | `OFF`   | Build tests               |
| `VIX_THREADPOOL_BUILD_BENCHMARKS` | `OFF`   | Build benchmarks          |

They do not change the public runtime API or consumer target name.

## No external library dependency beyond threads

The module manifest currently declares:

```text id="cznsib"
deps = []
```

At the CMake level, the runtime's explicit platform dependency is:

```cmake id="c4yfx0"
Threads::Threads
```

There is no required Boost, fmt, or other external C++ package in the standalone ThreadPool target.

Consumer dependency discovery is therefore:

```text id="e1si2c"
vix_threadpool
      ↓
Threads
```

for the current standalone package.

## Standalone export

When ThreadPool is built outside the Vix umbrella build, its installation exports:

```text id="mjqph6"
vix_threadpoolTargets
```

to:

```text id="gem9p9"
lib/cmake/vix_threadpool
```

with:

```cmake id="ru52hb"
NAMESPACE vix::
```

and the library's export name is:

```text id="g37xix"
threadpool
```

Those pieces combine to produce the installed target:

```text id="yd3y2t"
vix::threadpool
```

## Umbrella build

The module also supports being built as part of the larger Vix source tree.

When:

```cmake id="14douk"
VIX_UMBRELLA_BUILD
```

is enabled, ThreadPool uses the umbrella export set:

```text id="3ni6a2"
VixTargets
```

instead of installing its own standalone:

```text id="br8wcf"
vix_threadpoolTargets
```

export.

In this mode, standalone ThreadPool package configuration files are not generated by this module.

The owning Vix build is responsible for its package export.

The target available inside the build remains:

```text id="442189"
vix::threadpool
```

## Standalone headers vs umbrella installation

In standalone mode, ThreadPool installs its public headers itself:

```text id="o4f8w4"
include/vix/threadpool/
```

When built under:

```text id="nb0moz"
VIX_UMBRELLA_BUILD
```

the module skips its own header-directory installation step.

Header installation is then handled by the surrounding Vix build.

This avoids duplicate installation logic between the module and the umbrella package.

## Do not depend on internal export-set names

Application projects should not use:

```text id="d2i1se"
vix_threadpoolTargets
VixTargets
```

directly.

Those are package-generation details.

Consumer code should depend only on the public target:

```text id="pg67yu"
vix::threadpool
```

## Recommended installed-package CMake

For a normal standalone installed package:

```cmake id="s7igps"
cmake_minimum_required(VERSION 3.20)

project(my_app LANGUAGES CXX)

find_package(vix_threadpool CONFIG REQUIRED)

add_executable(my_app
  main.cpp
)

target_link_libraries(my_app
  PRIVATE
    vix::threadpool
)
```

No additional ThreadPool CMake configuration is required.

## Multiple application source files

A normal larger application works in the same way:

```cmake id="kdb4mp"
cmake_minimum_required(VERSION 3.20)

project(server LANGUAGES CXX)

find_package(vix_threadpool CONFIG REQUIRED)

add_executable(server
  src/main.cpp
  src/Service.cpp
  src/JobProcessor.cpp
)

target_link_libraries(server
  PRIVATE
    vix::threadpool
)

target_compile_features(server
  PRIVATE
    cxx_std_20
)
```

Application headers can then use ThreadPool normally:

```cpp id="ej2wzh"
#include <vix/threadpool/ThreadPool.hpp>
```

or:

```cpp id="37x35t"
#include <vix/threadpool/all.hpp>
```

## Link through another library

If an application library exposes ThreadPool types in its public interface:

```cmake id="ufdk04"
add_library(job_runtime
  src/JobRuntime.cpp
)

target_link_libraries(job_runtime
  PUBLIC
    vix::threadpool
)
```

then consumers of `job_runtime` inherit the ThreadPool usage requirements.

If ThreadPool appears only inside implementation files:

```cmake id="b73kj4"
target_link_libraries(job_runtime
  PRIVATE
    vix::threadpool
)
```

is usually more appropriate.

Choose `PUBLIC` or `PRIVATE` according to the application's own CMake interface design.

## Troubleshooting package discovery

If CMake reports that it cannot find:

```text id="wzyrw8"
vix_threadpoolConfig.cmake
```

first verify that ThreadPool was installed.

The package should contain a directory resembling:

```text id="fh72m3"
<prefix>/lib/cmake/vix_threadpool/
```

Then configure the consumer with the installation prefix:

```bash id="d6ecsf"
cmake -S . -B build \
  -DCMAKE_PREFIX_PATH=/prefix
```

or the exact package directory:

```bash id="bka516"
cmake -S . -B build \
  -Dvix_threadpool_DIR=/prefix/lib/cmake/vix_threadpool
```

## Troubleshooting missing target

After a successful:

```cmake id="1428pr"
find_package(vix_threadpool CONFIG REQUIRED)
```

this target should exist:

```cmake id="ozbx4r"
if (NOT TARGET vix::threadpool)
  message(FATAL_ERROR "vix::threadpool target is unavailable")
endif()
```

If it does not exist, the package installation or exported target files are incomplete or inconsistent.

The current standalone package configuration explicitly includes:

```text id="plgyah"
vix_threadpoolTargets.cmake
```

which defines that imported target.

## Troubleshooting missing library file

The generated imported target configuration refers to the installed static archive.

If CMake reports that:

```text id="c8b8zc"
vix::threadpool
```

references a library file that does not exist, the package installation is incomplete.

Reinstall the module rather than manually editing the generated target files:

```bash id="c94c1t"
cmake --build build
cmake --install build
```

The exported CMake files include validation for referenced installed artifacts.

## Troubleshooting C++ standard errors

If compiler errors indicate missing C++20 language features, verify:

```text id="rlvkfb"
compiler supports C++20
```

and that the application actually links the exported target:

```cmake id="jycbcg"
target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

The target carries:

```text id="tzoazo"
cxx_std_20
```

as an interface compile feature.

## Verified standalone consumer contract

The standalone package has been validated with the following consumer pattern:

```cmake id="020obe"
find_package(vix_threadpool CONFIG REQUIRED)

target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

and:

```cpp id="afh1js"
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(2);

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

The installed package provides the include path, static library, C++20 requirement, and `Threads::Threads` dependency required by the consumer.

## CMake integration summary

The installed integration path is:

```text id="f1lfng"
install vix_threadpool
        ↓
vix_threadpoolConfig.cmake
        ↓
find_dependency(Threads)
        ↓
vix_threadpoolTargets.cmake
        ↓
vix::threadpool
        ↓
consumer target
```

The important properties are:

- The standalone package name is `vix_threadpool`.
- Use `find_package(vix_threadpool CONFIG REQUIRED)` for an installed standalone package.
- The public consumer target is `vix::threadpool`.
- The source-tree target is `vix_threadpool` with the alias `vix::threadpool`.
- Prefer the namespaced target in consumer code.
- The current module builds as a static library because implementation sources are present.
- The current standalone library artifact is `libvix_threadpool.a` on the validated Unix-like installation.
- The target requires C++20.
- The target exports its public include directory.
- The target publicly links `Threads::Threads`.
- The installed package resolves the Threads dependency automatically with `find_dependency()`.
- Public headers are installed under `include/vix/threadpool/`.
- `<vix/threadpool/all.hpp>` is the module umbrella header.
- The module itself requires CMake 3.20 or newer.
- Standalone package versioning currently uses version `0.1.0` with `SameMajorVersion` compatibility.
- `add_subdirectory()` can be used when the ThreadPool source tree is directly part of another CMake build.
- Both installed and source-tree usage expose `vix::threadpool`.
- Examples, tests, and benchmarks are disabled by default.
- Their options are `VIX_THREADPOOL_BUILD_EXAMPLES`, `VIX_THREADPOOL_BUILD_TESTS`, and `VIX_THREADPOOL_BUILD_BENCHMARKS`.
- `VIX_ENABLE_SANITIZERS` is consumed when supplied by a surrounding build, but is not declared as a ThreadPool-specific option.
- The module has no additional required C++ package dependency beyond the platform thread abstraction represented by `Threads::Threads`.
- Standalone installation exports `vix_threadpoolTargets`.
- Umbrella builds instead participate in `VixTargets`.
- Standalone package config generation and standalone header installation are skipped when `VIX_UMBRELLA_BUILD` is active.
- Consumer projects should not depend directly on export-set names or physical library paths.

Continue with [API Reference](/modules/threadpool/api-reference) for a compact index of the public ThreadPool types, functions, enums, and headers.
