# CMake

Vix Realtime provides the public CMake target:

```text
vix::realtime
```

Applications using the module should link against this target.

## Basic usage

```cmake
find_package(vix_realtime CONFIG REQUIRED)

add_executable(app main.cpp)

target_link_libraries(
  app
  PRIVATE
  vix::realtime
)
```

The target requires C++20.

## Include Realtime

After linking `vix::realtime`, use the umbrella header:

```cpp
#include <vix/realtime.hpp>
```

You can also include individual public headers when needed.

## Build the module

From the Realtime source directory:

```bash
cmake -S . -B build
cmake --build build
```

The module requires CMake 3.20 or newer.

## Public targets

The module creates:

```text
vix_realtime
vix::realtime
```

`vix_realtime` is the concrete library target.

`vix::realtime` is the public namespaced target intended for applications:

```cmake
target_link_libraries(
  app
  PRIVATE
  vix::realtime
)
```

## C++ standard

Realtime requires C++20:

```cmake
target_compile_features(
  app
  PRIVATE
  cxx_std_20
)
```

Linking `vix::realtime` also propagates the C++20 requirement.

## Build options

Realtime provides these CMake options:

| Option                            | Default | Purpose                           |
| --------------------------------- | ------- | --------------------------------- |
| `VIX_REALTIME_FETCH_DEPENDENCIES` | `ON`    | Fetch missing Vix dependencies    |
| `VIX_REALTIME_WITH_WEBSOCKET`     | `ON`    | Build the WebSocket adapter       |
| `VIX_REALTIME_WITH_POSTGRES`      | `OFF`   | Build PostgreSQL stores           |
| `VIX_REALTIME_BUILD_TESTS`        | `OFF`   | Build Realtime tests              |
| `VIX_REALTIME_BUILD_EXAMPLES`     | `OFF`   | Build Realtime examples           |
| `VIX_REALTIME_ENABLE_INSTALL`     | `OFF`   | Generate standalone install rules |

## WebSocket support

The WebSocket adapter is enabled by default:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_WITH_WEBSOCKET=ON
```

When enabled, Realtime requires the Vix WebSocket module and builds `WebSocketAdapter`.

Disable it when the application does not need the built-in WebSocket integration:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_WITH_WEBSOCKET=OFF
```

The core room, session, event, persistence, replay, and presence APIs remain available.

See [WebSocket Integration](./websocket-integration).

## PostgreSQL support

PostgreSQL support is disabled by default.

Enable it with:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_WITH_POSTGRES=ON
```

This enables:

```text
PostgresEventStore
PostgresSnapshotStore
```

The build requires the Vix database module and PostgreSQL `libpq`.

Without this option, the PostgreSQL store implementation files are not compiled.

See [PostgreSQL](./postgresql).

## Build tests

Tests are disabled by default.

Enable them with:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_BUILD_TESTS=ON
```

Then build and run them:

```bash
cmake --build build
ctest --test-dir build
```

## Build examples

Examples are also disabled by default.

Enable them with:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_BUILD_EXAMPLES=ON
```

Then build normally:

```bash
cmake --build build
```

## Dependency resolution

Realtime depends on these Vix modules:

```text
vix::core
vix::error
vix::json
vix::async
vix::sync
vix::time
vix::utils
```

It also requires:

```text
Threads::Threads
```

WebSocket adds:

```text
vix::websocket
```

and PostgreSQL support adds:

```text
vix::db
```

## Fetch missing dependencies

By default:

```text
VIX_REALTIME_FETCH_DEPENDENCIES=ON
```

When a required Vix dependency is not already available as a CMake target, Realtime first checks for the corresponding sibling module.

For example:

```text
modules/
├── realtime/
├── json/
├── core/
└── async/
```

If no sibling module is available, Realtime can fetch the missing dependency from the Vix GitHub repositories.

Disable automatic fetching with:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_FETCH_DEPENDENCIES=OFF
```

With fetching disabled, every required dependency must already be available to the build.

## Using Realtime with `add_subdirectory`

Realtime can be included directly in a larger CMake project:

```cmake
add_subdirectory(realtime)

add_executable(app main.cpp)

target_link_libraries(
  app
  PRIVATE
  vix::realtime
)
```

If the required Vix targets already exist in the parent project, Realtime reuses them.

## Standalone installation

Standalone install rules are disabled by default:

```text
VIX_REALTIME_ENABLE_INSTALL=OFF
```

Enable them with:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_ENABLE_INSTALL=ON
```

Then install the package:

```bash
cmake --build build
cmake --install build
```

The installed package provides:

```cmake
find_package(vix_realtime CONFIG REQUIRED)
```

and the target:

```text
vix::realtime
```

## Installed dependencies

The standalone installed package resolves these required packages:

```text
vix_core
vix_error
vix_json
vix_async
vix_sync
vix_time
vix_utils
Threads
```

When WebSocket support was enabled while building the package, it also requires:

```text
vix_websocket
```

When PostgreSQL support was enabled, it also requires:

```text
vix_db
```

The feature choices used when building the installed Realtime package therefore affect its installed dependencies.

## Version

The current module version is:

```text
0.1.0
```

CMake also exposes compile definitions for the version:

```text
VIX_REALTIME_VERSION_MAJOR
VIX_REALTIME_VERSION_MINOR
VIX_REALTIME_VERSION_PATCH
```

Feature availability is exposed through:

```text
VIX_REALTIME_WITH_WEBSOCKET
VIX_REALTIME_WITH_POSTGRES
```

These definitions are propagated through the Realtime target.

## Common configurations

### Default

```bash
cmake -S . -B build
```

This uses:

```text
WebSocket     enabled
PostgreSQL    disabled
Tests         disabled
Examples      disabled
Install       disabled
```

### Without WebSocket

```bash
cmake -S . -B build \
  -DVIX_REALTIME_WITH_WEBSOCKET=OFF
```

### With PostgreSQL

```bash
cmake -S . -B build \
  -DVIX_REALTIME_WITH_POSTGRES=ON
```

### Development with tests

```bash
cmake -S . -B build \
  -DVIX_REALTIME_BUILD_TESTS=ON
```

## Application CMake example

A normal installed-package application only needs:

```cmake
cmake_minimum_required(VERSION 3.20)

project(my_app LANGUAGES CXX)

find_package(vix_realtime CONFIG REQUIRED)

add_executable(app main.cpp)

target_link_libraries(
  app
  PRIVATE
  vix::realtime
)
```

The application can then include:

```cpp
#include <vix/realtime.hpp>
```

The main CMake contract is therefore:

```text
find_package(vix_realtime)
        |
        v
    vix::realtime
        |
        v
   C++20 application
```

Continue with [API Reference](./api-reference) for the public Realtime types and interfaces.
