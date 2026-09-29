# CMake

The `cache` module is built as a normal Vix CMake module. It exposes the public target:

```cmake
vix::cache
```

The concrete target is:

```cmake
vix_cache
```

Applications and other Vix modules should link the public alias `vix::cache`. The internal target name exists for the module build itself, but consumers should prefer the namespaced target because it is the stable CMake surface.

## Public target

Link the cache module like this:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
)
```

If the program uses `vix::print`, link `vix::io` as well:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
    vix::io
)
```

`vix::io` is not required by the cache runtime itself. It is needed only by examples or applications that include `<vix/print.hpp>`.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The module also provides direct headers under `vix/cache/`, but application code should usually include the aggregator.

## C++ standard

The cache module requires C++20.

```cmake
target_compile_features(vix_cache
  PUBLIC
    cxx_std_20
)
```

A consuming target should also build with C++20 or newer.

```cmake
target_compile_features(my_app
  PRIVATE
    cxx_std_20
)
```

## Minimal application

A minimal application that uses the cache module can be configured like this:

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_cache_app LANGUAGES CXX)

add_executable(my_cache_app
  main.cpp
)

target_compile_features(my_cache_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_cache_app
  PRIVATE
    vix::cache
)
```

And the matching C++ file can start with:

```cpp
#include <memory>

#include <vix/cache.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;
  policy.ttl_ms = 10'000;

  vix::cache::Cache cache(policy, store);

  return 0;
}
```

## Example with printing

Most documentation examples use `vix::print`, so they need `vix::io`.

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_cache_app LANGUAGES CXX)

add_executable(my_cache_app
  main.cpp
)

target_compile_features(my_cache_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_cache_app
  PRIVATE
    vix::cache
    vix::io
)
```

Example `main.cpp`:

```cpp
#include <memory>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;
  policy.ttl_ms = 10'000;

  vix::cache::Cache cache(policy, store);

  vix::print("cache module linked");

  return 0;
}
```

## Module target

The module creates the `vix_cache` target and exposes it through the `vix::cache` alias.

```cmake
add_library(vix_cache STATIC ${CACHE_SOURCES})
add_library(vix::cache ALIAS vix_cache)
```

When no source files are found, the module can be configured as an interface target:

```cmake
add_library(vix_cache INTERFACE)
add_library(vix::cache ALIAS vix_cache)
```

In the current module, sources exist under `src/`, so the normal build mode is a static library.

```text
src/Cache.cpp
src/FileStore.cpp
src/MemoryStore.cpp
```

## Public dependencies

The cache module publicly depends on the Vix networking and JSON modules.

```cmake
target_link_libraries(vix_cache
  PUBLIC
    vix::net
    vix::json
)
```

These dependencies are public because cache headers and implementations use types from those modules. For example, the context mapper integrates with `vix::net::NetworkProbe`, and `FileStore` persists cache entries using JSON.

Consumers normally only need to link `vix::cache`. CMake carries the required public dependencies through the target graph.

## Include directories

The module exposes its include directory for build and install usage.

```cmake
target_include_directories(vix_cache
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:${CMAKE_INSTALL_INCLUDEDIR}>
)
```

This makes headers available with the normal include path:

```cpp
#include <vix/cache.hpp>
#include <vix/cache/Cache.hpp>
#include <vix/cache/MemoryStore.hpp>
```

## Umbrella build

When the cache module is built inside the Vix umbrella build, dependency resolution is controlled by the umbrella project.

In umbrella mode, the module should not fetch sibling dependencies by itself. The umbrella build owns the module order and provides the required targets.

```cmake
if (DEFINED VIX_UMBRELLA_BUILD AND VIX_UMBRELLA_BUILD)
  set(VIX_CACHE_FETCH_NET OFF CACHE BOOL "Auto-fetch vix::net if missing" FORCE)
endif()
```

This keeps the full Vix build predictable. If `vix::net` or `vix::json` is missing in umbrella mode, the correct fix is to make sure the umbrella build adds those modules before `cache`.

## Standalone build

When the module is built outside the umbrella build, it can resolve dependencies in several steps.

For the net dependency, the module tries:

```text
1. Existing targets: vix::net, vix_net, net
2. Local sibling module in ../net
3. Installed packages through find_package
4. Optional FetchContent when enabled
```

For the JSON dependency, the module tries:

```text
1. Existing targets: vix::json, vix_json, json
2. Local sibling module in ../json
3. Installed packages through find_package
```

This allows the module to work both as part of Vix and as a standalone package, while still preferring already available local targets.

## Fetch option

The cache module exposes a fetch option for the network dependency:

```cmake
VIX_CACHE_FETCH_NET
```

It is enabled by default for standalone builds and disabled in umbrella builds.

```cmake
option(VIX_CACHE_FETCH_NET "Auto-fetch vix::net if missing" ON)
```

The module does not treat dependency fetching as the first choice. It first reuses existing targets, then tries local sibling modules and installed packages. Fetching is the last resort for standalone builds.

## JSON dependency

The cache module depends on the Vix JSON module, not directly on raw `nlohmann_json` as a public CMake dependency.

The module resolves JSON through targets such as:

```text
vix::json
vix_json
json
```

This keeps the dependency model aligned with the rest of Vix. `FileStore` can use JSON internally while consumers link the Vix cache target normally.

## Build inside the Vix repository

From the Vix root, build the project normally:

```bash
cd ~/vixcpp/vix
vix build --build-target all -v
```

From the cache module directory:

```bash
cd ~/vixcpp/vix/modules/cache
vix build --build-target all -v
```

The module is still configured by CMake, but `vix build` keeps the workflow consistent with the rest of Vix.

## Build with CMake directly

A direct CMake build can be done with Ninja:

```bash
cmake -S . -B build-ninja -G Ninja
cmake --build build-ninja
```

This configures the module, resolves dependencies, and builds the `vix_cache` target.

## Build tests

Tests are disabled by default.

Enable cache tests with:

```bash
cmake -S . -B build-ninja -G Ninja -DVIX_CACHE_BUILD_TESTS=ON
cmake --build build-ninja
ctest --test-dir build-ninja --output-on-failure
```

The module exposes the option:

```cmake
VIX_CACHE_BUILD_TESTS
```

When enabled, the module adds the `tests` directory.

```cmake
option(VIX_CACHE_BUILD_TESTS "Build cache module tests" OFF)

if (VIX_CACHE_BUILD_TESTS)
  include(CTest)
  enable_testing()
  add_subdirectory(tests)
endif()
```

## Run smoke tests with Vix

The cache module includes smoke tests that can also be run through the Vix runner.

```bash
vix run modules/cache/tests/cache_smoke_test.cpp
vix run modules/cache/tests/cache_context_mapper_smoke_test.cpp
```

These tests cover core behavior such as memory caching, file persistence, LRU eviction, header normalization, cache keys, pruning, offline reuse, and network-error fallback.

## Install headers

In standalone mode, the module installs its public headers.

```cmake
install(DIRECTORY include/
  DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
  FILES_MATCHING
    PATTERN "*.hpp"
    PATTERN "*.h"
)
```

The installed headers keep the same include style:

```cpp
#include <vix/cache.hpp>
#include <vix/cache/CachePolicy.hpp>
#include <vix/cache/FileStore.hpp>
```

In umbrella mode, header installation is handled by the umbrella build flow.

## Install target

The module installs the `vix_cache` target.

For static builds:

```cmake
install(TARGETS vix_cache
  EXPORT ${VIX_CACHE_EXPORT_SET}
  ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
  LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
  RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
  INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)
```

For interface builds:

```cmake
install(TARGETS vix_cache
  EXPORT ${VIX_CACHE_EXPORT_SET}
  INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)
```

The export set depends on the build mode.

## Export sets

The cache module uses different export sets depending on whether it is built inside the Vix umbrella.

Inside the Vix umbrella build:

```cmake
VixTargets
```

In standalone mode:

```cmake
vix_cacheTargets
```

This lets the same module participate in the full Vix package while still being installable and consumable as a standalone CMake package.

## Standalone package

In standalone mode, the module generates and installs package configuration files.

```cmake
vix_cacheConfig.cmake
vix_cacheConfigVersion.cmake
vix_cacheTargets.cmake
```

A downstream project can then use:

```cmake
find_package(vix_cache CONFIG REQUIRED)

target_link_libraries(my_app
  PRIVATE
    vix::cache
)
```

This is the normal CMake package flow for projects that consume the cache module after installation.

## Target properties

The module sets the public export name to `cache`.

```cmake
set_target_properties(vix_cache PROPERTIES
  OUTPUT_NAME vix_cache
  VERSION ${PROJECT_VERSION}
  SOVERSION 0
  EXPORT_NAME cache
)
```

This is what makes the installed namespaced target available as:

```cmake
vix::cache
```

## Build-only helpers

The cache module can link build-only helper targets when they exist.

```cmake
if (TARGET vix_warnings)
  target_link_libraries(vix_cache PRIVATE
    $<BUILD_INTERFACE:vix_warnings>
  )
endif()
```

Sanitizers are also treated as build-only support when enabled.

```cmake
if (VIX_ENABLE_SANITIZERS AND TARGET vix_sanitizers)
  target_link_libraries(vix_cache PRIVATE
    $<BUILD_INTERFACE:vix_sanitizers>
  )
endif()
```

These helpers should not leak into exported package interfaces.

## Complete standalone consumer example

A project consuming an installed standalone cache package can use this structure:

```cmake
cmake_minimum_required(VERSION 3.20)

project(cache_consumer LANGUAGES CXX)

find_package(vix_cache CONFIG REQUIRED)

add_executable(cache_consumer
  main.cpp
)

target_compile_features(cache_consumer
  PRIVATE
    cxx_std_20
)

target_link_libraries(cache_consumer
  PRIVATE
    vix::cache
)
```

If `main.cpp` uses `vix::print`, also find and link the IO module according to the way it is installed in the project:

```cmake
target_link_libraries(cache_consumer
  PRIVATE
    vix::cache
    vix::io
)
```

## Complete Vix module consumer example

Another Vix module can link cache like this:

```cmake
target_link_libraries(my_module
  PUBLIC
    vix::cache
)
```

Use `PUBLIC` when your module exposes cache types in its public headers.

```cpp
#include <vix/cache.hpp>

namespace my_module
{
  struct ResponseCache
  {
    vix::cache::CachePolicy policy;
  };
}
```

Use `PRIVATE` when cache is only an implementation detail.

```cmake
target_link_libraries(my_module
  PRIVATE
    vix::cache
)
```

## Common mistakes

### Linking the internal target in application code

Prefer the namespaced target:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
)
```

Avoid depending on the internal target name from consumer projects.

```cmake
target_link_libraries(my_app
  PRIVATE
    vix_cache
)
```

The internal target exists, but the public alias is the intended consumer surface.

### Forgetting `vix::io` in examples that print

The cache module does not provide `vix::print`.

```cpp
#include <vix/print.hpp>
```

When an example uses `vix::print`, link `vix::io`.

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
    vix::io
)
```

### Expecting cache to fetch dependencies in umbrella mode

In umbrella mode, dependencies are managed by the root Vix build. The cache module should not fetch sibling modules when it is part of the umbrella build.

Make sure `vix::net` and `vix::json` are available before configuring the cache module.

### Treating FileStore as a dependency-free feature

`FileStore` persists entries as JSON. The cache module therefore depends on the Vix JSON module.

```cmake
vix::json
```

This is already expressed through `vix::cache`, so consumers should not need to link it manually.

### Forgetting that context mapping uses net

`CacheContextMapper` uses the Vix network module.

```cpp
#include <vix/net/NetworkProbe.hpp>
```

The cache target publicly depends on the Vix net target so that this integration remains available to consumers.

## Next step

Continue with the API reference page for a compact lookup of the main cache types, methods, configuration structs, and helper functions.
